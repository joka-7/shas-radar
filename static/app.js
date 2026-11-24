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

  // Mobile browsers skip :active/tap-highlight rendering on pages with no
  // touch listeners (treated as passively scrollable) -- this one-time
  // no-op listener makes tap feedback on the footer icon links actually
  // render.
  document.addEventListener("touchstart", function () {}, { passive: true });

  var t = I18N.t;
  var plural = I18N.plural;

  var LOCALE_STORAGE_KEY = "shas-radar:locale";
  var BOOK_STORAGE_KEY = "shas-radar:book";

  var form = document.getElementById("search-form");
  var input = document.getElementById("q");
  var submit = document.getElementById("submit");
  var clearBtn = document.getElementById("clear");
  var results = document.getElementById("results");
  var toastEl = document.getElementById("toast");
  var wakingEl = document.getElementById("waking");
  var tractateSelect = document.getElementById("tractate");
  var bookSelect = document.getElementById("book");
  var bookField = document.getElementById("book-field");
  var langSwitch = document.getElementById("lang-switch");
  var installBtn = document.getElementById("install-btn");
  var settingsBtn = document.getElementById("settings-btn");
  var aiDialog = document.getElementById("ai-settings-dialog");

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

  // The books the API offers (GET /api/books), and which one is selected.
  // "" means the server's own default until the list arrives. tractatesBook
  // is the book whose tractate list was requested last, so a slower, older
  // response never overwrites a newer one.
  var lastBooks = null;
  var bookDefault = "";
  var selectedBook = loadStoredBook();
  var tractatesBook = null;

  function loadLocale() {
    try {
      var stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && I18N.isSupported(stored)) return stored;
    } catch (err) {
      /* private browsing / storage disabled -- fall through to the default */
    }
    return I18N.DEFAULT_LOCALE;
  }

  function loadStoredBook() {
    try {
      return localStorage.getItem(BOOK_STORAGE_KEY) || "";
    } catch (err) {
      return "";
    }
  }

  function saveBook(value) {
    try {
      localStorage.setItem(BOOK_STORAGE_KEY, value);
    } catch (err) {
      /* not remembered next visit; the picker still works */
    }
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

  // --- Talking to the API --------------------------------------------------

  /*
   * fetch, but patient about a sleeping backend.
   *
   * On the free plan the API sleeps after 15 idle minutes and takes up to a
   * minute to come back. The page is served from a CDN and so paints long
   * before that, and the request that arrives meanwhile does not simply wait:
   * whatever sits in front of the API answers first, with a gateway error or a
   * dropped connection, well before the app itself is up. Retrying is what
   * turns that into the wait it looks like it should be -- the caller's promise
   * stays pending, so the "waking the server" notice stays up and the request
   * completes on its own once the API answers.
   *
   * Only transport failures and gateway statuses are retried. A 4xx is the API
   * itself talking (a bad query, a missing key) and is returned as-is.
   */
  var WAKE_RETRY_BUDGET_MS = 90000;
  var WAKE_RETRY_STEPS_MS = [1000, 2000, 3000, 5000, 5000, 8000];
  var GATEWAY_STATUSES = [502, 503, 504];

  function apiFetch(path, options) {
    options = options || {};
    // A POST can have a cost on the far side (POST /api/analyze spends a model
    // call), so it gets one retry to cover a dropped connection, not a full
    // wake's worth.
    var maxAttempts = (options.method || "GET").toUpperCase() === "GET"
      ? WAKE_RETRY_STEPS_MS.length + 1
      : 2;
    var deadline = Date.now() + WAKE_RETRY_BUDGET_MS;

    function attempt(n) {
      return fetch(window.API_BASE + path, options).then(function (response) {
        if (GATEWAY_STATUSES.indexOf(response.status) === -1) return response;
        return retryOr(n, response, null);
      }, function (error) {
        // The caller aborted (a superseded search) -- not a failure to retry.
        if (error && error.name === "AbortError") throw error;
        return retryOr(n, null, error);
      });
    }

    function retryOr(n, response, error) {
      var waitMs = WAKE_RETRY_STEPS_MS[n] || WAKE_RETRY_STEPS_MS[WAKE_RETRY_STEPS_MS.length - 1];
      if (n + 1 >= maxAttempts || Date.now() + waitMs > deadline) {
        if (response) return response;
        throw error;
      }
      if (options.signal && options.signal.aborted) throw new Error("aborted");
      return new Promise(function (resolve) { setTimeout(resolve, waitMs); })
        .then(function () { return attempt(n + 1); });
    }

    return attempt(0);
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

  // The commentary on one page of a book, as GET /api/commentary answers it.
  function fetchCommentary(book, tractate, daf, amud, commentary) {
    var params = new URLSearchParams({ book: book, tractate: tractate, daf: String(daf), amud: amud });
    if (commentary) params.set("commentary", commentary);
    return apiFetch("/api/commentary?" + params.toString()).then(function (response) {
      if (!response.ok) throw new Error("commentary " + response.status);
      return response.json();
    });
  }

  // "Rashi on this page": the comments on the result's page, fetched the first
  // time the section is opened (a failed fetch can be retried by reopening it).
  function commentaryBlock(result) {
    var details = document.createElement("details");
    details.className = "paragraph commentary";
    var summary = document.createElement("summary");
    summary.textContent = t(locale, "commentary.show");
    var body = el("div", "commentary-body");
    details.appendChild(summary);
    details.appendChild(body);

    var loaded = false;
    details.addEventListener("toggle", function () {
      if (!details.open || loaded) return;
      loaded = true;
      body.textContent = t(locale, "commentary.loading");
      fetchCommentary(result.book, result.tractate.he, result.daf, result.amud)
        .then(function (data) { renderCommentary(body, data); })
        .catch(function () {
          loaded = false;
          body.textContent = t(locale, "commentary.error");
        });
    });
    return details;
  }

  function renderCommentary(body, data) {
    body.textContent = "";
    if (!data.comments.length) {
      body.textContent = t(locale, "commentary.none");
      return;
    }
    data.comments.forEach(function (comment) {
      body.appendChild(hebrewSpan("p", "paragraph-text commentary-comment", comment.text));
    });
    if (data.license) {
      body.appendChild(el("p", "attribution", t(locale, "commentary.credit", { license: data.license })));
    }
    if (/^https:\/\//.test(data.sefariaUrl || "")) {
      var link = el("a", "copy", t(locale, "openInSefaria"));
      link.href = data.sefariaUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      body.appendChild(link);
    }
  }

  function resultCard(result, query, selection) {
    var card = el("article", "card");

    var head = el("div", "card-head");
    var book = bookById(result.book);
    if (book && lastBooks.length > 1) {
      head.appendChild(el("span", "badge", localizedName(book.he, book.en)));
    }
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

    // A book keyed to the same pages (Rashi, for the Bavli) can be opened right
    // under the result, for the page the match is on.
    var host = bookById(result.book);
    if (host && host.commentary && result.daf) card.appendChild(commentaryBlock(result));

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
    if (result.book === READER_BOOK && result.daf) foot.appendChild(readerLink(result));
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
      if (snapshot.book) params.set("book", snapshot.book);

      apiFetch("/api/search?" + params.toString())
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
  // The provider/model/key picker itself is a mounted React island (see
  // frontend/src/main.tsx -> static/vendor/model-picker/) -- the same
  // <ModelPicker> every other app on this framework renders, so this
  // section only bridges the two sides of that boundary:
  //   - imports frontend/src/browserAi.ts's small build on demand to ask
  //     whether the visitor has a key of their own, and if so has it run the
  //     analysis straight from this browser (requestAnalysis);
  //   - forwards a locale switch into the island (see setLocale below).
  // Keys the visitor adds live only in this browser's localStorage and go
  // only to the AI vendor itself, never to this app's server: the server
  // builds the prompt (POST /api/analyze/prompt) and the browser sends it
  // (see app/ai.py's module docstring / README's "AI connections" section).
  // The server holds no AI key of its own: without the visitor's key, the
  // "ask an external AI" links are the way to an answer.

  var LOCALE_CHANGED_EVENT = "shas-radar:locale-changed";

  function postAnalyzeRequest(path, payload) {
    return apiFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (response) {
      return response.json().then(function (result) {
        if (!response.ok) {
          var err = new Error(result.error || "");
          err.code = result.code;
          throw err;
        }
        return result;
      });
    });
  }

  /* One analysis turn, run in this browser on the visitor's own key;
   * resolves to the answer text. The server only builds the prompt. Rejects
   * with an Error carrying `.code` (see analysisErrorMessage). */
  function requestAnalysis(groups, history) {
    var payload = { locale: locale, groups: groups };
    if (history) payload.history = history;
    return loadBrowserAi().then(function (browserAi) {
      if (!browserAi.hasOwnKey()) throw codedError("no_credential");
      return postAnalyzeRequest("/api/analyze/prompt", payload)
        .then(function (prompt) {
          return browserAi.completeAnalysis(prompt);
        })
        .catch(function (err) {
          // Every one of the visitor's providers failed: a bad key, or a
          // local Ollama that isn't running.
          if (err.code === "all_providers_exhausted") throw codedError("own_key_failed", err.message);
          throw err;
        });
    });
  }

  function codedError(code, message) {
    var err = new Error(message || code);
    err.code = code;
    return err;
  }

  /* Small (no React) and only needed once an analysis runs, so it's
   * imported then rather than shipped with the page. */
  var browserAiModule = null;
  function loadBrowserAi() {
    browserAiModule = browserAiModule || import("/vendor/model-picker/browser-ai.js").catch(function (err) {
      browserAiModule = null; // a failed load (offline) is retried next time
      throw err;
    });
    return browserAiModule;
  }

  /* `t` answers its own key for a missing string, so an unknown code
   * falls back to the generic message instead of showing that key. */
  function analysisErrorMessage(err, fallbackKey) {
    var key = "connections.error.code." + (err && err.code);
    var message = err && err.code ? t(locale, key) : key;
    return message === key ? t(locale, fallbackKey) : message;
  }

  // The <ModelPicker> island (~180KB gzipped: React + ReactDOM, bundled --
  // see frontend/vite.config.ts) is loaded on first open of this dialog,
  // not up front with the rest of the page. Most visitors just search the
  // Talmud and never touch AI settings at all; shipping that weight to
  // every one of them for a rarely-opened panel would undercut the exact
  // thing this app is otherwise careful about (see README's "no build
  // step" quick start -- the *page* stays light even though this one
  // widget now has a build step of its own).
  var modelPickerLoadStarted = false;
  function ensureModelPickerLoaded() {
    if (modelPickerLoadStarted) return;
    modelPickerLoadStarted = true;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/vendor/model-picker/main.css";
    document.head.appendChild(link);
    var script = document.createElement("script");
    script.type = "module";
    script.src = "/vendor/model-picker/main.js";
    document.body.appendChild(script);
  }

  function openAiSettings() {
    ensureModelPickerLoaded();
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

  // ids match modeldispatcher-browser-agent's own ExternalChatProviderId
  // exactly ("gemini" = AI Mode, "geminiApp" = the real app -- not the more
  // obvious naming) since the AI settings dialog's favorite picker (the
  // mounted <ModelPicker> island) stores a favorite under those same ids;
  // loadExternalChatFavorite() below reads that value straight out of this
  // list, so a mismatch here would silently point "ask my favorite" at the
  // wrong product.
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
      id: "gemini", nameKey: "external.googleAiMode", homeUrl: "https://www.google.com/",
      buildUrl: function (q) { return "https://www.google.com/search?" + new URLSearchParams({ q: q, udm: "50" }); },
    },
    {
      // The actual Gemini app -- gemini.google.com has no known prefill
      // parameter (unlike ChatGPT/Claude above), so this one has no
      // buildUrl; externalChatLinks still copies the question to the
      // clipboard first so it's ready to paste once the app opens. Not to
      // be confused with Google Search's "AI Mode" above, which *is*
      // pre-fillable but is a different product from Gemini itself.
      id: "geminiApp", name: "Gemini", homeUrl: "https://gemini.google.com/app", buildUrl: null,
    },
    {
      // No known prefill parameter (like Gemini above) -- externalChatLinks
      // still copies the question to the clipboard first, ready to paste
      // once GroqChat opens.
      id: "groq", name: "Groq", homeUrl: "https://chat.groq.com/", buildUrl: null,
    },
  ];

  /* The favorite saved from the AI settings dialog's <ModelPicker> island
   * (see frontend/src/main.tsx) -- `null` if none is set or the stored
   * value isn't one of the ids above. */
  function loadExternalChatFavorite() {
    try {
      var raw = localStorage.getItem("shas-radar:ai-external-chat-favorite");
      return EXTERNAL_CHAT_PROVIDERS.filter(function (p) { return p.id === raw; })[0] || null;
    } catch (err) {
      return null;
    }
  }

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

  /* The "find connections" failure state for every code in NEEDS_KEY_CODES
   * (see below) -- one cohesive block rather than a red error box followed
   * by a separately-styled paragraph underneath it, which visitors read as
   * "that's the end of the message" and never got to. `reason` is already
   * the localized per-code message (e.g. "No AI key is available"); if a
   * favorite external app is saved, its own button leads -- pressing it
   * opens that app with the question ready to paste, no key needed -- with
   * the rest of the providers a click away instead of a wall of five links. */
  function noProviderNotice(reason, groups) {
    var box = el("div", "connections-noprovider");
    var favorite = loadExternalChatFavorite();
    var question = externalQuestionText(groups);

    box.appendChild(el("p", "connections-noprovider-reason", reason));
    box.appendChild(el("p", "connections-noprovider-cta", t(locale, "connections.error.tryOwnKey")));

    var actions = el("div", "connections-noprovider-actions");
    var settingsBtn = el("button", "connections-settings-link", t(locale, "aiSettings.openButton"));
    settingsBtn.type = "button";
    settingsBtn.addEventListener("click", openAiSettings);
    actions.appendChild(settingsBtn);

    if (favorite) {
      var favoriteName = favorite.nameKey ? t(locale, favorite.nameKey) : favorite.name;
      var askBtn = el("button", "connections-ask-favorite-btn", t(locale, "connections.noProvider.askFavorite", { favorite: favoriteName }));
      askBtn.type = "button";
      askBtn.addEventListener("click", function () {
        copyToClipboard(question);
        toast(t(locale, "external.copiedToast"));
        window.open(favorite.buildUrl ? favorite.buildUrl(question) : favorite.homeUrl, "_blank", "noopener,noreferrer");
      });
      actions.appendChild(askBtn);
    }
    box.appendChild(actions);

    if (favorite) {
      var otherToggle = el("button", "connections-settings-link", t(locale, "connections.noProvider.otherProvider"));
      otherToggle.type = "button";
      var otherWrap = el("div", "connections-external-wrap");
      otherWrap.hidden = true;
      otherToggle.addEventListener("click", function () {
        if (otherWrap.hidden) {
          otherWrap.innerHTML = "";
          otherWrap.appendChild(externalChatLinks(question));
          otherWrap.hidden = false;
        } else {
          otherWrap.hidden = true;
        }
      });
      box.appendChild(otherToggle);
      box.appendChild(otherWrap);
    } else {
      box.appendChild(externalChatLinks(question));
    }

    return box;
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
  // analyzed is always what the visitor actually chose. The browser runs it
  // on the visitor's own key (requestAnalysis above). A request that fails
  // surfaces a plain inline error, with a nudge toward AI settings and the
  // external-AI fallback for the failure codes that mean "no usable key
  // here" (see NEEDS_KEY_CODES below).

  // Every way this browser's own AI path can fail: no key configured, every
  // configured provider failed, or some other provider error. Each gets the
  // settings nudge and the external-AI links, which always answer.
  var NEEDS_KEY_CODES = ["no_credential", "own_key_failed", "provider_error"];

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

      requestAnalysis(groups)
        .then(function (connection) {
          body.appendChild(el("p", "connections-answer-label", t(locale, "connections.answerLabel")));
          body.appendChild(el("p", "connections-text", connection));
          var chatBtn = el("button", "connections-btn connections-chat-btn", t(locale, "chat.continueButton"));
          chatBtn.type = "button";
          chatBtn.addEventListener("click", function () {
            openAiChat(groups, connection);
          });
          body.appendChild(chatBtn);
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
          var message = analysisErrorMessage(err, "connections.error.generic");
          if (err.code && NEEDS_KEY_CODES.indexOf(err.code) !== -1) {
            body.appendChild(noProviderNotice(message, groups));
          } else {
            body.appendChild(notice(t(locale, "error.title"), message, "error"));
          }
          body.hidden = false;
          button.disabled = selection.count() < 2;
          button.textContent = t(locale, "connections.button");
        });
    });

    return section;
  }

  // --- AI chat: continue the conversation (optional) ----------------------
  //
  // Opened from the "continue chatting" button under a connections-section
  // answer (see connectionsSection above), in a modal <dialog> like the AI
  // settings one. Conversation state lives only in this closure for as long
  // as the dialog is open -- nothing is kept server-side between requests
  // (see app/ai.py's module docstring), so every follow-up resends the full
  // exchange so far as `history` alongside the same `groups` the original
  // answer was about. Reopening the dialog on a fresh "find connections"
  // answer resets it; there's exactly one chat dialog on the page, shared
  // across however many connections-sections a visitor works through.

  var chatDialog = document.getElementById("ai-chat-dialog");
  var chatMessagesEl = document.getElementById("ai-chat-messages");
  var chatInput = document.getElementById("ai-chat-input");
  var chatSendBtn = document.getElementById("ai-chat-send");

  var chatGroups = null;
  var chatTurns = []; // history sent so far: [{role, content}, ...]

  function chatBubble(role, text) {
    return el("p", "ai-chat-bubble ai-chat-bubble-" + role, text);
  }

  function scrollChatToEnd() {
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  function openAiChat(groups, firstAnswer) {
    chatGroups = groups;
    chatTurns = [{ role: "assistant", content: firstAnswer }];
    chatMessagesEl.innerHTML = "";
    chatMessagesEl.appendChild(chatBubble("assistant", firstAnswer));
    chatInput.value = "";
    autosizeTextarea(chatInput);
    if (typeof chatDialog.showModal === "function") {
      chatDialog.showModal();
    } else {
      chatDialog.setAttribute("open", ""); // very old browser fallback, same as the other dialogs
    }
    scrollChatToEnd();
    chatInput.focus();
  }

  function sendChatMessage() {
    var question = chatInput.value.trim();
    if (!question || !chatGroups || chatSendBtn.disabled) return;

    chatMessagesEl.appendChild(chatBubble("user", question));
    chatInput.value = "";
    autosizeTextarea(chatInput);
    chatSendBtn.disabled = true;

    var pending = chatBubble("assistant", t(locale, "chat.thinking"));
    pending.classList.add("ai-chat-bubble-pending");
    chatMessagesEl.appendChild(pending);
    scrollChatToEnd();

    // Sent, not yet committed to chatTurns -- only on a successful reply,
    // so a failed question can be retried without duplicating it in history.
    var turnsForRequest = chatTurns.concat([{ role: "user", content: question }]);

    requestAnalysis(chatGroups, turnsForRequest)
      .then(function (connection) {
        pending.remove();
        chatMessagesEl.appendChild(chatBubble("assistant", connection));
        chatTurns = turnsForRequest.concat([{ role: "assistant", content: connection }]);
      })
      .catch(function (err) {
        pending.remove();
        var errorBubble = el("div", "ai-chat-bubble ai-chat-bubble-error");
        errorBubble.appendChild(document.createTextNode(analysisErrorMessage(err, "chat.error.generic")));
        if (err.code && NEEDS_KEY_CODES.indexOf(err.code) !== -1) {
          var settingsLink = el("button", "connections-settings-link", t(locale, "aiSettings.openButton"));
          settingsLink.type = "button";
          settingsLink.addEventListener("click", openAiSettings);
          errorBubble.appendChild(settingsLink);
        }
        chatMessagesEl.appendChild(errorBubble);
      })
      .then(function () {
        chatSendBtn.disabled = false;
        scrollChatToEnd();
      });
  }

  chatInput.addEventListener("input", function () {
    autosizeTextarea(chatInput);
  });
  // Enter sends (textareas don't submit their form on Enter on their own,
  // same reasoning as #q's own keydown handler above); Shift+Enter still
  // inserts a newline for a multi-line follow-up.
  chatInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendChatMessage();
    }
  });
  chatSendBtn.addEventListener("click", sendChatMessage);

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

    renderFooterAttribution();
    syncTractateAllLabel();

    if (lastBooks) populateBookSelect();
    if (lastTractates) populateTractateSelect(lastTractates);
    if (readerTractates) populateReaderTractates();
    else if (readerEl.classList.contains("reader-loading")) showReaderLoading();
    syncReaderCommentaries();
    if (readerData) renderReaderPage(readerData);

    // Tells the mounted <ModelPicker> island to relabel itself -- it has no
    // other way to learn about a locale switch (see frontend/src/main.tsx).
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGED_EVENT, { detail: locale }));
    if (installHelpDialog.open) openInstallHelp();

    var buttons = langSwitch.querySelectorAll(".lang-btn");
    for (var k = 0; k < buttons.length; k++) {
      var isActive = buttons[k].dataset.lang === locale;
      buttons[k].classList.toggle("active", isActive);
      buttons[k].setAttribute("aria-pressed", isActive ? "true" : "false");
    }
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
  // Lives inside the Settings dialog now, not a fixed corner FAB (see the
  // HTML comment above it in index.html) -- one settings entry point for
  // language, install, and AI instead of a separate floating control.

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

  /*
   * Back to a blank page, and to the bare URL.
   *
   * A search puts its query in the hash so results can be shared and the back
   * button steps between them -- which also means the URL stays "dirty" after
   * one, and reloading or bookmarking re-runs the old search. Clearing drops
   * the hash with replaceState rather than pushState, so it tidies the address
   * bar without adding a history entry of its own (pressing Back still returns
   * to the previous search rather than to an empty page you just left).
   */
  function clearSearch() {
    if (inFlight) {
      inFlight.abort();
      inFlight = null;
    }
    input.value = "";
    autosizeInput();
    lastSearchData = null;
    lastSnapshot = null;
    results.innerHTML = "";
    results.setAttribute("aria-busy", "false");
    submit.disabled = false;
    history.replaceState(null, "", location.pathname + location.search);
    syncClearButton();
    input.focus();
  }

  // Only offered when there is something to clear, so it never sits there as
  // dead weight on a first visit.
  function syncClearButton() {
    clearBtn.hidden = !input.value && !results.firstChild;
  }

  // #q (and the AI chat's own composer, see openAiChat below) are
  // <textarea>s styled to look like a single-line field so long text (multi-
  // word chips, pasted phrases, a follow-up question) wraps into view
  // instead of being clipped the way a native <input> would. Growing it
  // back to a fixed height on every change keeps it from ballooning as
  // text is removed; the CSS max-height caps it and hands off to scrolling.
  function autosizeTextarea(node) {
    node.style.height = "auto";
    node.style.height = node.scrollHeight + "px";
  }
  function autosizeInput() {
    autosizeTextarea(input);
  }

  function runSearch(query, pushHash) {
    query = (query || "").trim();
    if (!query) {
      input.focus();
      return;
    }

    input.value = query;
    autosizeInput();
    showView("search");
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
    var snapshot = { before: before, after: after, tractate: tractateSelect.value, book: selectedBook };

    var params = new URLSearchParams({
      q: query,
      before: String(snapshot.before),
      after: String(snapshot.after),
      limit: String(PAGE_SIZE),
    });
    if (snapshot.tractate) params.set("tractate", snapshot.tractate);
    if (snapshot.book) params.set("book", snapshot.book);

    apiFetch("/api/search?" + params.toString(), { signal: controller.signal })
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
        syncClearButton();
      });
  }

  // --- Reader ------------------------------------------------------------
  //
  // One page of the Bavli read straight through (GET /api/daf), with Rashi
  // under it and the pages on either side one tap away. The page being read is
  // in the hash (#/daf/<tractate>/<daf>/<a|b>), so it can be linked to and the
  // back button steps between pages; the last page read is remembered, and
  // the Read tab reopens it.

  var READER_BOOK = "bavli";
  var READER_POSITION_KEY = "shas-radar:reader-position";
  var READER_COMMENTARIES_KEY = "shas-radar:reader-commentaries";
  // Before there were several commentaries this was one on/off switch for Rashi.
  var READER_RASHI_KEY = "shas-radar:reader-rashi";
  var READER_VIEW_KEY = "shas-radar:reader-view";

  var viewTabs = document.getElementById("view-tabs");
  var readerEl = document.getElementById("reader");
  var readerTractateSelect = document.getElementById("reader-tractate");
  var readerDafSelect = document.getElementById("reader-daf");
  var readerAmudGroup = document.getElementById("reader-amud");
  var readerCommentariesEl = document.getElementById("reader-commentaries");
  var readerCommentariesPanel = document.getElementById("reader-commentaries-panel");
  var readerPageEl = document.getElementById("reader-page");
  var readerViewGroup = document.getElementById("reader-viewmode");
  var readerPrintLink = document.getElementById("reader-print-link");

  // GET /api/tractates for the Bavli, loaded the first time the reader opens
  // (the search filter's list is for whichever book is selected there).
  var readerTractates = null;
  var readerPosition = null; // {tractate, daf, amud} being shown
  var readerData = null; // the last /api/daf response, kept to redraw on a language switch
  var readerRequest = 0; // a slower, older response never replaces a newer one
  var readerCommentaryCache = {};

  function isAmud(value) {
    return value === "a" || value === "b";
  }

  function loadReaderPosition() {
    try {
      var stored = JSON.parse(localStorage.getItem(READER_POSITION_KEY));
      if (stored && typeof stored.tractate === "string" && Number.isInteger(stored.daf) && isAmud(stored.amud)) {
        return stored;
      }
    } catch (err) {
      /* private browsing, or a value that is not JSON -- start at the beginning */
    }
    return null;
  }

  function saveReaderPosition(position) {
    try {
      localStorage.setItem(READER_POSITION_KEY, JSON.stringify(position));
    } catch (err) {
      /* the Read tab just opens at the beginning next visit */
    }
  }

  // Which commentaries the visitor ticked, by id. The old single Rashi switch is read
  // once if the new choice has not been saved yet.
  function loadReaderCommentaries() {
    try {
      var stored = JSON.parse(localStorage.getItem(READER_COMMENTARIES_KEY));
      if (Array.isArray(stored)) {
        return stored.filter(function (id) { return typeof id === "string"; });
      }
      return localStorage.getItem(READER_RASHI_KEY) === "0" ? [] : ["rashi"];
    } catch (err) {
      return ["rashi"];
    }
  }

  function saveReaderCommentaries(ids) {
    try {
      localStorage.setItem(READER_COMMENTARIES_KEY, JSON.stringify(ids));
    } catch (err) {
      /* the choice holds until the page is reloaded */
    }
  }

  var readerCommentaryChoice = loadReaderCommentaries();

  // The commentaries that stand in a column beside the Gemara in צורת הדף, as in the print.
  var PRINTED_COLUMNS = ["rashi", "tosafot"];

  // "vocalized": the text with niqqud, one paragraph at a time, the commentaries under it.
  // "page": צורת הדף -- plain running text with Rashi and Tosafot beside it, as in the print.
  // "steinsaltz": Steinsaltz's commentary alone.
  function loadReaderView() {
    try {
      var saved = localStorage.getItem(READER_VIEW_KEY);
      return saved === "page" || saved === "steinsaltz" ? saved : "vocalized";
    } catch (err) {
      return "vocalized";
    }
  }

  function saveReaderView(view) {
    try {
      localStorage.setItem(READER_VIEW_KEY, view);
    } catch (err) {
      /* the choice holds until the page is reloaded */
    }
  }

  var readerView = loadReaderView();

  // The Steinsaltz tab exists only where the server has Steinsaltz; without it that
  // saved choice reads as the plain vocalized view.
  function effectiveReaderView() {
    return readerView === "steinsaltz" && !steinsaltzListed() ? "vocalized" : readerView;
  }

  function steinsaltzListed() {
    return readerCommentaryList().some(function (commentary) { return commentary.id === "steinsaltz"; });
  }

  function syncReaderViewButtons() {
    var shown = effectiveReaderView();
    readerViewGroup.querySelectorAll("button").forEach(function (button) {
      if (button.dataset.view === "steinsaltz") button.hidden = !steinsaltzListed();
      button.setAttribute("aria-pressed", button.dataset.view === shown ? "true" : "false");
    });
  }

  function readerHash(position) {
    return "#/daf/" + encodeURIComponent(position.tractate) + "/" + position.daf + "/" + position.amud;
  }

  function readerPositionFromHash() {
    var match = /^#\/daf\/([^/]+)\/(\d+)\/([ab])$/.exec(location.hash);
    if (!match) return null;
    try {
      return { tractate: decodeURIComponent(match[1]), daf: Number(match[2]), amud: match[3] };
    } catch (err) {
      return null; // a malformed %-escape
    }
  }

  function readerTractateInfo(he) {
    if (!readerTractates) return null;
    for (var i = 0; i < readerTractates.tractates.length; i++) {
      if (readerTractates.tractates[i].he === he) return readerTractates.tractates[i];
    }
    return null;
  }

  // Dafim count from the first page's daf; side a comes before side b.
  function pageNumber(page) {
    return page.daf * 2 + (page.amud === "b" ? 1 : 0);
  }

  var GEMATRIA = [
    [400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"], [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"],
    [50, "נ"], [40, "מ"], [30, "ל"], [20, "כ"], [10, "י"], [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"],
    [5, "ה"], [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"],
  ];

  // The same numerals the citations use (app/hebrew.py he_number): 15 and 16
  // are ט״ו and ט״ז, and a gershayim goes before the last of two or more letters.
  function hebrewNumeral(value) {
    var letters = "";
    var remainder = value;
    while (remainder > 0) {
      if (remainder === 15 || remainder === 16) {
        letters += remainder === 15 ? "טו" : "טז";
        break;
      }
      for (var i = 0; i < GEMATRIA.length; i++) {
        if (remainder >= GEMATRIA[i][0]) {
          letters += GEMATRIA[i][1];
          remainder -= GEMATRIA[i][0];
          break;
        }
      }
    }
    return letters.length === 1 ? letters : letters.slice(0, -1) + "״" + letters.slice(-1);
  }

  function dafLabel(daf) {
    return locale === "he" ? hebrewNumeral(daf) : String(daf);
  }

  function pageInRange(info, daf, amud) {
    var number = pageNumber({ daf: daf, amud: amud });
    return number >= pageNumber(info.pageRange.first) && number <= pageNumber(info.pageRange.last);
  }

  function readerLink(result) {
    var position = { tractate: result.tractate.he, daf: result.daf, amud: result.amud };
    var link = el("a", "copy", t(locale, "reader.openInReader"));
    link.href = readerHash(position);
    link.addEventListener("click", function (event) {
      event.preventDefault();
      openReader(position, true);
    });
    return link;
  }

  function showView(name) {
    var reading = name === "read";
    form.hidden = reading;
    results.hidden = reading;
    readerEl.hidden = !reading;
    viewTabs.querySelectorAll(".view-tab").forEach(function (tab) {
      var active = tab.dataset.view === name;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  // Grouped by seder, like the search filter; relabelled on a language switch.
  function populateReaderTractates() {
    readerEl.classList.remove("reader-loading");
    readerTractateSelect.disabled = false;
    readerDafSelect.disabled = false;
    readerTractateSelect.textContent = "";
    var groups = {};
    readerTractates.tractates.forEach(function (tr) {
      var seder = localizedName(tr.sederHe, tr.sederEn);
      if (!groups[seder]) {
        groups[seder] = document.createElement("optgroup");
        groups[seder].label = seder;
        readerTractateSelect.appendChild(groups[seder]);
      }
      var option = document.createElement("option");
      option.value = tr.he;
      option.textContent = localizedName(tr.he, tr.en);
      groups[seder].appendChild(option);
    });
    syncReaderPickers();
  }

  function syncReaderPickers() {
    if (!readerPosition) return;
    var info = readerTractateInfo(readerPosition.tractate);
    readerTractateSelect.value = readerPosition.tractate;
    readerDafSelect.textContent = "";
    if (info && info.pageRange) {
      for (var daf = info.pageRange.first.daf; daf <= info.pageRange.last.daf; daf++) {
        var option = document.createElement("option");
        option.value = String(daf);
        option.textContent = dafLabel(daf);
        readerDafSelect.appendChild(option);
      }
      readerDafSelect.value = String(readerPosition.daf);
    }
    readerAmudGroup.querySelectorAll("button").forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.amud === readerPosition.amud ? "true" : "false");
      button.disabled = !(info && info.pageRange) || !pageInRange(info, readerPosition.daf, button.dataset.amud);
    });
  }

  // The scanned printed page is a PDF on HebrewBooks, so it opens outside the app.
  // A tractate with no working page there (Tamid) has no link.
  function syncReaderPrintLink(data) {
    var url = data && data.printUrl;
    readerPrintLink.hidden = !(typeof url === "string" && /^https:\/\/hebrewbooks\.org\//.test(url));
    if (!readerPrintLink.hidden) readerPrintLink.href = url;
  }

  function syncReaderNav(data) {
    readerEl.querySelectorAll(".reader-prev").forEach(function (button) {
      button.disabled = !(data && data.previous);
    });
    readerEl.querySelectorAll(".reader-next").forEach(function (button) {
      button.disabled = !(data && data.next);
    });
  }

  // The commentaries the reader can show beside a page: what /api/books lists for the
  // Bavli, Rashi first. A server that predates the list names only Rashi.
  function readerCommentaryList() {
    var host = bookById(READER_BOOK);
    if (!host) return [];
    if (Array.isArray(host.commentaries)) return host.commentaries;
    return host.commentary ? [{ id: host.commentary, he: "רש״י", en: "Rashi" }] : [];
  }

  // The ticked commentaries that exist, in the order the server lists them.
  function chosenCommentaries() {
    return readerCommentaryList().filter(function (commentary) {
      return readerCommentaryChoice.indexOf(commentary.id) !== -1;
    });
  }

  // A string for one commentary: Rashi's keep their plain keys, the others are suffixed.
  function commentaryText(base, id, vars) {
    return t(locale, id === "rashi" ? base : base + "." + id, vars);
  }

  function commentaryName(commentary) {
    var key = "reader." + commentary.id;
    var label = t(locale, key);
    return label === key ? commentary[locale] || commentary.he : label;
  }

  function syncReaderCommentaries() {
    syncReaderViewButtons();
    var list = readerCommentaryList();
    // The Steinsaltz view shows his commentary alone, so there is nothing to tick.
    readerCommentariesEl.hidden = !list.length || effectiveReaderView() === "steinsaltz";
    readerCommentariesPanel.textContent = "";
    // The page layout is the printed page, which has Rashi and Tosafot and no other commentary.
    var printed = effectiveReaderView() === "page";
    list.forEach(function (commentary) {
      var option = el("label", "reader-commentary-option");
      var box = document.createElement("input");
      box.type = "checkbox";
      box.value = commentary.id;
      box.checked = readerCommentaryChoice.indexOf(commentary.id) !== -1;
      box.disabled = printed && PRINTED_COLUMNS.indexOf(commentary.id) === -1;
      option.appendChild(box);
      option.appendChild(el("span", null, commentaryName(commentary)));
      readerCommentariesPanel.appendChild(option);
    });
    if (printed && list.length > PRINTED_COLUMNS.length) {
      readerCommentariesPanel.appendChild(el("p", "reader-commentaries-hint", t(locale, "reader.pageViewOnlyPrinted")));
    }
  }

  // One commentary on the page being read, from the cache or the network. Only the
  // newest page's callbacks run: a slower, older response is dropped.
  function loadReaderCommentary(id, data, request, onLoaded, onFailed) {
    var key = id + "|" + data.tractate.he + "|" + data.daf + data.amud;
    if (readerCommentaryCache[key]) {
      onLoaded(readerCommentaryCache[key]);
      return;
    }
    fetchCommentary(READER_BOOK, data.tractate.he, data.daf, data.amud, id)
      .then(function (commentary) {
        readerCommentaryCache[key] = commentary;
        if (request === readerRequest) onLoaded(commentary);
      })
      .catch(function () {
        if (request === readerRequest) onFailed();
      });
  }

  // Steinsaltz's text carries <b> (the Gemara he quotes), <small> and <big>, and nothing
  // else. It is read tag by tag into elements, never through innerHTML, and a tag that
  // is never closed (the source has one) lasts only to the end of its paragraph.
  function markupNodes(text) {
    var open = { b: false, small: false, big: false };
    var nodes = [];
    text.split(/(<\/?(?:b|small|big)>)/i).forEach(function (part) {
      var tag = /^<(\/?)(b|small|big)>$/i.exec(part);
      if (tag) {
        open[tag[2].toLowerCase()] = tag[1] === "";
        return;
      }
      if (!part) return;
      var node = document.createTextNode(part);
      ["big", "small", "b"].forEach(function (name) {
        if (!open[name]) return;
        var wrapper = document.createElement(name);
        wrapper.appendChild(node);
        node = wrapper;
      });
      nodes.push(node);
    });
    return nodes;
  }

  // Tosafot's text opens with the words it comments on, then a dash (a hyphen or an en
  // dash, depending on the tractate). Where the source did not mark them bold, they are,
  // so each comment can be found by its opening.
  var OPENING_END = /\s[-\u2013]\s/;
  function boldOpening(text) {
    var found = OPENING_END.exec(text);
    if (text.indexOf("<b>") !== -1 || !found || found.index < 1 || found.index > 90) return text;
    var end = found.index + found[0].length;
    return "<b>" + text.slice(0, end) + "</b>" + text.slice(end);
  }

  function commentNodes(commentary, text) {
    return markupNodes(commentary.id === "tosafot" ? boldOpening(text) : text);
  }

  // One comment: Rashi's is plain text; the others carry the markup above.
  function commentParagraph(commentary, comment) {
    var paragraph = hebrewSpan("p", "paragraph-text commentary-comment", null);
    if (commentary.id === "rashi") {
      paragraph.textContent = comment.text;
    } else {
      commentNodes(commentary, comment.text).forEach(function (node) { paragraph.appendChild(node); });
    }
    return paragraph;
  }

  function noteDetails(summary, commentary, comments, order, explanation) {
    var details = el("details", "paragraph commentary reader-note");
    details.dataset.order = String(order);
    details.appendChild(el("summary", null, summary));
    var body = el("div", "commentary-body");
    if (explanation) body.appendChild(el("p", "attribution", explanation));
    comments.forEach(function (comment) { body.appendChild(commentParagraph(commentary, comment)); });
    details.appendChild(body);
    return details;
  }

  // Put a note among its paragraph's other notes in the order the commentaries are listed,
  // whichever answered first.
  function insertNote(container, details, order) {
    var later = null;
    container.childNodes.forEach(function (child) {
      if (!later && Number(child.dataset.order) > order) later = child;
    });
    container.insertBefore(details, later);
  }

  // Show a loaded commentary: a button under each paragraph it has something on. Where
  // it does not line up with the Gemara's paragraphs (``aligned`` is false) its comments
  // are for the page as a whole, so they are one button under the page instead, and are
  // never put under the wrong paragraph.
  function showCommentary(commentary, order, loaded, view) {
    var comments = loaded.comments;
    if (loaded.aligned === false) {
      var whole = t(locale, "reader.pageNote", { name: commentaryName(commentary) });
      var why = t(locale, "reader.pageNoteWhy", { name: commentaryName(commentary) });
      if (comments.length) {
        insertNote(view.top, noteDetails(whole, commentary, comments, order, why), order);
      }
    } else {
      var byParagraph = [];
      comments.forEach(function (comment) {
        // A comment with no usable line, or past the last paragraph, goes with the
        // last one rather than vanishing.
        var line = Number.isInteger(comment.ref[2]) ? comment.ref[2] : view.notes.length;
        var index = Math.min(Math.max(line, 1), view.notes.length) - 1;
        (byParagraph[index] = byParagraph[index] || []).push(comment);
      });
      byParagraph.forEach(function (here, index) {
        var summary = commentary.id === "rashi"
          ? t(locale, "reader.rashiCount", { n: here.length })
          : commentaryName(commentary);
        insertNote(view.notes[index], noteDetails(summary, commentary, here, order), order);
      });
    }
    view.credit.textContent = !comments.length
      ? commentaryText("commentary.none", commentary.id)
      : loaded.license
        ? commentaryText("commentary.credit", commentary.id, { license: loaded.license })
        : "";
  }

  // The Steinsaltz view: his commentary alone, a paragraph at a time, with the Gemara
  // words he quotes in bold. The Gemara itself is not repeated.
  function renderSteinsaltz(data, request) {
    var commentary = readerCommentaryList().filter(function (candidate) {
      return candidate.id === "steinsaltz";
    })[0];
    var text = el("div", "reader-text steinsaltz-text");
    var status = el("p", "attribution", t(locale, "commentary.loading"));
    text.appendChild(status);
    loadReaderCommentary(
      commentary.id,
      data,
      request,
      function (loaded) {
        loaded.comments.forEach(function (comment) {
          text.insertBefore(commentParagraph(commentary, comment), status);
        });
        status.textContent = !loaded.comments.length
          ? commentaryText("commentary.none", commentary.id)
          : loaded.license
            ? commentaryText("commentary.credit", commentary.id, { license: loaded.license })
            : "";
      },
      function () { status.textContent = commentaryText("commentary.error", commentary.id); }
    );
    return text;
  }

  // The vocalized text a paragraph at a time. A commentary's comments are numbered by
  // the paragraph they explain (ref[2], the line or paragraph; no Gemara paragraph is
  // dropped on load, so number k is paragraph k), so each paragraph that has any gets a
  // button per ticked commentary, and the rest of the page stays uncluttered.
  function renderParagraphs(data, request) {
    var text = el("div", "reader-text");
    var top = el("div", "reader-notes");
    text.appendChild(top);
    var notes = data.segments.map(function (segment) {
      text.appendChild(hebrewSpan("p", "reader-segment", segment));
      var container = el("div", "reader-notes");
      text.appendChild(container);
      return container;
    });
    var credits = el("div", "reader-credits");
    text.appendChild(credits);
    chosenCommentaries().forEach(function (commentary, order) {
      var credit = el("p", "attribution", t(locale, "commentary.loading"));
      credits.appendChild(credit);
      var view = { top: top, notes: notes, credit: credit };
      loadReaderCommentary(
        commentary.id,
        data,
        request,
        function (loaded) { showCommentary(commentary, order, loaded, view); },
        function () { credit.textContent = commentaryText("commentary.error", commentary.id); }
      );
    });
    return text;
  }

  // צורת הדף: the Gemara without niqqud as one running text, and Rashi as
  // another, laid out beside it (see .daf in styles.css).
  // The hint is only true when the two columns are wider than the screen.
  function syncDafHint() {
    var scroller = readerPageEl.querySelector(".daf-scroll");
    var hint = readerPageEl.querySelector(".daf-hint");
    if (scroller && hint) hint.hidden = scroller.scrollWidth <= scroller.clientWidth + 1;
  }

  // One commentary's column beside the Gemara: its comments run on as one text.
  function printColumn(commentary, data, request) {
    var column = hebrewSpan("div", "daf-commentary daf-commentary-" + commentary.id);
    var text = hebrewSpan("p", "daf-commentary-text", t(locale, "commentary.loading"));
    column.appendChild(text);
    loadReaderCommentary(
      commentary.id,
      data,
      request,
      function (loaded) {
        text.textContent = "";
        if (!loaded.comments.length) {
          text.textContent = commentaryText("commentary.none", commentary.id);
        } else if (commentary.id === "rashi") {
          // The page can be newer than the API (they deploy separately): an older
          // server sends no `plain`, so fall back to the text as it is.
          text.textContent = loaded.comments.map(function (comment) {
            return typeof comment.plain === "string" ? comment.plain : comment.text;
          }).filter(function (plain) { return plain.length > 0; }).join(" ");
        } else {
          loaded.comments.forEach(function (comment, index) {
            if (index) text.appendChild(document.createTextNode(" "));
            commentNodes(commentary, comment.text).forEach(function (node) { text.appendChild(node); });
          });
        }
        if (loaded.license) {
          column.appendChild(el("p", "attribution", commentaryText("commentary.credit", commentary.id, { license: loaded.license })));
        }
      },
      function () { text.textContent = commentaryText("commentary.error", commentary.id); }
    );
    return column;
  }

  function renderPrintLayout(data, request) {
    var columns = chosenCommentaries().filter(function (commentary) {
      return PRINTED_COLUMNS.indexOf(commentary.id) !== -1;
    });
    var wrapper = el("div", "daf-wrapper");
    var scroller = el("div", "daf-scroll");
    // On amud b Rashi is the column on the right, so the widest track is the Gemara's, second.
    var rashiFirst = data.amud === "b" && columns.some(function (commentary) { return commentary.id === "rashi"; });
    var daf = el("div", "daf daf-columns-" + columns.length + (rashiFirst ? " daf-rashi-first" : ""));
    daf.appendChild(hebrewSpan("p", "daf-gemara", data.plainSegments.join(" ")));
    scroller.appendChild(daf);
    if (columns.length) {
      var hint = el("p", "daf-hint", t(locale, "reader.rotateHint"));
      hint.hidden = true; // shown by syncDafHint once the width is known
      wrapper.appendChild(hint);
    }
    wrapper.appendChild(scroller);
    columns.forEach(function (commentary) { daf.appendChild(printColumn(commentary, data, request)); });
    return wrapper;
  }

  function renderReaderPage(data) {
    readerPageEl.textContent = "";
    syncReaderPrintLink(data);
    readerPageEl.appendChild(hebrewSpan("h2", "reader-citation", data.citation));
    // A server that predates plainSegments gets the vocalized view, not a blank page.
    if (effectiveReaderView() === "page" && Array.isArray(data.plainSegments)) {
      readerPageEl.appendChild(renderPrintLayout(data, readerRequest));
      // On amud b Rashi is the column on the right, which is where a right-to-left
      // scroller starts; scroll over to the Gemara so it is what you see first.
      var scroller = readerPageEl.querySelector(".daf-scroll");
      var gemara = scroller.querySelector(".daf-gemara");
      if (data.amud === "b") {
        scroller.scrollLeft += gemara.getBoundingClientRect().right - scroller.getBoundingClientRect().right;
      }
      syncDafHint();
    } else if (effectiveReaderView() === "steinsaltz") {
      readerPageEl.appendChild(renderSteinsaltz(data, readerRequest));
    } else {
      readerPageEl.appendChild(renderParagraphs(data, readerRequest));
    }
    if (data.license) {
      readerPageEl.appendChild(el("p", "attribution", t(locale, "reader.credit", { license: data.license })));
    }
    if (/^https:\/\//.test(data.sefariaUrl || "")) {
      var link = el("a", "copy", t(locale, "openInSefaria"));
      link.href = data.sefariaUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      readerPageEl.appendChild(link);
    }
    syncReaderNav(data);
  }

  function showReaderPage(position, pushHash) {
    var request = ++readerRequest;
    readerPosition = position;
    readerData = null;
    syncReaderPickers();
    syncReaderNav(null);
    syncReaderPrintLink(null);
    if (pushHash && location.hash !== readerHash(position)) {
      history.pushState(null, "", readerHash(position));
    }

    showReaderSkeleton();
    var disarm = armWaking();

    var params = new URLSearchParams({
      book: READER_BOOK,
      tractate: position.tractate,
      daf: String(position.daf),
      amud: position.amud,
    });
    apiFetch("/api/daf?" + params.toString())
      .then(function (response) {
        return response.json().then(function (body) {
          if (!response.ok) {
            var failure = new Error("daf " + response.status);
            failure.userMessage = body.code && t(locale, "error.code." + body.code);
            throw failure;
          }
          return body;
        }, function () {
          throw new Error("daf " + response.status); // an error body that is not JSON
        });
      })
      .then(function (data) {
        if (request !== readerRequest) return;
        readerData = data;
        saveReaderPosition(position);
        renderReaderPage(data);
        readerEl.scrollIntoView({ block: "start" });
      })
      .catch(function (error) {
        if (request !== readerRequest) return;
        readerPageEl.textContent = "";
        readerPageEl.appendChild(notice(t(locale, "error.title"), error.userMessage || t(locale, "reader.error"), "error"));
      })
      .then(function () {
        if (request === readerRequest) readerPageEl.setAttribute("aria-busy", "false");
        disarm();
      });
  }

  function showReaderSkeleton() {
    readerPageEl.setAttribute("aria-busy", "true");
    readerPageEl.textContent = "";
    var skeleton = el("div", "skeleton");
    for (var i = 0; i < 4; i++) skeleton.appendChild(el("div", "line"));
    readerPageEl.appendChild(skeleton);
  }

  // Before the tractate list arrives (a sleeping server) the pickers have nothing to
  // offer: say so, rather than showing empty boxes above an empty card.
  function showReaderLoading() {
    [readerTractateSelect, readerDafSelect].forEach(function (select) {
      select.textContent = "";
      var option = document.createElement("option");
      option.textContent = t(locale, "commentary.loading");
      select.appendChild(option);
      select.disabled = true;
    });
    readerEl.classList.add("reader-loading");
    readerAmudGroup.querySelectorAll("button").forEach(function (button) { button.disabled = true; });
    syncReaderNav(null);
    showReaderSkeleton();
  }

  function ensureReaderTractates() {
    if (readerTractates) return Promise.resolve();
    var disarm = armWaking();
    return apiFetch("/api/tractates?book=" + encodeURIComponent(READER_BOOK))
      .then(function (response) {
        if (!response.ok) throw new Error("tractates " + response.status);
        return response.json();
      })
      .then(function (data) {
        readerTractates = data;
        disarm();
      }, function (error) {
        disarm();
        throw error;
      });
  }

  // `position` is where to open; without one, where the visitor left off, or
  // the first page of the first tractate.
  function openReader(position, pushHash) {
    showView("read");
    if (!readerTractates) showReaderLoading();
    ensureReaderTractates()
      .then(function () {
        var first = readerTractates.tractates[0];
        var start = position || readerPosition || loadReaderPosition() ||
          { tractate: first.he, daf: first.pageRange.first.daf, amud: first.pageRange.first.amud };
        readerPosition = start;
        syncReaderCommentaries();
        populateReaderTractates();
        showReaderPage(start, pushHash);
      })
      .catch(function () {
        // Nothing to pick from: drop the "Loading…" labels. Opening the tab again retries.
        readerEl.classList.remove("reader-loading");
        [readerTractateSelect, readerDafSelect].forEach(function (select) { select.textContent = ""; });
        readerPageEl.textContent = "";
        readerPageEl.appendChild(notice(t(locale, "error.title"), t(locale, "reader.error"), "error"));
      });
  }

  function goToReaderPage(page) {
    showReaderPage({ tractate: readerPosition.tractate, daf: page.daf, amud: page.amud }, true);
  }

  viewTabs.addEventListener("click", function (event) {
    var tab = event.target.closest(".view-tab");
    if (!tab) return;
    if (tab.dataset.view === "read") {
      openReader(null, true);
    } else if (!readerEl.hidden) {
      showView("search");
      history.pushState(null, "", location.pathname + location.search);
    }
  });

  readerTractateSelect.addEventListener("change", function () {
    var first = readerTractateInfo(readerTractateSelect.value).pageRange.first;
    showReaderPage({ tractate: readerTractateSelect.value, daf: first.daf, amud: first.amud }, true);
  });

  readerDafSelect.addEventListener("change", function () {
    var info = readerTractateInfo(readerPosition.tractate);
    var daf = Number(readerDafSelect.value);
    // Keep the side if the new daf has it; a tractate's first or last daf may have only one.
    var amud = pageInRange(info, daf, readerPosition.amud) ? readerPosition.amud : (readerPosition.amud === "a" ? "b" : "a");
    showReaderPage({ tractate: readerPosition.tractate, daf: daf, amud: amud }, true);
  });

  readerAmudGroup.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button || button.disabled) return;
    showReaderPage({ tractate: readerPosition.tractate, daf: readerPosition.daf, amud: button.dataset.amud }, true);
  });

  readerEl.addEventListener("click", function (event) {
    if (!readerData) return;
    if (event.target.closest(".reader-prev") && readerData.previous) goToReaderPage(readerData.previous);
    if (event.target.closest(".reader-next") && readerData.next) goToReaderPage(readerData.next);
  });

  window.addEventListener("resize", syncDafHint);

  readerViewGroup.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button || button.dataset.view === readerView) return;
    readerView = button.dataset.view;
    saveReaderView(readerView);
    syncReaderViewButtons();
    syncReaderCommentaries();
    if (readerData) renderReaderPage(readerData);
  });

  syncReaderViewButtons();

  readerCommentariesPanel.addEventListener("change", function (event) {
    var id = event.target.value;
    readerCommentaryChoice = readerCommentaryChoice.filter(function (chosen) { return chosen !== id; });
    if (event.target.checked) readerCommentaryChoice.push(id);
    saveReaderCommentaries(readerCommentaryChoice);
    if (readerData) renderReaderPage(readerData);
  });

  // The dropdown closes when the visitor taps anywhere else, presses Escape, or tabs out of it.
  document.addEventListener("click", function (event) {
    if (!event.target.closest("#reader-commentaries")) readerCommentariesEl.open = false;
  });
  readerCommentariesEl.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    readerCommentariesEl.open = false;
    readerCommentariesEl.querySelector("summary").focus();
  });
  readerCommentariesEl.addEventListener("focusout", function (event) {
    if (event.relatedTarget && !readerCommentariesEl.contains(event.relatedTarget)) {
      readerCommentariesEl.open = false;
    }
  });

  // --- Wiring ------------------------------------------------------------

  clearBtn.addEventListener("click", clearSearch);

  // Keeps the button in step while typing, not just after a search.
  input.addEventListener("input", function () {
    syncClearButton();
    autosizeInput();
  });

  // A <textarea> doesn't submit its form on Enter -- it inserts a newline.
  // Queries here are always single-line, so Enter submits like the old
  // <input> did; Shift+Enter is left alone in case someone pastes/edits
  // multi-line text before searching.
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit ? form.requestSubmit() : runSearch(input.value);
    }
  });

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
    var position = readerPositionFromHash();
    if (position) {
      openReader(position, false);
      return;
    }
    showView("search");
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

  function bookById(id) {
    if (!lastBooks) return null;
    for (var i = 0; i < lastBooks.length; i++) {
      if (lastBooks[i].id === id) return lastBooks[i];
    }
    return null;
  }

  // The footer credits whichever book is selected, from the license and
  // source the API reports for it. Until /api/books answers, the static text
  // for the default book stands.
  function renderFooterAttribution() {
    var node = document.getElementById("footer-attribution");
    var book = bookById(selectedBook);
    if (!book) {
      node.innerHTML = t(locale, "footer.attributionHtml");
      return;
    }
    node.textContent = "";
    node.appendChild(document.createTextNode(localizedName(book.he, book.en) + ": "));
    node.appendChild(el("strong", null, book.textSource));
    node.appendChild(document.createTextNode(" — " + t(locale, "footer.attribution.from") + " "));
    if (/^https:\/\//.test(book.source)) {
      var link = el("a", null, "Sefaria");
      link.href = book.source;
      link.rel = "noopener noreferrer";
      link.target = "_blank";
      node.appendChild(link);
    } else {
      node.appendChild(document.createTextNode("Sefaria"));
    }
    node.appendChild(document.createTextNode(", " + book.license + "."));
  }

  // "All of Shas" is only true of the Bavli; the other books are not Shas.
  function syncTractateAllLabel() {
    var key = selectedBook && selectedBook !== bookDefault ? "tractate.allInBook" : "tractate.all";
    tractateSelect.options[0].textContent = t(locale, key);
  }

  // The picker only appears when there is a real choice, so a deployment
  // with a single book looks exactly as it did before books existed.
  function populateBookSelect() {
    bookSelect.textContent = "";
    lastBooks.forEach(function (book) {
      var option = document.createElement("option");
      option.value = book.id;
      option.textContent = localizedName(book.he, book.en);
      bookSelect.appendChild(option);
    });
    bookSelect.value = selectedBook;
    bookField.hidden = lastBooks.length < 2;
    renderFooterAttribution();
    syncTractateAllLabel();
  }

  function onBooksLoaded(data) {
    lastBooks = data.books;
    bookDefault = data.default;
    if (!bookById(selectedBook)) selectedBook = bookDefault;
    populateBookSelect();
    syncReaderCommentaries();
    if (readerData) renderReaderPage(readerData);
    // The tractate list was requested before the book list was known; refetch
    // it if the stored choice turned out to be a different (or no longer
    // available) book.
    if ((tractatesBook || bookDefault) !== selectedBook) loadTractates();
  }

  function loadTractates() {
    var requested = selectedBook;
    tractatesBook = requested;
    var path = "/api/tractates" + (requested ? "?book=" + encodeURIComponent(requested) : "");
    var disarm = armWaking();
    apiFetch(path)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (tractatesBook !== requested) return; // a newer request has replaced this one
        populateTractateSelect(data);
      })
      .catch(function () { /* the filter just stays at "all tractates" */ })
      .then(disarm);
  }

  bookSelect.addEventListener("change", function () {
    selectedBook = bookSelect.value;
    saveBook(selectedBook);
    tractateSelect.value = "";
    populateTractateSelect({ tractates: [] });
    renderFooterAttribution();
    syncTractateAllLabel();
    loadTractates();
  });

  loadTractates();

  var disarmBooksWaking = armWaking();
  apiFetch("/api/books")
    .then(function (r) { return r.json(); })
    .then(onBooksLoaded)
    .catch(function () { /* no picker; the default book keeps working */ })
    .then(disarmBooksWaking);

  applyStaticTranslations();

  var disarmHealthWaking = armWaking();
  apiFetch("/api/health")
    .catch(function () {})
    .then(disarmHealthWaking);

  var initialPosition = readerPositionFromHash();
  var initial = fromHash();
  if (initialPosition) openReader(initialPosition, false);
  else if (initial) runSearch(initial, false);
})();
