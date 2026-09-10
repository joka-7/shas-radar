/*
 * Shas Radar — frontend.
 *
 * Plain ES2020, no build step and no framework. The server does the matching
 * and returns the context window already sliced, so this file is only
 * concerned with asking, rendering, and the small interactions around a
 * result (copy, expand to full paragraph, language switching).
 *
 * The UI supports Hebrew, English and French (see i18n.js, loaded before
 * this file). The Talmud text itself -- KWIC context, the full paragraph,
 * and the citation -- is never translated; it stays in the original
 * Hebrew/Aramaic in every locale, same as פסוק לשם never translates a verse.
 */

(function () {
  "use strict";

  var t = I18N.t;
  var plural = I18N.plural;

  var LOCALE_STORAGE_KEY = "shas-radar:locale";

  var form = document.getElementById("search-form");
  var input = document.getElementById("q");
  var submit = document.getElementById("submit");
  var results = document.getElementById("results");
  var toastEl = document.getElementById("toast");
  var wakingEl = document.getElementById("waking");
  var tractateSelect = document.getElementById("tractate");
  var langSwitch = document.getElementById("lang-switch");
  var installBtn = document.getElementById("install-btn");
  var settingsBtn = document.getElementById("settings-btn");
  var aiDialog = document.getElementById("ai-settings-dialog");
  var aiTabsEl = document.getElementById("ai-provider-tabs");
  var aiPanelEl = document.getElementById("ai-provider-panel");
  var aiExternalLinksEl = document.getElementById("ai-external-links");

  var before = 5;
  var after = 5;

  // Batch size for both the initial search and each "show more" page --
  // matches the server's own default limit (app/search.py DEFAULT_LIMIT).
  var PAGE_SIZE = 50;

  var inFlight = null;

  // The current UI language, and enough state to redraw without a network
  // round-trip when it changes: the last successful search response (plus
  // the before/after/tractate it was made with), the tractate list (its
  // option labels are locale-dependent), and the footer's word/tractate
  // totals.
  var locale = loadLocale();
  var lastSearchData = null;
  var lastSnapshot = null;
  var lastTractates = null;
  var lastHealth = null;
  var lastAiStatus = null;

  function loadLocale() {
    try {
      var stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && I18N.isSupported(stored)) return stored;
    } catch (err) {
      /* private browsing / storage disabled -- fall through to the default */
    }
    return I18N.DEFAULT_LOCALE;
  }

  function saveLocale(value) {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, value);
    } catch (err) {
      /* not persisted this session; the switcher still works */
    }
  }

  var DIR = { he: "rtl", en: "ltr", fr: "ltr" };

  // --- Small helpers -----------------------------------------------------

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /*
   * A run of Hebrew/Aramaic text (a citation, the search term itself)
   * embedded inside a page that may currently be laid out left-to-right.
   * Isolating it keeps the bidi algorithm from reordering it around
   * neighbouring punctuation -- without this, a citation like "ברכות ה."
   * can render with the period on the wrong side once the page itself is
   * ltr for en/fr.
   */
  function hebrewSpan(tag, className, text) {
    var node = el(tag, className, text);
    node.setAttribute("dir", "rtl");
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

  // Tractate/seder names switch with the locale using the English name
  // already carried on every match and in /api/tractates. There's no
  // separate set of French names, so French falls back to English rather
  // than leaving just this one label in Hebrew.
  function localizedName(he, en) {
    return locale === "he" ? he : (en || he);
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
    var button = el("button", "copy", t(locale, "copy.button"));
    button.type = "button";

    button.addEventListener("click", function () {
      var quote = result.before + " " + result.match + " " + result.after;
      var payload = '"...' + quote.trim() + '..." (' + result.citation + ")";

      function done() {
        button.textContent = t(locale, "copy.done");
        button.classList.add("done");
        toast(t(locale, "copy.toastCopied"));
        setTimeout(function () {
          button.textContent = t(locale, "copy.button");
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
          toast(t(locale, "copy.toastFailed"));
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

  /*
   * Hands the result off to whatever the OS offers to share text with
   * (Messages, WhatsApp, Mail, …) via the Web Share API. Browsers without it
   * (most desktop browsers) fall back to the same clipboard copy the Copy
   * button does, so the action is never a dead end -- just a slower one.
   */
  function shareButton(result) {
    var button = el("button", "copy", t(locale, "share.button"));
    button.type = "button";

    button.addEventListener("click", function () {
      var quote = result.before + " " + result.match + " " + result.after;
      var payload = '"...' + quote.trim() + '..." (' + result.citation + ")";

      function legacyCopy() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(payload).then(function () {
            toast(t(locale, "copy.toastCopied"));
          }, function () {
            toast(t(locale, "copy.toastFailed"));
          });
          return;
        }
        var area = document.createElement("textarea");
        area.value = payload;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        try {
          document.execCommand("copy");
          toast(t(locale, "copy.toastCopied"));
        } catch (err) {
          toast(t(locale, "copy.toastFailed"));
        }
        document.body.removeChild(area);
      }

      if (navigator.share) {
        navigator.share({ text: payload }).catch(function (err) {
          if (err && err.name === "AbortError") return; // the visitor cancelled the share sheet
          legacyCopy();
        });
      } else {
        legacyCopy();
      }
    });

    return button;
  }

  // --- AI-connections selection --------------------------------------------
  //
  // Opt-in: every result card carries its own checkbox (see resultCard),
  // none checked by default. Only cards actually rendered on screen can be
  // selected at all -- there's no "select everything, including results not
  // yet loaded" shortcut, so what gets sent to the AI is always exactly what
  // the visitor can see and has chosen. Capped at SELECTION_CAP total across
  // every group, matching app/ai.py's own per-request prompt-size caps.
  var SELECTION_CAP = 15;

  function createSelection() {
    var byQuery = {}; // query -> array of result refs, insertion order
    var order = []; // query insertion order, so groups() has a stable shape
    var listeners = [];

    function count() {
      var total = 0;
      for (var q in byQuery) total += byQuery[q].length;
      return total;
    }

    var api = {
      toggle: function (query, result, checked) {
        var arr = byQuery[query];
        if (!arr) {
          arr = byQuery[query] = [];
          order.push(query);
        }
        var idx = arr.indexOf(result);
        if (checked && idx === -1) {
          if (count() >= SELECTION_CAP) return false; // cap reached, not applied
          arr.push(result);
        } else if (!checked && idx !== -1) {
          arr.splice(idx, 1);
        }
        listeners.forEach(function (fn) { fn(); });
        return true;
      },
      isSelected: function (query, result) {
        var arr = byQuery[query];
        return !!arr && arr.indexOf(result) !== -1;
      },
      count: count,
      groups: function () {
        return order
          .map(function (q) { return { query: q, results: byQuery[q].slice() }; })
          .filter(function (g) { return g.results.length > 0; });
      },
      onChange: function (fn) { listeners.push(fn); },
    };
    return api;
  }

  function resultCard(result, query, selection) {
    var card = el("article", "card");

    var head = el("div", "card-head");
    head.appendChild(el("span", "badge badge-tractate", localizedName(result.tractate.he, result.tractate.en)));
    head.appendChild(hebrewSpan("span", "badge", result.citation));
    var kindLabel = t(locale, result.kind === "exact" ? "matchKind.exact" : "matchKind.withPrefix");
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
    summary.textContent = t(locale, "result.showFullParagraph");
    details.appendChild(summary);
    details.appendChild(hebrewSpan("p", "paragraph-text", result.fullParagraph));
    card.appendChild(details);

    var foot = el("div", "card-foot");
    foot.appendChild(copyButton(result));
    foot.appendChild(shareButton(result));
    var link = document.createElement("a");
    link.href = result.sefariaUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "copy";
    link.textContent = t(locale, "openInSefaria");
    foot.appendChild(link);
    // Same row, same size, as copy/Sefaria above -- a third pill-shaped
    // control rather than a separate label sitting above the card, which
    // read as unrelated to this card's own actions.
    var selectBtn = el("label", "copy select-ai");
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "select-ai-checkbox";
    checkbox.checked = selection.isSelected(query, result);
    if (checkbox.checked) selectBtn.classList.add("checked");
    checkbox.addEventListener("change", function () {
      var ok = selection.toggle(query, result, checkbox.checked);
      if (!ok) {
        checkbox.checked = false; // reverted -- the cap was already reached
        toast(t(locale, "connections.selectionCapToast", { n: SELECTION_CAP }));
      }
      selectBtn.classList.toggle("checked", checkbox.checked);
    });
    selectBtn.appendChild(checkbox);
    selectBtn.appendChild(document.createTextNode(t(locale, "connections.selectForAi")));
    foot.appendChild(selectBtn);
    card.appendChild(foot);

    return card;
  }

  function renderGroup(group, snapshot, selection) {
    if (!group.total) {
      return notice(
        t(locale, "result.empty.title", { query: group.query }),
        t(locale, "result.empty.body")
      );
    }

    var section = el("section", "group");
    var head = el("div", "group-head");
    head.appendChild(hebrewSpan("h3", "group-title", group.query));
    var countLabel = el("span", "group-count");
    head.appendChild(countLabel);
    section.appendChild(head);

    if (group.prefixTotal > 0) {
      var breakdown = el("p", "group-breakdown");
      var exactSpan = el("span", "tag-exact", t(locale, "matchKind.exactTag", { n: I18N.formatNumber(locale, group.exactTotal) }));
      var prefixSpan = el("span", "tag-prefix", t(locale, "matchKind.withPrefixTag", { n: I18N.formatNumber(locale, group.prefixTotal) }));
      breakdown.appendChild(exactSpan);
      breakdown.appendChild(document.createTextNode(" · "));
      breakdown.appendChild(prefixSpan);
      section.appendChild(breakdown);
    }

    var list = el("div", "group-results");
    section.appendChild(list);
    // Tracked across both this initial batch and every later "show more"
    // page (they share this object by reference), so the divider lands in
    // the right place even when a page happens to straddle the exact/
    // with-prefix boundary -- matches are already sorted exact-first, but
    // that boundary can fall in the middle of any page, not just the first.
    var kindSoFar = { last: null };
    appendResults(list, group.results, kindSoFar, group.query, selection);

    var shownCount = group.results.length;

    function updateCountLabel() {
      countLabel.textContent = shownCount < group.total
        ? t(locale, "result.showingOf", { shown: I18N.formatNumber(locale, shownCount), totalPhrase: plural(locale, "result.total", group.total) })
        : plural(locale, "result.total", group.total);
    }
    updateCountLabel();

    if (shownCount < group.total) {
      section.appendChild(moreButton(group, snapshot, list, kindSoFar, selection, {
        get shownCount() { return shownCount; },
        addShown: function (n) { shownCount += n; updateCountLabel(); },
      }));
    }

    return section;
  }

  // Appends result cards to `list`, inserting a subheading exactly where
  // the list crosses from exact matches into with-prefix ones -- otherwise
  // the two kinds run together with nothing but each card's own small badge
  // to tell them apart, even though the breakdown line above already
  // promises they're two distinct groups. `query`/`selection` let each
  // card's own AI-selection checkbox (see resultCard) participate in the
  // same selection regardless of whether it came from the initial page or
  // a later "show more" page.
  function appendResults(list, results, kindSoFar, query, selection) {
    results.forEach(function (result) {
      if (kindSoFar.last === "exact" && result.kind === "withPrefix") {
        list.appendChild(el("h4", "group-subheading", t(locale, "matchKind.withPrefix")));
      }
      list.appendChild(resultCard(result, query, selection));
      kindSoFar.last = result.kind;
    });
  }

  // A group's own "show more": re-searches the same single term with a
  // growing `offset` and appends the next page, rather than being stuck
  // with whatever the original search's `limit` capped at -- a common word
  // like אביי or רבא has thousands of hits, far past any first page.
  function moreButton(group, snapshot, list, kindSoFar, selection, state) {
    var wrap = el("div", "more-wrap");
    var button = el("button", "more");
    button.type = "button";
    wrap.appendChild(button);

    function remaining() {
      return group.total - state.shownCount;
    }
    function setLabel() {
      button.disabled = false;
      button.textContent = t(locale, "more.button", { n: I18N.formatNumber(locale, Math.min(PAGE_SIZE, remaining())) });
    }
    setLabel();

    button.addEventListener("click", function () {
      button.disabled = true;
      button.textContent = t(locale, "more.loading");

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
          appendResults(list, page.results, kindSoFar, group.query, selection);
          state.addShown(page.results.length);
          if (remaining() <= 0) {
            wrap.remove();
          } else {
            setLabel();
          }
        })
        .catch(function () {
          button.disabled = false;
          button.textContent = t(locale, "more.error");
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

  // --- AI settings: bring-your-own-key (BYOK) -----------------------------
  //
  // The server may already have a shared key for a vendor (see /api/ai-status);
  // a visitor can also add their own, per vendor, several pooled together for
  // redundancy. Keys live only in this browser's localStorage and are sent
  // with an /api/analyze request only, never persisted anywhere server-side
  // (see app/ai.py's module docstring / README's "AI connections" section).

  var AI_KEYS_STORAGE_KEY = "shas-radar:ai-keys";

  var AI_PROVIDERS = [
    { id: "gemini", label: "Gemini", keyUrl: "https://aistudio.google.com/apikey", free: true },
    { id: "openai", label: "OpenAI (GPT)", keyUrl: "https://platform.openai.com/api-keys" },
    { id: "anthropic", label: "Claude (Anthropic)", keyUrl: "https://console.anthropic.com/settings/keys" },
  ];

  var activeAiProvider = AI_PROVIDERS[0].id;

  function loadAiKeyMap() {
    try {
      var raw = localStorage.getItem(AI_KEYS_STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      var map = {};
      AI_PROVIDERS.forEach(function (p) {
        var keys = parsed[p.id];
        if (Array.isArray(keys)) {
          map[p.id] = keys.filter(function (k) { return typeof k === "string" && k.trim(); });
        }
      });
      return map;
    } catch (err) {
      return {}; // private browsing / storage disabled / corrupted JSON
    }
  }

  function saveAiKeyMap(map) {
    try {
      localStorage.setItem(AI_KEYS_STORAGE_KEY, JSON.stringify(map));
    } catch (err) {
      /* not persisted this session -- the panel still works for one request */
    }
  }

  function getAiKeys(providerId) {
    return loadAiKeyMap()[providerId] || [];
  }

  /* "added" | "empty" | "duplicate" -- a return value the caller can always
   * turn into visible feedback, so pressing Add is never a silent no-op
   * (an empty field or a key already saved for this provider used to fail
   * with nothing on screen to explain why). */
  function addAiKey(providerId, rawKey) {
    var trimmed = (rawKey || "").trim();
    if (!trimmed) return "empty";
    var map = loadAiKeyMap();
    var existing = map[providerId] || [];
    if (existing.indexOf(trimmed) !== -1) return "duplicate";
    map[providerId] = existing.concat([trimmed]);
    saveAiKeyMap(map);
    return "added";
  }

  function removeAiKey(providerId, key) {
    var map = loadAiKeyMap();
    var next = (map[providerId] || []).filter(function (k) { return k !== key; });
    if (next.length) {
      map[providerId] = next;
    } else {
      delete map[providerId];
    }
    saveAiKeyMap(map);
  }

  /* Every saved provider + its pooled keys, shaped for POST /api/analyze's
   * `credentials` field. Providers with no saved key are omitted. */
  function getAllAiCredentials() {
    var map = loadAiKeyMap();
    return AI_PROVIDERS
      .map(function (p) { return { provider: p.id, apiKeys: map[p.id] || [] }; })
      .filter(function (c) { return c.apiKeys.length > 0; });
  }

  function maskKey(key) {
    return key.length <= 8 ? "••••" : key.slice(0, 4) + "…" + key.slice(-4);
  }

  function renderAiProviderTabs() {
    aiTabsEl.innerHTML = "";
    AI_PROVIDERS.forEach(function (p) {
      var btn = el("button", "ai-provider-tab" + (p.id === activeAiProvider ? " active" : ""), p.label);
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", p.id === activeAiProvider ? "true" : "false");
      btn.addEventListener("click", function () {
        activeAiProvider = p.id;
        renderAiProviderTabs();
        renderAiProviderPanel();
      });
      aiTabsEl.appendChild(btn);
    });
  }

  function renderAiProviderPanel() {
    aiPanelEl.innerHTML = "";
    var provider = AI_PROVIDERS.filter(function (p) { return p.id === activeAiProvider; })[0];
    if (!provider) return;

    var serverHas = !!(lastAiStatus && lastAiStatus.providers && lastAiStatus.providers[provider.id]);
    aiPanelEl.appendChild(el(
      "p",
      "ai-provider-status " + (serverHas ? "available" : "unavailable"),
      t(locale, serverHas ? "aiSettings.serverAvailable" : "aiSettings.serverUnavailable")
    ));

    var getKey = el("p", "ai-provider-getkey");
    getKey.appendChild(document.createTextNode(t(locale, "aiSettings.getKeyPrefix")));
    var keyLink = document.createElement("a");
    keyLink.href = provider.keyUrl;
    keyLink.target = "_blank";
    keyLink.rel = "noopener noreferrer";
    keyLink.textContent = provider.keyUrl.replace(/^https:\/\//, "");
    getKey.appendChild(keyLink);
    if (provider.free) {
      getKey.appendChild(document.createTextNode(" · "));
      getKey.appendChild(el("span", "free-tag", t(locale, "aiSettings.freeTag")));
    }
    aiPanelEl.appendChild(getKey);

    var keys = getAiKeys(provider.id);
    var list = el("div", "ai-key-list");
    if (keys.length) {
      keys.forEach(function (key) {
        var row = el("div", "ai-key-row");
        row.appendChild(el("span", "ai-key-masked", maskKey(key)));
        var removeBtn = el("button", "ai-key-remove", "✕");
        removeBtn.type = "button";
        removeBtn.setAttribute("aria-label", t(locale, "aiSettings.removeAria", { key: maskKey(key) }));
        removeBtn.addEventListener("click", function () {
          removeAiKey(provider.id, key);
          toast(t(locale, "aiSettings.keyRemovedToast"));
          renderAiProviderPanel();
        });
        row.appendChild(removeBtn);
        list.appendChild(row);
      });
    } else {
      list.appendChild(el("p", "ai-key-empty", t(locale, "aiSettings.noKeysYet")));
    }
    aiPanelEl.appendChild(list);

    var addRow = el("div", "ai-key-add");
    var keyInput = document.createElement("input");
    keyInput.type = "password";
    keyInput.placeholder = t(locale, "aiSettings.keyPlaceholder");
    keyInput.className = "ai-key-input";
    keyInput.autocomplete = "off";

    var showBtn = el("button", "ai-key-show", "👁");
    showBtn.type = "button";
    var shown = false;
    showBtn.setAttribute("aria-label", t(locale, "aiSettings.showAria"));
    showBtn.addEventListener("click", function () {
      shown = !shown;
      keyInput.type = shown ? "text" : "password";
      showBtn.setAttribute("aria-label", t(locale, shown ? "aiSettings.hideAria" : "aiSettings.showAria"));
    });

    var addBtn = el("button", "ai-key-addbtn", t(locale, "aiSettings.addKey"));
    addBtn.type = "button";
    function doAdd() {
      var outcome = addAiKey(provider.id, keyInput.value);
      if (outcome === "added") {
        toast(t(locale, "aiSettings.keySavedToast"));
        keyInput.value = "";
        renderAiProviderPanel();
      } else if (outcome === "duplicate") {
        toast(t(locale, "aiSettings.keyDuplicateToast"));
      } else {
        toast(t(locale, "aiSettings.keyEmptyToast"));
        keyInput.focus();
      }
    }
    addBtn.addEventListener("click", doAdd);
    keyInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        doAdd();
      }
    });

    addRow.appendChild(keyInput);
    addRow.appendChild(showBtn);
    addRow.appendChild(addBtn);
    aiPanelEl.appendChild(addRow);
  }

  function renderAiExternalLinks() {
    aiExternalLinksEl.innerHTML = "";
    aiExternalLinksEl.appendChild(externalChatLinks(null));
  }

  function openAiSettings() {
    renderAiProviderTabs();
    renderAiProviderPanel();
    renderAiExternalLinks();
    if (typeof aiDialog.showModal === "function") {
      aiDialog.showModal();
    } else {
      aiDialog.setAttribute("open", ""); // very old browser: falls back to non-modal
    }
  }

  settingsBtn.addEventListener("click", openAiSettings);

  // --- External AI fallback ------------------------------------------------
  //
  // No key configured at all (server or BYOK), or the request came back
  // blocked/exhausted -- rather than a dead end, hand the same question to a
  // free, public AI chat product in a new tab. No key, no backend call: the
  // question is copied to the clipboard (since a target site's prefill
  // parameter is an unofficial, unstable convention that might not land the
  // text) and the site opens ready to paste it in.

  var EXTERNAL_CHAT_PROVIDERS = [
    {
      id: "chatgpt", name: "ChatGPT", homeUrl: "https://chatgpt.com/",
      buildUrl: function (q) { return "https://chatgpt.com/?" + new URLSearchParams({ q: q, hints: "search" }); },
    },
    {
      id: "claude", name: "Claude", homeUrl: "https://claude.ai/new",
      buildUrl: function (q) { return "https://claude.ai/new?" + new URLSearchParams({ q: q }); },
    },
    {
      // The actual Gemini app -- gemini.google.com has no known prefill
      // parameter (unlike ChatGPT/Claude above), so this one has no
      // buildUrl; externalChatLinks still copies the question to the
      // clipboard first so it's ready to paste once the app opens. Not to
      // be confused with Google Search's "AI Mode" below, which *is*
      // pre-fillable but is a different product from Gemini itself.
      id: "gemini", name: "Gemini", homeUrl: "https://gemini.google.com/app", buildUrl: null,
    },
    {
      id: "google-ai-mode", nameKey: "external.googleAiMode", homeUrl: "https://www.google.com/",
      buildUrl: function (q) { return "https://www.google.com/search?" + new URLSearchParams({ q: q, udm: "50" }); },
    },
  ];

  function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () { /* nothing actionable here */ });
      }
    } catch (err) { /* best effort only */ }
  }

  /* Plain-text version of the same question app/ai.py asks the model --
   * doesn't need to match its engineered prompt verbatim, just give an
   * external chat enough context to work with. Localized to the current UI
   * language (the intro line only -- the Talmud text and citations inside
   * it stay Hebrew/Aramaic regardless, same as everywhere else in this app). */
  function externalQuestionText(groups) {
    var lines = [t(locale, "external.questionIntro"), ""];
    groups.slice(0, 5).forEach(function (group) {
      lines.push("Query: " + group.query);
      group.results.slice(0, 6).forEach(function (result) {
        lines.push("- (" + result.citation + ") " + result.before + " " + result.match + " " + result.after);
      });
      lines.push("");
    });
    return lines.join("\n").trim();
  }

  /* A row of provider links. With `question`, a link that supports a
   * prefill parameter opens pre-filled; every link (prefillable or not)
   * copies the question to the clipboard first, so a provider like Gemini
   * with no known prefill parameter still opens ready to paste into. With
   * `question` omitted (the settings dialog's generic "no key at all"
   * list, not tied to any particular search), every link just opens the
   * plain homepage and nothing is copied. */
  function externalChatLinks(question) {
    var wrap = el("div", "external-links");
    EXTERNAL_CHAT_PROVIDERS.forEach(function (provider) {
      var link = document.createElement("a");
      link.className = "external-link";
      link.textContent = provider.nameKey ? t(locale, provider.nameKey) : provider.name;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.href = (question && provider.buildUrl) ? provider.buildUrl(question) : provider.homeUrl;
      if (question) {
        link.addEventListener("click", function () {
          copyToClipboard(question);
          toast(t(locale, "external.copiedToast"));
        });
      }
      wrap.appendChild(link);
    });
    return wrap;
  }

  // --- AI connections (optional) ------------------------------------------
  //
  // Section itself renders whenever there are at least 2 individual result
  // rows on screen to relate to each other -- true both for a single search
  // term with several occurrences (look for a pattern across them) and for
  // several comma-separated terms (look for what links them), so the gate is
  // on total result count, not on how many groups the query happened to have
  // (see hasEnoughToConnect below). What actually gets sent is opt-in, not
  // automatic: each visible result card has its own checkbox (none checked
  // by default -- see resultCard/createSelection), only cards currently
  // rendered on screen can be checked at all, and the button itself stays
  // disabled until at least 2 are (a single row has nothing to connect to).
  // Posts exactly the checked rows -- selection.groups() -- rather than
  // re-searching or auto-including everything on screen, so what gets
  // analyzed is always what the visitor actually chose, plus any BYOK
  // credentials saved above. A server with no shared key still works as
  // long as the visitor supplied their own; a request that fails either way
  // surfaces a plain inline error, with a nudge toward AI settings and the
  // external-AI fallback for the failure codes that mean "our own AI path
  // can't serve this" (see NEEDS_KEY_CODES below).

  // provider_invalid is included alongside authentication_error because at
  // least one real vendor (Gemini) returns a plain 400 for an invalid key
  // rather than 401/403 -- ModelDispatcher classifies that as INVALID, not
  // AUTH, so it surfaces under this code instead (confirmed against the
  // real API, not assumed). timeout is included too: whatever's slow, the
  // external-AI fallback answers immediately either way.
  var NEEDS_KEY_CODES = [
    "no_credential", "authentication_error", "provider_invalid", "quota_exceeded", "all_providers_exhausted", "timeout",
  ];

  function connectionsSection(data, selection) {
    var section = el("section", "connections");

    var hint = el("p", "connections-hint");
    section.appendChild(hint);

    var button = el("button", "connections-btn", t(locale, "connections.button"));
    button.type = "button";
    button.disabled = true;

    var linksRow = el("div", "connections-links");
    var settingsLink = el("button", "connections-settings-link", t(locale, "connections.settingsLink"));
    settingsLink.type = "button";
    settingsLink.addEventListener("click", openAiSettings);
    linksRow.appendChild(settingsLink);

    var externalToggle = el("button", "connections-settings-link", t(locale, "connections.orExternal"));
    externalToggle.type = "button";
    var externalWrap = el("div", "connections-external-wrap");
    externalWrap.hidden = true;
    externalToggle.addEventListener("click", function () {
      if (externalWrap.hidden) {
        externalWrap.innerHTML = "";
        externalWrap.appendChild(externalChatLinks(externalQuestionText(selection.groups())));
        externalWrap.hidden = false;
      } else {
        externalWrap.hidden = true;
      }
    });
    linksRow.appendChild(externalToggle);

    var body = el("div", "connections-body");
    body.hidden = true;

    section.appendChild(button);
    section.appendChild(linksRow);
    section.appendChild(externalWrap);
    section.appendChild(body);

    // Live hint + button enablement, driven by every checkbox toggle across
    // every group's cards (including ones loaded later via "show more") --
    // selection is a single object shared by reference with every
    // resultCard, so this fires regardless of where the toggle happened.
    function updateState() {
      var n = selection.count();
      button.disabled = n < 2;
      if (n === 0) {
        hint.textContent = t(locale, "connections.selectHint");
      } else if (n === 1) {
        hint.textContent = t(locale, "connections.selectHintOneMore");
      } else {
        hint.textContent = plural(locale, "connections.selectedCount", n);
      }
    }
    selection.onChange(updateState);
    updateState();

    button.addEventListener("click", function () {
      var groups = selection.groups();
      if (groups.length === 0) return; // button is disabled below 2, but be defensive

      button.disabled = true;
      button.textContent = t(locale, "connections.loading");
      body.hidden = true;
      body.innerHTML = "";

      var payload = {
        locale: locale,
        groups: groups,
        credentials: getAllAiCredentials(),
      };

      fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          return response.json().then(function (result) {
            if (!response.ok) {
              var err = new Error(
                (result.code && t(locale, "connections.error.code." + result.code)) || t(locale, "connections.error.generic")
              );
              err.code = result.code;
              throw err;
            }
            return result;
          });
        })
        .then(function (result) {
          body.appendChild(el("p", "connections-answer-label", t(locale, "connections.answerLabel")));
          body.appendChild(el("p", "connections-text", result.connection));
          body.hidden = false;
          section.classList.add("answered");
          // Deliberately left visible and re-enabled, not hidden away: the
          // checkboxes on the result cards are still live, so a visitor can
          // change what's selected and press this again for a fresh answer
          // without having to redo the whole search from scratch (this used
          // to hide button/links/hint outright -- once the "still shows
          // מחפש קשר" CSS-specificity bug got fixed and `hidden` actually
          // started working, that read as "the AI panel just disappeared").
          button.disabled = selection.count() < 2;
          button.textContent = t(locale, "connections.button");
        })
        .catch(function (err) {
          body.appendChild(notice(t(locale, "error.title"), err.message, "error"));
          if (err.code && NEEDS_KEY_CODES.indexOf(err.code) !== -1) {
            var help = el("div", "connections-help");
            help.appendChild(el("p", null, t(locale, "connections.error.tryOwnKey")));
            var openSettingsBtn = el("button", "connections-settings-link", t(locale, "aiSettings.openButton"));
            openSettingsBtn.type = "button";
            openSettingsBtn.addEventListener("click", openAiSettings);
            help.appendChild(openSettingsBtn);
            help.appendChild(externalChatLinks(externalQuestionText(groups)));
            body.appendChild(help);
          }
          body.hidden = false;
          button.disabled = selection.count() < 2;
          button.textContent = t(locale, "connections.button");
        });
    });

    return section;
  }

  function hasEnoughToConnect(data) {
    var total = 0;
    for (var i = 0; i < data.groups.length; i++) {
      total += data.groups[i].total;
      if (total >= 2) return true;
    }
    return false;
  }

  function render(data, snapshot) {
    results.innerHTML = "";
    // One selection, shared by reference between the connections section
    // and every card in every group (including cards from a later "show
    // more" page) -- a single source of truth for what's currently checked.
    var selection = createSelection();
    // Above the results, not below: it's the first thing offered on a
    // search worth analyzing, not an afterthought scrolled past.
    if (hasEnoughToConnect(data)) {
      results.appendChild(connectionsSection(data, selection));
    }
    data.groups.forEach(function (group) {
      results.appendChild(renderGroup(group, snapshot, selection));
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

  // --- Language switching ------------------------------------------------

  function applyStaticTranslations() {
    document.documentElement.lang = locale;
    document.documentElement.dir = DIR[locale];
    document.title = t(locale, "doc.title");
    document.getElementById("meta-description").setAttribute("content", t(locale, "meta.description"));

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(locale, nodes[i].getAttribute("data-i18n"));
    }
    var ariaNodes = document.querySelectorAll("[data-i18n-aria-label]");
    for (var j = 0; j < ariaNodes.length; j++) {
      ariaNodes[j].setAttribute("aria-label", t(locale, ariaNodes[j].getAttribute("data-i18n-aria-label")));
    }

    input.placeholder = t(locale, "search.placeholder", { example: I18N.PLACEHOLDER_EXAMPLE });

    document.getElementById("footer-attribution").innerHTML = t(locale, "footer.attributionHtml");
    renderFooterCount();

    if (lastTractates) populateTractateSelect(lastTractates);

    // The AI settings dialog's dynamic content (provider tabs/panel,
    // external links) is otherwise only rebuilt when it's opened -- if a
    // locale switch happens while it's already open, refresh it in place
    // rather than leaving it in the old language until the next open.
    if (aiDialog.open) {
      renderAiProviderTabs();
      renderAiProviderPanel();
      renderAiExternalLinks();
    }
    if (installHelpDialog.open) openInstallHelp();

    var buttons = langSwitch.querySelectorAll(".lang-btn");
    for (var k = 0; k < buttons.length; k++) {
      var isActive = buttons[k].dataset.lang === locale;
      buttons[k].classList.toggle("active", isActive);
      buttons[k].setAttribute("aria-pressed", isActive ? "true" : "false");
    }
  }

  function renderFooterCount() {
    var target = document.getElementById("verse-count");
    if (!lastHealth) {
      target.textContent = "";
      return;
    }
    target.textContent = t(locale, "footer.summary", {
      wordsPhrase: plural(locale, "footer.words", lastHealth.words),
      tractatesPhrase: plural(locale, "footer.tractates", lastHealth.tractates),
    });
  }

  function setLocale(next) {
    if (!I18N.isSupported(next) || next === locale) return;
    locale = next;
    saveLocale(locale);
    applyStaticTranslations();
    // Redraw the current results in the new language without a network
    // round-trip -- the data itself doesn't change, only its labels. Any
    // "show more" pages loaded before the switch reset to the first page,
    // the same simplification פסוק לשם makes for its own "show more".
    if (lastSearchData) render(lastSearchData, lastSnapshot);
  }

  langSwitch.addEventListener("click", function (event) {
    var button = event.target.closest(".lang-btn");
    if (button) setLocale(button.dataset.lang);
  });

  // --- Install (Add to Home Screen) ---------------------------------------
  //
  // Always shown as soon as the page isn't already running standalone,
  // rather than waiting on `beforeinstallprompt` to decide whether the
  // button even exists -- that event is unreliable in practice (browser
  // engagement heuristics, non-Chrome browsers, in-app webviews), and a
  // button that only sometimes appears is indistinguishable from a broken
  // one. Every tap does *something*: the native prompt when it's been
  // captured, or a step-by-step "how to install" dialog otherwise (iOS
  // Share-then-Add-to-Home-Screen, or a generic browser-menu path) --
  // never a silent no-op or a bare one-line toast that's gone before it's
  // read twice.
  //
  // Fixed position (not in the header's normal flow) is deliberate, not an
  // oversight: an in-flow install control was tried twice before (see git
  // history on this repo and on פסוק לשם) and taps went unresponsive on
  // real devices, most likely from sharing a stacking context with
  // .search's negative-margin overlap onto the header. Staying fixed, in
  // its own stacking context, sidesteps that whole class of problem --
  // styles.css repositions it for wider viewports via a media query
  // instead, which changes nothing about *how* it's positioned.

  var deferredInstallPrompt = null;
  var installHelpDialog = document.getElementById("install-help-dialog");
  var installHelpSteps = document.getElementById("install-help-steps");

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }

  function openInstallHelp() {
    var step1 = t(locale, isIOS() ? "install.iosStep1" : "install.genericStep1");
    var step2 = t(locale, isIOS() ? "install.iosStep2" : "install.genericStep2");
    installHelpSteps.innerHTML = "";
    installHelpSteps.appendChild(el("li", null, step1));
    installHelpSteps.appendChild(el("li", null, step2));
    if (typeof installHelpDialog.showModal === "function") {
      installHelpDialog.showModal();
    } else {
      installHelpDialog.setAttribute("open", "");
    }
  }

  if (!isStandalone()) installBtn.hidden = false;

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  installBtn.addEventListener("click", function () {
    if (deferredInstallPrompt) {
      var prompt = deferredInstallPrompt;
      deferredInstallPrompt = null;
      prompt.prompt();
      prompt.userChoice
        .then(function (choice) {
          if (choice.outcome === "accepted") installBtn.hidden = true;
        })
        .catch(function () { /* left visible -- tapping again just retries */ });
    } else {
      openInstallHelp();
    }
  });

  window.addEventListener("appinstalled", function () {
    installBtn.hidden = true;
    deferredInstallPrompt = null;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () { /* installability just degrades gracefully */ });
    });
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
          if (!response.ok) {
            var message = (body.code && t(locale, "error.code." + body.code)) || t(locale, "error.generic");
            throw new Error(message);
          }
          return body;
        });
      })
      .then(function (data) {
        lastSearchData = data;
        lastSnapshot = snapshot;
        render(data, snapshot);
        results.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch(function (error) {
        if (error.name === "AbortError") return;
        lastSearchData = null;
        results.innerHTML = "";
        results.appendChild(notice(t(locale, "error.title"), error.message, "error"));
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

  // Populate the tractate filter, grouped by seder. Re-callable so a
  // language switch can relabel the options (tractate/seder names switch
  // with the locale) without a new network request, while keeping whatever
  // was selected -- option values are always the Hebrew name, unaffected
  // by locale.
  function populateTractateSelect(data) {
    lastTractates = data;
    var previousValue = tractateSelect.value;

    tractateSelect.querySelectorAll("optgroup").forEach(function (group) {
      group.remove();
    });

    var bySeder = {};
    var order = [];
    data.tractates.forEach(function (tr) {
      var seder = localizedName(tr.sederHe, tr.sederEn);
      if (!bySeder[seder]) {
        bySeder[seder] = [];
        order.push(seder);
      }
      bySeder[seder].push(tr);
    });
    order.forEach(function (seder) {
      var group = document.createElement("optgroup");
      group.label = seder;
      bySeder[seder].forEach(function (tr) {
        var option = document.createElement("option");
        option.value = tr.he;
        option.textContent = localizedName(tr.he, tr.en);
        group.appendChild(option);
      });
      tractateSelect.appendChild(group);
    });

    tractateSelect.value = previousValue;
  }

  var disarmTractateWaking = armWaking();
  fetch("/api/tractates")
    .then(function (r) { return r.json(); })
    .then(populateTractateSelect)
    .catch(function () { /* the filter just stays at "all of Shas" */ })
    .then(disarmTractateWaking);

  applyStaticTranslations();

  var disarmHealthWaking = armWaking();
  fetch("/api/health")
    .then(function (r) { return r.json(); })
    .then(function (health) {
      lastHealth = health;
      renderFooterCount();
    })
    .catch(function () { /* the footer count is decorative */ })
    .then(disarmHealthWaking);

  // Not waking-gated (unlike the fetches above): this one is purely
  // informational for the AI settings dialog, which a visitor may never
  // even open, so it shouldn't contribute to the "waking the server" notice
  // on an ordinary page load.
  fetch("/api/ai-status")
    .then(function (r) { return r.json(); })
    .then(function (status) { lastAiStatus = status; })
    .catch(function () { /* the settings panel just shows "no shared key" for every vendor */ });

  var initial = fromHash();
  if (initial) runSearch(initial, false);
})();
