/*
 * Shas Radar — translations.
 *
 * Everything here is UI chrome: labels, buttons, headings, messages. The
 * Talmud text itself -- the KWIC context, the expanded paragraph, and the
 * citation (e.g. "ברכות ה.") -- is never translated; it stays in the
 * original Hebrew/Aramaic in every locale, the same way פסוק לשם never
 * translates a verse or its reference. A search query is Hebrew input by
 * definition (the API rejects anything else), so the example chips and the
 * placeholder's example text stay Hebrew too, in every locale, for the same
 * reason פסוק לשם's name chips do.
 *
 * Tractate and seder names *do* switch with the locale, using the English
 * names already carried on every match and in /api/tractates -- but only
 * for Hebrew/English. There is no third set of French tractate names to
 * fetch or invent, so the French UI falls back to the English name rather
 * than leave it in Hebrew alone; app.js's tractateName()/sederName()
 * helpers are what apply that fallback.
 *
 * Loaded before app.js, which owns the interpolation and DOM wiring; this
 * file only holds data and locale-formatting helpers.
 */

var I18N = (function () {
  "use strict";

  var STRINGS = {
    he: {
      "meta.description": "חיפוש מילים, ביטויים ומשפטים בכל הש״ס, עם הקשר מתכוונן של מילים לפני ואחרי.",
      "doc.title": "ש״ס רדאר — חיפוש בש״ס",

      "header.title": "ש״ס רדאר",
      "header.subtitle": "חיפוש מילים, ביטויים ומשפטים בכל הש״ס — עם הקשר לפני ואחרי",

      "search.label": "מילה בודדת, מילים ברצף או מופרדות בפסיק",
      "search.placeholder": "לדוגמה: {example}",
      "search.button": "חיפוש",

      "stepper.before": "מילים לפני",
      "stepper.after": "מילים אחרי",
      "stepper.less": "פחות",
      "stepper.more": "יותר",

      "tractate.label": "מסכת (אופציונלי)",
      "tractate.all": "כל הש״ס",

      "howItWorks.title": "איך זה עובד?",
      "howItWorks.p1": "מילה בודדת — נמצאת גם עם אותיות שימוש בתחילתה (ד/ל/ו/כ/ב וכו׳), כגון שחיפוש \"אביי\" מוצא גם \"דאביי\" ו\"לאביי\".",
      "howItWorks.p2": "כמה מילים ברצף (ללא פסיק) — נמצא ברצף הזה, כולל כשלמילה הראשונה יש אות שימוש בתחילתה.",
      "howItWorks.p3": "פסיק מפריד בין כמה מונחים נפרדים לחיפוש (עד 5 בבת אחת).",

      "examples.ariaLabel": "דוגמאות",

      "install.button": "התקנה",
      "install.helpHeading": "איך להתקין",
      "install.iosStep1": "הקישו על כפתור השיתוף ⬆️ בסרגל הכלים",
      "install.iosStep2": "גללו ובחרו ״הוסף למסך הבית״",
      "install.genericStep1": "פתחו את תפריט הדפדפן (⋮ או ≡)",
      "install.genericStep2": "בחרו ״התקנת אפליקציה״ או ״הוספה למסך הבית״",

      "waking.message": "מעיר את השרת… בפעם הראשונה אחרי זמן מנוחה זה עלול לקחת כדקה.",

      "result.empty.title": 'לא נמצאו תוצאות עבור "{query}"',
      "result.empty.body": "נסו מילה אחרת, או בדקו את האיות.",
      "result.showingOf": "מציג {shown} מתוך {totalPhrase}",
      "result.total": { one: "תוצאה אחת", two: "שתי תוצאות", other: "{n} תוצאות" },
      "result.showFullParagraph": "הצג קטע מלא",
      "matchKind.exact": "התאמה מדויקת",
      "matchKind.withPrefix": "עם אות שימוש",
      "matchKind.exactTag": "{n} מדויק",
      "matchKind.withPrefixTag": "{n} עם אות שימוש",
      "openInSefaria": "פתח בספריא ↗",

      "copy.button": "העתקה",
      "copy.done": "✓ הועתק",
      "copy.toastCopied": "הציטוט הועתק",
      "copy.toastFailed": "ההעתקה נכשלה",

      "more.button": "הצג עוד {n}",
      "more.loading": "טוען…",
      "more.error": "שגיאה בטעינה — נסו שוב",

      "connections.button": "מצא קשר בין התוצאות",
      "connections.loading": "מחפש קשר…",
      "connections.settingsLink": "⚙ הגדרות AI",
      "connections.orExternal": "או שאלו AI חיצוני ↗",
      "connections.error.generic": "לא ניתן היה למצוא קשר כרגע",
      "connections.error.code.no_credential": "אין מפתח AI זמין",
      "connections.error.code.authentication_error": "המפתח שהוזן לא תקין",
      "connections.error.code.provider_invalid": "הספק דחה את הבקשה — ייתכן שהמפתח שגוי",
      "connections.error.code.timeout": "הבקשה ל-AI ארכה יותר מדי זמן — נסו שוב",
      "connections.error.code.quota_exceeded": "המכסה היומית לניתוח AI נוצלה — נסו שוב מאוחר יותר",
      "connections.error.code.all_providers_exhausted": "שירותי ה-AI אינם זמינים כרגע — נסו שוב מאוחר יותר",
      "connections.error.tryOwnKey": "פתחו את הגדרות ה-AI כדי להוסיף מפתח משלכם, או שאלו AI חיצוני:",
      "connections.selectHint": "סמנו לפחות שתי תוצאות כדי למצוא קשר ביניהן",
      "connections.selectHintOneMore": "סמנו עוד תוצאה אחת לפחות",
      "connections.selectedCount": { one: "תוצאה אחת מסומנת", two: "שתי תוצאות מסומנות", other: "{n} תוצאות מסומנות" },
      "connections.selectForAi": "שלחו ל-AI",
      "connections.selectionCapToast": "אפשר לסמן עד {n} תוצאות בכל פעם",

      "aiSettings.openButton": "⚙ הגדרות AI",
      "aiSettings.heading": "הגדרות AI",
      "aiSettings.close": "סגירה",
      "aiSettings.description": "\"מצא קשר בין התוצאות\" נעזר במודל שפה (AI). אפשר להשתמש במפתח משותף של השרת (אם מוגדר) או להוסיף מפתח אישי משלכם — חינמי אצל כמה מהספקים.",
      "aiSettings.trustNote": "מפתח שתוסיפו נשלח רק לשרת של האפליקציה הזו, ומועבר משם לספק שבחרתם בלבד — הוא לעולם לא נשמר בשרת ולא מופיע ביומן. השמירה עצמה היא רק בדפדפן שלכם (localStorage).",
      "aiSettings.externalHeading": "בלי מפתח בכלל? אפשר לשאול AI חיצוני ישירות:",
      "aiSettings.serverAvailable": "✓ מפתח משותף זמין בשרת — לא חובה מפתח משלכם",
      "aiSettings.serverUnavailable": "אין מפתח משותף לספק הזה בשרת — הוסיפו משלכם",
      "aiSettings.freeTag": "חינמי",
      "aiSettings.getKeyPrefix": "קבלו מפתח ב־",
      "aiSettings.keyPlaceholder": "מפתח API…",
      "aiSettings.addKey": "הוספה",
      "aiSettings.noKeysYet": "לא נשמרו מפתחות לספק זה",
      "aiSettings.removeAria": "הסרת המפתח {key}",
      "aiSettings.showAria": "הצג את המפתח",
      "aiSettings.hideAria": "הסתר את המפתח",
      "aiSettings.keySavedToast": "המפתח נשמר בדפדפן שלכם",
      "aiSettings.keyRemovedToast": "המפתח הוסר",
      "aiSettings.keyDuplicateToast": "המפתח הזה כבר שמור",
      "aiSettings.keyEmptyToast": "הקלידו מפתח לפני ההוספה",

      "external.copiedToast": "השאלה הועתקה — הדביקו אותה בצ'אט שנפתח",
      "external.questionIntro": "הנה תוצאות חיפוש מתוך הש״ס. מה מחבר ביניהן?",
      "external.googleAiMode": "מצב AI של גוגל",

      "error.title": "שגיאה",
      "error.generic": "החיפוש נכשל",
      "error.code.empty": "יש להזין מילה, שם או ביטוי לחיפוש",
      "error.code.too_many": "אפשר לחפש עד 5 מונחים בבת אחת",
      "error.code.invalid_query": "יש להזין טקסט באותיות עבריות",

      "footer.attributionHtml":
        "נוסח הש״ס: <strong>דפוס וילנא</strong> — מתוך " +
        "<a href=\"https://github.com/Sefaria/Sefaria-Export\" rel=\"noopener noreferrer\" target=\"_blank\">Sefaria</a>, " +
        "נחלת הכלל.",
      "footer.summary": "{wordsPhrase}, {tractatesPhrase}.",
      "footer.words": { one: "מילה אחת", two: "שתי מילים", other: "{n} מילים" },
      "footer.tractates": { one: "מסכת אחת", two: "שתי מסכתות", other: "{n} מסכתות" },
      "footer.note": "חיפוש זה בודק התאמה מדויקת, התאמה עם אותיות שימוש, וביטויים ברצף — ללא ניתוח דקדוקי מלא.",
      "footer.credit": "נבנה על ידי",
    },

    en: {
      "meta.description": "Search all of the Babylonian Talmud for words, names, and phrases, with adjustable context before and after each match.",
      "doc.title": "Shas Radar — Search the Talmud",

      "header.title": "Shas Radar",
      "header.subtitle": "Search words, names, and phrases across all of Shas — with context before and after",

      "search.label": "Word, name, phrase, or several separated by a comma",
      "search.placeholder": "e.g. {example}",
      "search.button": "Search",

      "stepper.before": "Words before",
      "stepper.after": "Words after",
      "stepper.less": "Less",
      "stepper.more": "More",

      "tractate.label": "Tractate (optional)",
      "tractate.all": "All of Shas",

      "howItWorks.title": "How does this work?",
      "howItWorks.p1": "A single word — also found with an attached clitic (ד/ל/ו/כ/ב, etc.) at the front, so searching \"אביי\" also finds \"דאביי\" and \"לאביי\".",
      "howItWorks.p2": "Several words in a row (no comma) — matches that consecutive phrase, including when the first word carries an attached clitic.",
      "howItWorks.p3": "A comma separates several independent terms to search (up to 5 at once).",

      "examples.ariaLabel": "Examples",

      "install.button": "Install",
      "install.helpHeading": "How to install",
      "install.iosStep1": "Tap the Share button ⬆️ in the toolbar",
      "install.iosStep2": "Scroll down and choose \"Add to Home Screen\"",
      "install.genericStep1": "Open your browser's menu (⋮ or ≡)",
      "install.genericStep2": "Choose \"Install app\" or \"Add to Home Screen\"",

      "waking.message": "Waking up the server… the first request after a while can take up to a minute.",

      "result.empty.title": 'No results found for "{query}"',
      "result.empty.body": "Try a different word, or check the spelling.",
      "result.showingOf": "Showing {shown} of {totalPhrase}",
      "result.total": { one: "1 result", other: "{n} results" },
      "result.showFullParagraph": "Show full paragraph",
      "matchKind.exact": "Exact match",
      "matchKind.withPrefix": "With attached prefix",
      "matchKind.exactTag": "{n} exact",
      "matchKind.withPrefixTag": "{n} with prefix",
      "openInSefaria": "Open on Sefaria ↗",

      "copy.button": "Copy",
      "copy.done": "✓ Copied",
      "copy.toastCopied": "Quote copied",
      "copy.toastFailed": "Copy failed",

      "more.button": "Show {n} more",
      "more.loading": "Loading…",
      "more.error": "Failed to load — try again",

      "connections.button": "Find connections between results",
      "connections.loading": "Looking for connections…",
      "connections.settingsLink": "⚙ AI settings",
      "connections.orExternal": "or ask an external AI ↗",
      "connections.error.generic": "Couldn't find a connection right now",
      "connections.error.code.no_credential": "No AI key is available",
      "connections.error.code.authentication_error": "That key didn't work",
      "connections.error.code.provider_invalid": "The provider rejected the request — the key may be wrong",
      "connections.error.code.timeout": "The AI request took too long — try again",
      "connections.error.code.quota_exceeded": "Today's AI analysis quota is used up — try again later",
      "connections.error.code.all_providers_exhausted": "AI services are unavailable right now — try again later",
      "connections.error.tryOwnKey": "Open AI settings to add your own key, or ask an external AI instead:",
      "connections.selectHint": "Check at least 2 results to find a connection between them",
      "connections.selectHintOneMore": "Check at least 1 more result",
      "connections.selectedCount": { one: "1 result selected", other: "{n} results selected" },
      "connections.selectForAi": "Send to AI",
      "connections.selectionCapToast": "You can select up to {n} results at a time",

      "aiSettings.openButton": "⚙ AI settings",
      "aiSettings.heading": "AI settings",
      "aiSettings.close": "Close",
      "aiSettings.description": "\"Find connections between results\" uses a language model (AI). You can use the server's shared key (if one is set) or add your own — free with a few providers.",
      "aiSettings.trustNote": "A key you add is sent only to this app's own server, and forwarded from there only to the provider you picked — it's never stored on the server or logged. It's saved only in your own browser (localStorage).",
      "aiSettings.externalHeading": "No key at all? Ask an external AI directly:",
      "aiSettings.serverAvailable": "✓ A shared key is set on the server — your own key is optional",
      "aiSettings.serverUnavailable": "No shared key for this provider on the server — add your own",
      "aiSettings.freeTag": "free",
      "aiSettings.getKeyPrefix": "Get a key at ",
      "aiSettings.keyPlaceholder": "API key…",
      "aiSettings.addKey": "Add",
      "aiSettings.noKeysYet": "No keys saved for this provider yet",
      "aiSettings.removeAria": "Remove key {key}",
      "aiSettings.showAria": "Show the key",
      "aiSettings.hideAria": "Hide the key",
      "aiSettings.keySavedToast": "Key saved in your browser",
      "aiSettings.keyRemovedToast": "Key removed",
      "aiSettings.keyDuplicateToast": "That key is already saved",
      "aiSettings.keyEmptyToast": "Type a key before adding it",

      "external.copiedToast": "Question copied — paste it into the chat that opens",
      "external.questionIntro": "Here are search results from the Babylonian Talmud. What connects them?",
      "external.googleAiMode": "Google AI Mode",

      "error.title": "Error",
      "error.generic": "Search failed",
      "error.code.empty": "Enter a word, name, or phrase to search",
      "error.code.too_many": "You can search for up to 5 terms at once",
      "error.code.invalid_query": "Enter text using Hebrew letters",

      "footer.attributionHtml":
        "Talmud text: <strong>Vilna edition</strong> — from " +
        "<a href=\"https://github.com/Sefaria/Sefaria-Export\" rel=\"noopener noreferrer\" target=\"_blank\">Sefaria</a>, " +
        "Public Domain.",
      "footer.summary": "{wordsPhrase}, {tractatesPhrase}.",
      "footer.words": { one: "1 word", other: "{n} words" },
      "footer.tractates": { one: "1 tractate", other: "{n} tractates" },
      "footer.note": "This search checks exact matches, matches with an attached prefix, and consecutive phrases — without full grammatical analysis.",
      "footer.credit": "Built by",
    },

    fr: {
      "meta.description": "Recherchez des mots, des noms et des expressions dans tout le Talmud de Babylone, avec un contexte ajustable avant et après chaque résultat.",
      "doc.title": "Shas Radar — Recherche dans le Talmud",

      "header.title": "Shas Radar",
      "header.subtitle": "Recherche de mots, de noms et d'expressions dans tout le Chas — avec le contexte avant et après",

      "search.label": "Mot, nom, expression, ou plusieurs séparés par une virgule",
      "search.placeholder": "par ex. {example}",
      "search.button": "Rechercher",

      "stepper.before": "Mots avant",
      "stepper.after": "Mots après",
      "stepper.less": "Moins",
      "stepper.more": "Plus",

      "tractate.label": "Traité (optionnel)",
      "tractate.all": "Tout le Chas",

      "howItWorks.title": "Comment ça marche ?",
      "howItWorks.p1": "Un seul mot — trouvé aussi avec une lettre de liaison attachée au début (ד/ל/ו/כ/ב, etc.), par exemple une recherche de « אביי » trouve aussi « דאביי » et « לאביי ».",
      "howItWorks.p2": "Plusieurs mots à la suite (sans virgule) — trouve cette expression consécutive, y compris quand le premier mot porte une lettre de liaison attachée.",
      "howItWorks.p3": "Une virgule sépare plusieurs termes indépendants à rechercher (jusqu'à 5 à la fois).",

      "examples.ariaLabel": "Exemples",

      "install.button": "Installer",
      "install.helpHeading": "Comment installer",
      "install.iosStep1": "Appuyez sur le bouton Partager ⬆️ dans la barre d'outils",
      "install.iosStep2": "Faites défiler et choisissez « Sur l'écran d'accueil »",
      "install.genericStep1": "Ouvrez le menu du navigateur (⋮ ou ≡)",
      "install.genericStep2": "Choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil »",

      "waking.message": "Réveil du serveur… la première requête après une pause peut prendre jusqu'à une minute.",

      "result.empty.title": 'Aucun résultat trouvé pour « {query} »',
      "result.empty.body": "Essayez un autre mot, ou vérifiez l'orthographe.",
      "result.showingOf": "Affichage de {shown} sur {totalPhrase}",
      "result.total": { one: "1 résultat", other: "{n} résultats" },
      "result.showFullParagraph": "Afficher le passage complet",
      "matchKind.exact": "Correspondance exacte",
      "matchKind.withPrefix": "Avec lettre de liaison",
      "matchKind.exactTag": "{n} exact",
      "matchKind.withPrefixTag": "{n} avec préfixe",
      "openInSefaria": "Ouvrir sur Sefaria ↗",

      "copy.button": "Copier",
      "copy.done": "✓ Copié",
      "copy.toastCopied": "Citation copiée",
      "copy.toastFailed": "Échec de la copie",

      "more.button": "Afficher {n} de plus",
      "more.loading": "Chargement…",
      "more.error": "Échec du chargement — réessayez",

      "connections.button": "Trouver des liens entre les résultats",
      "connections.loading": "Recherche de liens…",
      "connections.settingsLink": "⚙ Paramètres IA",
      "connections.orExternal": "ou demandez à une IA externe ↗",
      "connections.error.generic": "Impossible de trouver un lien pour le moment",
      "connections.error.code.no_credential": "Aucune clé IA n'est disponible",
      "connections.error.code.authentication_error": "Cette clé n'a pas fonctionné",
      "connections.error.code.provider_invalid": "Le fournisseur a rejeté la requête — la clé est peut-être incorrecte",
      "connections.error.code.timeout": "La requête IA a pris trop de temps — réessayez",
      "connections.error.code.quota_exceeded": "Le quota d'analyse IA du jour est épuisé — réessayez plus tard",
      "connections.error.code.all_providers_exhausted": "Les services d'IA sont indisponibles pour le moment — réessayez plus tard",
      "connections.error.tryOwnKey": "Ouvrez les paramètres IA pour ajouter votre propre clé, ou demandez à une IA externe :",
      "connections.selectHint": "Cochez au moins 2 résultats pour trouver un lien entre eux",
      "connections.selectHintOneMore": "Cochez au moins 1 résultat de plus",
      "connections.selectedCount": { one: "1 résultat sélectionné", other: "{n} résultats sélectionnés" },
      "connections.selectForAi": "Envoyer à l'IA",
      "connections.selectionCapToast": "Vous pouvez sélectionner jusqu'à {n} résultats à la fois",

      "aiSettings.openButton": "⚙ Paramètres IA",
      "aiSettings.heading": "Paramètres IA",
      "aiSettings.close": "Fermer",
      "aiSettings.description": "« Trouver des liens entre les résultats » utilise un modèle de langage (IA). Vous pouvez utiliser la clé partagée du serveur (si définie) ou ajouter la vôtre — gratuite chez plusieurs fournisseurs.",
      "aiSettings.trustNote": "Une clé que vous ajoutez est envoyée uniquement au serveur de cette application, et transmise de là uniquement au fournisseur choisi — elle n'est jamais stockée sur le serveur ni journalisée. Elle n'est enregistrée que dans votre propre navigateur (localStorage).",
      "aiSettings.externalHeading": "Pas de clé du tout ? Demandez directement à une IA externe :",
      "aiSettings.serverAvailable": "✓ Une clé partagée est configurée sur le serveur — la vôtre est optionnelle",
      "aiSettings.serverUnavailable": "Aucune clé partagée pour ce fournisseur sur le serveur — ajoutez la vôtre",
      "aiSettings.freeTag": "gratuit",
      "aiSettings.getKeyPrefix": "Obtenez une clé sur ",
      "aiSettings.keyPlaceholder": "Clé API…",
      "aiSettings.addKey": "Ajouter",
      "aiSettings.noKeysYet": "Aucune clé enregistrée pour ce fournisseur",
      "aiSettings.removeAria": "Supprimer la clé {key}",
      "aiSettings.showAria": "Afficher la clé",
      "aiSettings.hideAria": "Masquer la clé",
      "aiSettings.keySavedToast": "Clé enregistrée dans votre navigateur",
      "aiSettings.keyRemovedToast": "Clé supprimée",
      "aiSettings.keyDuplicateToast": "Cette clé est déjà enregistrée",
      "aiSettings.keyEmptyToast": "Saisissez une clé avant de l'ajouter",

      "external.copiedToast": "Question copiée — collez-la dans le chat qui s'ouvre",
      "external.questionIntro": "Voici des résultats de recherche dans le Talmud de Babylone. Qu'est-ce qui les relie ?",
      "external.googleAiMode": "Mode IA de Google",

      "error.title": "Erreur",
      "error.generic": "La recherche a échoué",
      "error.code.empty": "Saisissez un mot, un nom ou une expression à rechercher",
      "error.code.too_many": "Vous pouvez rechercher jusqu'à 5 termes à la fois",
      "error.code.invalid_query": "Saisissez un texte en lettres hébraïques",

      "footer.attributionHtml":
        "Texte du Talmud : <strong>édition de Vilna</strong> — provenant de " +
        "<a href=\"https://github.com/Sefaria/Sefaria-Export\" rel=\"noopener noreferrer\" target=\"_blank\">Sefaria</a>, " +
        "domaine public.",
      "footer.summary": "{wordsPhrase}, {tractatesPhrase}.",
      "footer.words": { one: "1 mot", other: "{n} mots" },
      "footer.tractates": { one: "1 traité", other: "{n} traités" },
      "footer.note": "Cette recherche vérifie les correspondances exactes, les correspondances avec une lettre de liaison, et les expressions consécutives — sans analyse grammaticale complète.",
      "footer.credit": "Créé par",
    },
  };

  // A fixed, always-Hebrew example shown inside the search placeholder and
  // the example chips in every locale -- the field itself only ever accepts
  // Hebrew/Aramaic text.
  var PLACEHOLDER_EXAMPLE = "אביי, רבא";

  var LOCALES = ["he", "en", "fr"];
  var DEFAULT_LOCALE = "he";

  // Locale used for Intl.NumberFormat-style grouping (footer counts, result
  // totals). Hebrew UI keeps Hebrew-Indic grouping via he-IL.
  var NUMBER_LOCALE = { he: "he-IL", en: "en-US", fr: "fr-FR" };

  function isSupported(locale) {
    return LOCALES.indexOf(locale) !== -1;
  }

  /* Fill {token} placeholders in a template string from a vars object. */
  function interpolate(template, vars) {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match;
    });
  }

  /*
   * t(locale, key, vars) — plain string lookup with interpolation.
   * Falls back to Hebrew, then to the key itself, so a missing translation
   * never renders as literal "undefined" in the UI.
   */
  function t(locale, key, vars) {
    var table = STRINGS[locale] || STRINGS[DEFAULT_LOCALE];
    var template = table[key];
    if (template == null) template = STRINGS[DEFAULT_LOCALE][key];
    if (template == null) return key;
    if (typeof template !== "string") return key; // a plural table, not a plain string
    return interpolate(template, vars);
  }

  /*
   * plural(locale, key, n) — picks "one"/"two"/"other" from a plural table
   * and interpolates {n} with locale-appropriate digit grouping. Hebrew has
   * a dedicated dual form (two results are "שתי תוצאות" rather than
   * "2 תוצאות"); English and French only distinguish one/other.
   */
  function plural(locale, key, n) {
    var table = (STRINGS[locale] || STRINGS[DEFAULT_LOCALE])[key];
    if (!table) return String(n);
    var form = n === 1 ? "one" : (n === 2 && table.two) ? "two" : "other";
    var template = table[form] || table.other;
    return interpolate(template, { n: formatNumber(locale, n) });
  }

  function formatNumber(locale, n) {
    try {
      return n.toLocaleString(NUMBER_LOCALE[locale] || NUMBER_LOCALE[DEFAULT_LOCALE]);
    } catch (err) {
      return String(n);
    }
  }

  return {
    LOCALES: LOCALES,
    DEFAULT_LOCALE: DEFAULT_LOCALE,
    PLACEHOLDER_EXAMPLE: PLACEHOLDER_EXAMPLE,
    isSupported: isSupported,
    t: t,
    plural: plural,
    formatNumber: formatNumber,
  };
})();
