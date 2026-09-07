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
  var installBanner = document.getElementById("install-banner");
  var installBtn = document.getElementById("install-btn");
  var installDismiss = document.getElementById("install-dismiss");

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

  function resultCard(result) {
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
    var link = document.createElement("a");
    link.href = result.sefariaUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "copy";
    link.textContent = t(locale, "openInSefaria");
    foot.appendChild(link);
    card.appendChild(foot);

    return card;
  }

  function renderGroup(group, snapshot) {
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

    if (!group.isPhrase && group.prefixTotal > 0) {
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
    appendResults(list, group.results, kindSoFar);

    var shownCount = group.results.length;

    function updateCountLabel() {
      countLabel.textContent = shownCount < group.total
        ? t(locale, "result.showingOf", { shown: I18N.formatNumber(locale, shownCount), totalPhrase: plural(locale, "result.total", group.total) })
        : plural(locale, "result.total", group.total);
    }
    updateCountLabel();

    if (shownCount < group.total) {
      section.appendChild(moreButton(group, snapshot, list, kindSoFar, {
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
  // promises they're two distinct groups.
  function appendResults(list, results, kindSoFar) {
    results.forEach(function (result) {
      if (kindSoFar.last === "exact" && result.kind === "withPrefix") {
        list.appendChild(el("h4", "group-subheading", t(locale, "matchKind.withPrefix")));
      }
      list.appendChild(resultCard(result));
      kindSoFar.last = result.kind;
    });
  }

  // A group's own "show more": re-searches the same single term with a
  // growing `offset` and appends the next page, rather than being stuck
  // with whatever the original search's `limit` capped at -- a common word
  // like אביי or רבא has thousands of hits, far past any first page.
  function moreButton(group, snapshot, list, kindSoFar, state) {
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
          appendResults(list, page.results, kindSoFar);
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
      // Not localized -- this is a plain diagnostic (which commit is
      // actually deployed), not user-facing copy.
      document.getElementById("footer-build").textContent = "build " + health.commit;
    })
    .catch(function () { /* the footer count is decorative */ })
    .then(disarmHealthWaking);

  // --- App install (Add to Home Screen) -----------------------------------

  // Bumped (v2) to give everyone a clean slate -- rules out a stale
  // dismissal saved during earlier debugging as the cause of the banner
  // no longer appearing.
  var INSTALL_DISMISSED_KEY = "shas-radar:install-dismissed:v2";
  var deferredInstallPrompt = null;

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }
  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }
  function installDismissed() {
    try {
      return localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
    } catch (err) {
      return false;
    }
  }
  function dismissInstallBanner() {
    installBanner.hidden = true;
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    } catch (err) {
      /* not persisted; the banner just reappears next visit */
    }
  }

  if (!isStandalone() && !installDismissed()) {
    // Chrome/Edge/Android: this fires only once the manifest + icons +
    // the rest of the installability criteria are met (static/manifest.json).
    // preventDefault() suppresses Chrome's own mini-infobar so this banner
    // is the only install prompt shown.
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      deferredInstallPrompt = event;
      installBanner.hidden = false;
    });

    // iOS Safari never fires beforeinstallprompt and has no programmatic
    // install API at all -- the only way in is Share -> Add to Home Screen,
    // so the button just explains that instead of triggering anything.
    if (isIOS()) installBanner.hidden = false;
  }

  installBtn.addEventListener("click", function () {
    if (deferredInstallPrompt) {
      var promptEvent = deferredInstallPrompt;
      deferredInstallPrompt = null;
      installBanner.hidden = true;
      promptEvent.prompt();
    } else if (isIOS()) {
      installBtn.textContent = t(locale, "install.iosHint");
      installBtn.disabled = true;
    }
  });

  installDismiss.addEventListener("click", dismissInstallBanner);
  window.addEventListener("appinstalled", dismissInstallBanner);

  var initial = fromHash();
  if (initial) runSearch(initial, false);
})();
