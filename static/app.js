/*
 * Shas Radar — frontend.
 *
 * Plain ES2020, no build step and no framework. The server does the matching
 * and returns the context window already sliced, so this file is only
 * concerned with asking, rendering, and the small interactions around a
 * result (copy, expand to full paragraph).
 */

(function () {
  "use strict";

  var form = document.getElementById("search-form");
  var input = document.getElementById("q");
  var submit = document.getElementById("submit");
  var results = document.getElementById("results");
  var toastEl = document.getElementById("toast");
  var wakingEl = document.getElementById("waking");
  var tractateSelect = document.getElementById("tractate");

  var before = 5;
  var after = 5;

  // Batch size for both the initial search and each "show more" page --
  // matches the server's own default limit (app/search.py DEFAULT_LIMIT).
  var PAGE_SIZE = 50;

  var inFlight = null;

  // --- Small helpers -----------------------------------------------------

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 1900);
  }

  function countPhrase(n, singular, plural) {
    if (n === 1) return "1 " + singular;
    return n.toLocaleString("he-IL") + " " + plural;
  }

  // Free hosts sleep the server when idle; show a notice only once a request
  // has been pending a couple of seconds, so it never flashes on a normal
  // warm response. Reference-counted since the initial page load fires two
  // requests (health + tractate list) at once.
  var WAKE_DELAY_MS = 2500;
  var wakeTimer = null;
  var wakingRefs = 0;

  function armWaking() {
    wakingRefs++;
    if (wakingRefs === 1) {
      wakeTimer = setTimeout(function () { wakingEl.hidden = false; }, WAKE_DELAY_MS);
    }
    var disarmed = false;
    return function disarmWaking() {
      if (disarmed) return;
      disarmed = true;
      wakingRefs = Math.max(0, wakingRefs - 1);
      if (wakingRefs === 0) {
        clearTimeout(wakeTimer);
        wakingEl.hidden = true;
      }
    };
  }

  // --- Stepper controls ----------------------------------------------------

  function wireStepper(containerId, min, max, onChange) {
    var container = document.getElementById(containerId);
    var output = container.querySelector(".stepper-value");
    var value = parseInt(output.textContent, 10);

    container.querySelectorAll(".stepper-btn").forEach(function (button) {
      button.addEventListener("click", function () {
        var step = parseInt(button.dataset.step, 10);
        value = Math.max(min, Math.min(max, value + step));
        output.textContent = String(value);
        onChange(value);
      });
    });
  }

  wireStepper("stepper-before", 1, 50, function (v) { before = v; });
  wireStepper("stepper-after", 1, 50, function (v) { after = v; });

  // --- Rendering -----------------------------------------------------------

  function copyButton(result) {
    var button = el("button", "copy", "העתקה");
    button.type = "button";

    button.addEventListener("click", function () {
      var quote = result.before + " " + result.match + " " + result.after;
      var payload = '"...' + quote.trim() + '..." (' + result.citation + ")";

      function done() {
        button.textContent = "✓ הועתק";
        button.classList.add("done");
        toast("הציטוט הועתק");
        setTimeout(function () {
          button.textContent = "העתקה";
          button.classList.remove("done");
        }, 1900);
      }

      function legacyCopy() {
        var area = document.createElement("textarea");
        area.value = payload;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        try {
          document.execCommand("copy");
          done();
        } catch (err) {
          toast("ההעתקה נכשלה");
        }
        document.body.removeChild(area);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(payload).then(done, legacyCopy);
      } else {
        legacyCopy();
      }
    });

    return button;
  }

  function resultCard(result) {
    var card = el("article", "card");

    var head = el("div", "card-head");
    head.appendChild(el("span", "badge badge-tractate", result.tractate.he));
    head.appendChild(el("span", "badge", result.citation));
    var kindLabel = result.kind === "exact" ? "התאמה מדויקת" : "עם אות שימוש";
    head.appendChild(el("span", "badge", kindLabel));
    card.appendChild(head);

    var kwic = el("p", "kwic");
    kwic.setAttribute("dir", "rtl");
    if (result.before) kwic.appendChild(el("span", "context", result.before + " "));
    kwic.appendChild(el("span", "match", result.match));
    if (result.after) kwic.appendChild(el("span", "context", " " + result.after));
    card.appendChild(kwic);

    var details = document.createElement("details");
    details.className = "paragraph";
    var summary = document.createElement("summary");
    summary.textContent = "הצג קטע מלא";
    details.appendChild(summary);
    var full = el("p", "paragraph-text", result.fullParagraph);
    details.appendChild(full);
    card.appendChild(details);

    var foot = el("div", "card-foot");
    foot.appendChild(copyButton(result));
    var link = document.createElement("a");
    link.href = result.sefariaUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "copy";
    link.textContent = "פתח בספריא ↗";
    foot.appendChild(link);
    card.appendChild(foot);

    return card;
  }

  function renderGroup(group, snapshot) {
    if (!group.total) {
      return notice(
        'לא נמצאו תוצאות עבור "' + group.query + '"',
        "נסו מילה אחרת, או בדקו את האיות."
      );
    }

    var section = el("section", "group");
    var head = el("div", "group-head");
    head.appendChild(el("h3", "group-title", group.query));
    var countLabel = el("span", "group-count");
    head.appendChild(countLabel);
    section.appendChild(head);

    if (!group.isPhrase && group.prefixTotal > 0) {
      var breakdown = el("p", "group-breakdown");
      var exactSpan = el("span", "tag-exact", group.exactTotal + " מדויק");
      var prefixSpan = el("span", "tag-prefix", group.prefixTotal + " עם אות שימוש");
      breakdown.appendChild(exactSpan);
      breakdown.appendChild(document.createTextNode(" · "));
      breakdown.appendChild(prefixSpan);
      section.appendChild(breakdown);
    }

    var list = el("div", "group-results");
    section.appendChild(list);
    group.results.forEach(function (result) {
      list.appendChild(resultCard(result));
    });

    var shownCount = group.results.length;

    function updateCountLabel() {
      countLabel.textContent = shownCount < group.total
        ? "מציג " + shownCount + " מתוך " + countPhrase(group.total, "תוצאה", "תוצאות")
        : countPhrase(group.total, "תוצאה", "תוצאות");
    }
    updateCountLabel();

    if (shownCount < group.total) {
      section.appendChild(moreButton(group, snapshot, list, {
        get shownCount() { return shownCount; },
        addShown: function (n) { shownCount += n; updateCountLabel(); },
      }));
    }

    return section;
  }

  // A group's own "show more": re-searches the same single term with a
  // growing `offset` and appends the next page, rather than being stuck
  // with whatever the original search's `limit` capped at -- a common word
  // like אביי or רבא has thousands of hits, far past any first page.
  function moreButton(group, snapshot, list, state) {
    var wrap = el("div", "more-wrap");
    var button = el("button", "more");
    button.type = "button";
    wrap.appendChild(button);

    function remaining() {
      return group.total - state.shownCount;
    }
    function setLabel() {
      button.disabled = false;
      button.textContent = "הצג עוד " + Math.min(PAGE_SIZE, remaining());
    }
    setLabel();

    button.addEventListener("click", function () {
      button.disabled = true;
      button.textContent = "טוען…";

      var params = new URLSearchParams({
        q: group.query,
        before: String(snapshot.before),
        after: String(snapshot.after),
        offset: String(state.shownCount),
        limit: String(PAGE_SIZE),
      });
      if (snapshot.tractate) params.set("tractate", snapshot.tractate);

      fetch("/api/search?" + params.toString())
        .then(function (response) { return response.json(); })
        .then(function (data) {
          var page = data.groups[0];
          page.results.forEach(function (result) {
            list.appendChild(resultCard(result));
          });
          state.addShown(page.results.length);
          if (remaining() <= 0) {
            wrap.remove();
          } else {
            setLabel();
          }
        })
        .catch(function () {
          button.disabled = false;
          button.textContent = "השגיאה בטעינה — נסו שוב";
        });
    });

    return wrap;
  }

  function notice(title, body, className) {
    var box = el("div", className || "empty");
    box.appendChild(el("strong", null, title));
    box.appendChild(document.createTextNode(body));
    return box;
  }

  function render(data, snapshot) {
    results.innerHTML = "";
    data.groups.forEach(function (group) {
      results.appendChild(renderGroup(group, snapshot));
    });
  }

  function renderSkeleton() {
    results.innerHTML = "";
    for (var i = 0; i < 3; i++) {
      var card = el("article", "card skeleton");
      for (var j = 0; j < 4; j++) card.appendChild(el("div", "line"));
      results.appendChild(card);
    }
  }

  // --- Searching -------------------------------------------------------------

  function runSearch(query, pushHash) {
    query = (query || "").trim();
    if (!query) {
      input.focus();
      return;
    }

    input.value = query;
    if (pushHash !== false) {
      var encoded = "#q=" + encodeURIComponent(query);
      if (location.hash !== encoded) history.pushState(null, "", encoded);
    }

    if (inFlight) inFlight.abort();
    var controller = new AbortController();
    inFlight = controller;

    submit.disabled = true;
    results.setAttribute("aria-busy", "true");
    renderSkeleton();
    var disarmWaking = armWaking();

    // Snapshotted so a later "show more" click on this render keeps
    // requesting with the same context/filter, even if the steppers or the
    // tractate filter change in the meantime for the *next* search.
    var snapshot = { before: before, after: after, tractate: tractateSelect.value };

    var params = new URLSearchParams({
      q: query,
      before: String(snapshot.before),
      after: String(snapshot.after),
      limit: String(PAGE_SIZE),
    });
    if (snapshot.tractate) params.set("tractate", snapshot.tractate);

    fetch("/api/search?" + params.toString(), { signal: controller.signal })
      .then(function (response) {
        return response.json().then(function (body) {
          if (!response.ok) throw new Error(body.error || "החיפוש נכשל");
          return body;
        });
      })
      .then(function (data) {
        render(data, snapshot);
        results.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch(function (error) {
        if (error.name === "AbortError") return;
        results.innerHTML = "";
        results.appendChild(notice("שגיאה", error.message, "error"));
      })
      .then(function () {
        if (inFlight === controller) {
          inFlight = null;
          submit.disabled = false;
          results.setAttribute("aria-busy", "false");
        }
        disarmWaking();
      });
  }

  // --- Wiring ------------------------------------------------------------

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    input.blur();
    runSearch(input.value);
  });

  document.getElementById("examples").addEventListener("click", function (event) {
    var chip = event.target.closest(".chip");
    if (chip) runSearch(chip.dataset.q);
  });

  function fromHash() {
    var match = /^#q=(.*)$/.exec(location.hash);
    return match ? decodeURIComponent(match[1]) : "";
  }

  window.addEventListener("popstate", function () {
    var query = fromHash();
    if (query) runSearch(query, false);
  });

  // Populate the tractate filter, grouped by seder.
  var disarmTractateWaking = armWaking();
  fetch("/api/tractates")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var bySeder = {};
      var order = [];
      data.tractates.forEach(function (t) {
        if (!bySeder[t.sederHe]) {
          bySeder[t.sederHe] = [];
          order.push(t.sederHe);
        }
        bySeder[t.sederHe].push(t);
      });
      order.forEach(function (seder) {
        var group = document.createElement("optgroup");
        group.label = seder;
        bySeder[seder].forEach(function (t) {
          var option = document.createElement("option");
          option.value = t.he;
          option.textContent = t.he;
          group.appendChild(option);
        });
        tractateSelect.appendChild(group);
      });
    })
    .catch(function () { /* the filter just stays at "all of Shas" */ })
    .then(disarmTractateWaking);

  var disarmHealthWaking = armWaking();
  fetch("/api/health")
    .then(function (r) { return r.json(); })
    .then(function (health) {
      document.getElementById("verse-count").textContent =
        health.words.toLocaleString("he-IL") + " מילים, " + health.tractates + " מסכתות.";
    })
    .catch(function () { /* the footer count is decorative */ })
    .then(disarmHealthWaking);

  var initial = fromHash();
  if (initial) runSearch(initial, false);
})();
