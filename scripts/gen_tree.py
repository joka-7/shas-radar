#!/usr/bin/env python3
"""Generate or check the annotated repository tree used in the docs.

Walks the repository, renders it as the fenced block that sits between
``<!-- BEGIN GENERATED TREE -->``/``<!-- END GENERATED TREE -->`` markers in
``docs/STRUCTURE.md`` and (at ``--max-depth 1``) in ``README.md``, and either
writes that block in place or, with ``--check``, fails if the committed block
doesn't match what a fresh run would produce -- the CI gate that keeps the
directory map from drifting away from the real layout.

The tree is built from ``git ls-files`` (tracked plus untracked-but-not-
ignored), not a raw directory walk -- so a stray local artifact (a
``.coverage`` file, an editor's cache) can never leak into a committed doc,
and the generator needs no gitignore parsing of its own.

A file's one-line description is derived from the file itself rather than
hand-maintained here: a Python module's docstring first line, or a Markdown
file's first heading -- so the description can only go stale by the file it
describes actually changing.

    python scripts/gen_tree.py --project . --output docs/STRUCTURE.md --check
    python scripts/gen_tree.py --project . --output README.md --max-depth 1 --check
"""

from __future__ import annotations

import argparse
import ast
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

BEGIN = "<!-- BEGIN GENERATED TREE (depth={depth} entries={entries}) -->"
END = "<!-- END GENERATED TREE -->"


@dataclass
class Node:
    """One entry in the tree: a file, or a directory with its own children."""

    name: str
    path: Path
    children: dict[str, Node] = field(default_factory=dict)

    @property
    def is_dir(self) -> bool:
        return bool(self.children)


def tracked_files(project: Path) -> list[Path]:
    """Every path `git` would consider part of the repo, relative to `project`."""
    output = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
        cwd=project,
        capture_output=True,
        check=True,
        text=True,
    ).stdout
    return [Path(line) for line in output.splitlines() if line]


def build_tree(project: Path) -> Node:
    root = Node(name=project.name, path=project)
    for relative in tracked_files(project):
        node = root
        for part in relative.parts[:-1]:
            node = node.children.setdefault(part, Node(name=part, path=node.path / part))
        leaf = relative.parts[-1]
        node.children[leaf] = Node(name=leaf, path=node.path / leaf)
    return root


def describe(path: Path) -> str:
    """One-line description of `path`, or "" if none can be derived."""
    if path.suffix == ".py":
        try:
            module = ast.parse(path.read_text(encoding="utf-8"))
        except (SyntaxError, UnicodeDecodeError, OSError):
            return ""
        docstring = ast.get_docstring(module)
        if not docstring:
            return ""
        first_paragraph = docstring.strip().split("\n\n", 1)[0]
        return " ".join(first_paragraph.split())
    if path.name == "README.md":
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.startswith("# "):
                return line.removeprefix("# ").strip()
    return ""


def render(node: Node, prefix: str, depth: int, max_depth: int | None) -> list[str]:
    entries = sorted(node.children.values(), key=lambda n: (not n.is_dir, n.name))
    if not entries:
        return []

    names = [f"{n.name}/" if n.is_dir else n.name for n in entries]
    width = max(len(n) for n in names)

    lines = []
    for index, (child, name) in enumerate(zip(entries, names, strict=True)):
        last = index == len(entries) - 1
        branch = "└── " if last else "├── "
        desc = "" if child.is_dir else describe(child.path)
        entry = f"{name:<{width}}  # {desc}" if desc else name
        lines.append(f"{prefix}{branch}{entry}")

        if child.is_dir and (max_depth is None or depth < max_depth):
            child_prefix = prefix + ("    " if last else "│   ")
            lines.extend(render(child, child_prefix, depth + 1, max_depth))
    return lines


def build_block(project: Path, max_depth: int | None) -> str:
    tree = build_tree(project)
    lines = [f"{tree.name}/", *render(tree, "", 1, max_depth)]
    depth_label = str(max_depth) if max_depth is not None else "all"
    return "\n".join(
        [
            BEGIN.format(depth=depth_label, entries="all"),
            "```text",
            "\n".join(lines),
            "```",
            END,
        ]
    )


def replace_block(document: str, block: str) -> str:
    start = document.find(BEGIN.split("(")[0])
    end = document.find(END)
    if start == -1 or end == -1:
        raise ValueError("no <!-- BEGIN/END GENERATED TREE --> markers found")
    end += len(END)
    return document[:start] + block + document[end:]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, type=Path, help="repository root")
    parser.add_argument("--output", required=True, type=Path, help="file holding the markers")
    parser.add_argument("--max-depth", type=int, default=None, help="omit for the full tree")
    parser.add_argument("--check", action="store_true", help="fail if the file would change")
    args = parser.parse_args()

    project = args.project.resolve()
    block = build_block(project, args.max_depth)
    output = args.output if args.output.is_absolute() else project / args.output
    updated = replace_block(output.read_text(encoding="utf-8"), block)

    if args.check:
        if output.read_text(encoding="utf-8") != updated:
            print(f"{output} is out of date -- run gen_tree.py without --check", file=sys.stderr)
            return 1
        print(f"{output} matches the real tree.")
        return 0

    output.write_text(updated, encoding="utf-8")
    print(f"Wrote {output}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
