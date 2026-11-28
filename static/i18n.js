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
      "meta.description": "חיפוש ולימוד בכל הש״ס: מילים, ביטויים ומשפטים עם הקשר מתכוונן, וקריאת הדף עם רש״י.",
      "doc.title": "ש״ס רדאר — חיפוש ולימוד",

      "header.title": "ש״ס רדאר",
      // A literal newline: .subtitle renders it with white-space: pre-line
      // to force the break here rather than wherever the viewport happens
      // to wrap the text.
      "header.subtitle": "חיפוש ולימוד בכל הש״ס\nמילים, ביטויים ומשפטים — עם הקשר",

      "settings.button": "הגדרות",
      "settings.heading": "הגדרות",
      "settings.close": "סגירה",
      "settings.languageHeading": "שפה",
      "settings.linksHeading": "קישורים",

      "search.label": "מילה בודדת, מילים ברצף או מופרדות בפסיק",
      "search.placeholder": "לדוגמה: {example}",
      "search.button": "חיפוש",
      "search.clearAriaLabel": "ניקוי החיפוש",

      "stepper.before": "מילים לפני",
      "stepper.after": "מילים אחרי",
      "stepper.less": "פחות",
      "stepper.more": "יותר",

      "tractate.label": "מסכת (אופציונלי)",
      "tractate.all": "כל הש״ס",
      "tractate.allInBook": "כל המסכתות",
      "book.label": "ספר",

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
      "commentary.show": "רש״י על העמוד",
      "commentary.loading": "טוען…",
      "commentary.none": "אין רש״י על העמוד הזה",
      "commentary.error": "לא ניתן לטעון את רש״י — נסו שוב",
      "commentary.credit": "רש״י מתוך ספריא · רישיון {license}",
      "view.ariaLabel": "תצוגה",
      "view.search": "חיפוש",
      "view.read": "לימוד",
      "view.dafyomi": "דף יומי",
      "dafyomi.prev": "החודש הקודם",
      "dafyomi.today": "החודש",
      "dafyomi.next": "החודש הבא",
      "dafyomi.error": "לא ניתן לטעון את הדף היומי",
      "dafyomi.notInBavli": "אינו בבבלי כאן",
      "reader.tractate": "מסכת",
      "reader.daf": "דף",
      "reader.amud": "צד הדף",
      "reader.amud.a": "א",
      "reader.amud.b": "ב",
      "reader.rashi": "רש״י",
      "reader.previous": "העמוד הקודם",
      "reader.next": "העמוד הבא",
      "reader.openInReader": "פתיחה בלימוד",
      "reader.view": "תצוגה",
      "reader.rashiCount": "רש״י ({n})",
      "reader.commentaries": "פירושים",
      "reader.save": "שמירה",
      "reader.saved": "נשמר ✓",
      "reader.saveFailed": "השמירה נכשלה",
      "reader.download": "הורדה",
      "reader.downloadFailed": "ההורדה נכשלה",
      "reader.savedList": "שמורים",
      "reader.savedHeading": "שמורים",
      "reader.recentHeading": "נקראו לאחרונה",
      "reader.recentSearchesHeading": "חיפושים אחרונים",
      "reader.savedEmpty": "עוד לא נשמר כלום",
      "reader.savedCopy": "עותק שמור במכשיר",
      "reader.kavanuDone": "סיימתי · חזרה לאז קבענו",
      "reader.done": "סימון כנלמד",
      "reader.doneMarked": "נלמד ✓",
      "reader.delete": "מחיקה",
      "reader.steinsaltz": "שטיינזלץ",
      "reader.pageNote": "{name} — על העמוד כולו",
      "reader.pageNoteWhy": "הפירוש הזה לא מחולק לפי הפסקאות של הגמרא, ולכן הוא מוצג כאן כולו, בראש העמוד",
      "reader.pageViewOnlyPrinted": "בצורת הדף מוצגים רק רש״י ותוספות",
      "commentary.none.steinsaltz": "אין שטיינזלץ על העמוד הזה",
      "commentary.error.steinsaltz": "לא ניתן לטעון את שטיינזלץ — נסו שוב",
      "commentary.credit.steinsaltz": "ביאור שטיינזלץ, מהדורת וויליאם דוידסון (קורן), מתוך ספריא · רישיון {license}",
      "reader.tosafot": "תוספות",
      "commentary.none.tosafot": "אין תוספות על העמוד הזה",
      "commentary.error.tosafot": "לא ניתן לטעון את התוספות — נסו שוב",
      "commentary.credit.tosafot": "תוספות, מהדורת וילנא (סנהדרין: ויקיטקסט), מתוך ספריא · רישיון {license}",
      "reader.rotateHint": "אפשר לסובב את הטלפון לרוחב, או לגלול הצידה כדי לראות את הפירושים",
      "reader.view.vocalized": "עם ניקוד",
      "reader.view.page": "צורת הדף",
      "reader.view.print": "הדפוס המקורי (PDF)",
      "reader.error": "לא ניתן לטעון את העמוד — נסו שוב",
      "reader.credit": "הנוסח מתוך ספריא · רישיון {license}",
      "error.code.unknown_tractate": "המסכת המבוקשת אינה קיימת",
      "error.code.not_paged": "הספר אינו ממוספר לפי דפים",
      "error.code.page_not_found": "אין טקסט בעמוד הזה",
      "matchKind.exact": "התאמה מדויקת",
      "matchKind.withPrefix": "עם אות שימוש",
      "matchKind.exactTag": "{n} מדויק",
      "matchKind.withPrefixTag": "{n} עם אות שימוש",
      "openInSefaria": "ספריא ↗",

      "copy.button": "העתקה",
      "copy.done": "✓ הועתק",
      "copy.toastCopied": "הציטוט הועתק",
      "copy.toastFailed": "ההעתקה נכשלה",
      "share.button": "שיתוף",

      "more.button": "הצג עוד {n}",
      "more.loading": "טוען…",
      "more.error": "שגיאה בטעינה — נסו שוב",

      "connections.button": "מצא קשר בין התוצאות עם AI",
      "connections.answerLabel": "תשובת ה-AI:",
      "connections.loading": "מחפש קשר…",
      "connections.settingsLink": "⚙ הגדרות AI",
      "connections.orExternal": "או שאלו AI חיצוני ↗",
      "connections.error.generic": "לא ניתן היה למצוא קשר כרגע",
      "connections.error.code.no_credential": "אין מפתח AI זמין",
      "connections.error.code.own_key_failed": "המפתח שהגדרתם לא עבד — בדקו אותו בהגדרות ה-AI.",
      "connections.error.tryOwnKey": "פתחו את הגדרות ה-AI כדי להוסיף מפתח משלכם, או שאלו AI חיצוני:",
      "connections.noProvider.askFavorite": "שאלו את {favorite} ↗",
      "connections.noProvider.otherProvider": "ספק AI אחר?",
      "connections.selectHint": "סמנו לפחות שתי תוצאות כדי למצוא קשר ביניהן",
      "connections.selectHintOneMore": "סמנו עוד תוצאה אחת לפחות",
      "connections.selectedCount": { one: "תוצאה אחת מסומנת", two: "שתי תוצאות מסומנות", other: "{n} תוצאות מסומנות" },
      "connections.selectForAi": "שלחו ל-AI",
      "connections.selectionCapToast": "אפשר לסמן עד {n} תוצאות בכל פעם",

      "chat.continueButton": "המשיכו לשוחח עם ה-AI",
      "chat.heading": "שיחה עם ה-AI",
      "chat.placeholder": "שאלו שאלת המשך…",
      "chat.send": "שליחה",
      "chat.thinking": "חושב…",
      "chat.error.generic": "לא ניתן היה לשלוח את ההודעה כרגע",

      "aiSettings.openButton": "⚙ הגדרות AI",
      "aiSettings.heading": "הגדרות AI",
      "aiSettings.close": "סגירה",
      "aiSettings.description": "\"מצא קשר בין התוצאות\" נעזר במודל שפה (AI) עם מפתח אישי משלכם — חינמי אצל כמה מהספקים. בלי מפתח אפשר לשאול AI חיצוני (ChatGPT, Claude ועוד) בלחיצה.",
      "aiSettings.trustNote": "מפתח שתוסיפו נשמר רק בדפדפן שלכם (localStorage), והדפדפן שולח אותו ישירות לספק שבחרתם — הוא לא נשלח לשרת של האפליקציה בכלל.",
      "aiSettings.localModels": "מודל מקומי (Ollama) עובד גם כאן — הדפדפן שלכם פונה אליו ישירות. צריך להפעיל את Ollama עם OLLAMA_ORIGINS שמתיר את האתר הזה.",

      "external.copiedToast": "השאלה הועתקה — הדביקו אותה בצ'אט שנפתח",
      "external.questionIntro": "הנה תוצאות חיפוש מתוך הש״ס. מה מחבר ביניהן?",
      "external.googleAiMode": "מצב AI של גוגל",

      "error.title": "שגיאה",
      "error.generic": "החיפוש נכשל",
      "error.code.empty": "יש להזין מילה, שם או ביטוי לחיפוש",
      "error.code.too_many": "אפשר לחפש עד 5 מונחים בבת אחת",
      "error.code.invalid_query": "יש להזין טקסט באותיות עבריות",
      "error.code.unknown_book": "הספר המבוקש אינו קיים",
      "footer.attributionHtml":
        "נוסח הש״ס: <strong>מהדורת William Davidson</strong> — מתוך " +
        "<a href=\"https://github.com/Sefaria/Sefaria-Export\" rel=\"noopener noreferrer\" target=\"_blank\">Sefaria</a>, " +
        "CC-BY-NC.",
      "footer.credit": "נבנה על ידי joka-7",
      "footer.attribution.from": "מתוך",
      "footer.link.github": "GitHub",
      "footer.link.site": "אתר",
      "footer.link.repo": "קוד",
      "footer.link.privacy": "פרטיות",
      "footer.link.email": "אימייל",
      "footer.link.feedback": "משוב",
    },

    en: {
      "meta.description": "Search and study the Babylonian Talmud: find words, names, and phrases with adjustable context, and read any page with Rashi.",
      "doc.title": "Shas Radar — Search & Study",

      "header.title": "Shas Radar",
      "header.subtitle": "Search and study all of Shas\nwords, names, and phrases — with context",

      "settings.button": "Settings",
      "settings.heading": "Settings",
      "settings.close": "Close",
      "settings.languageHeading": "Language",
      "settings.linksHeading": "Links",

      "search.label": "Word, name, phrase, or several separated by a comma",
      "search.placeholder": "e.g. {example}",
      "search.button": "Search",
      "search.clearAriaLabel": "Clear search",

      "stepper.before": "Words before",
      "stepper.after": "Words after",
      "stepper.less": "Less",
      "stepper.more": "More",

      "tractate.label": "Tractate (optional)",
      "tractate.all": "All of Shas",
      "tractate.allInBook": "All tractates",
      "book.label": "Book",

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
      "commentary.show": "Rashi on this page",
      "commentary.loading": "Loading…",
      "commentary.none": "No Rashi on this page",
      "commentary.error": "Couldn't load Rashi — try again",
      "commentary.credit": "Rashi from Sefaria · {license} license",
      "view.ariaLabel": "View",
      "view.search": "Search",
      "view.read": "Read",
      "view.dafyomi": "Daf Yomi",
      "dafyomi.prev": "Previous month",
      "dafyomi.today": "This month",
      "dafyomi.next": "Next month",
      "dafyomi.error": "Couldn't load the Daf Yomi",
      "dafyomi.notInBavli": "Not a Bavli page here",
      "reader.tractate": "Tractate",
      "reader.daf": "Daf",
      "reader.amud": "Side of the page",
      "reader.amud.a": "a",
      "reader.amud.b": "b",
      "reader.rashi": "Rashi",
      "reader.previous": "Previous page",
      "reader.next": "Next page",
      "reader.openInReader": "Open in reader",
      "reader.view": "View",
      "reader.rashiCount": "Rashi ({n})",
      "reader.commentaries": "Commentaries",
      "reader.save": "Save",
      "reader.saved": "Saved ✓",
      "reader.saveFailed": "Couldn't save",
      "reader.download": "Download",
      "reader.downloadFailed": "Download failed",
      "reader.savedList": "Saved",
      "reader.savedHeading": "Saved",
      "reader.recentHeading": "Recently read",
      "reader.recentSearchesHeading": "Recent searches",
      "reader.savedEmpty": "Nothing saved yet",
      "reader.savedCopy": "Copy saved on this device",
      "reader.kavanuDone": "Done · back to Az Kavanu",
      "reader.done": "Mark as learned",
      "reader.doneMarked": "Learned ✓",
      "reader.delete": "Delete",
      "reader.steinsaltz": "Steinsaltz",
      "reader.pageNote": "{name} — on the whole page",
      "reader.pageNoteWhy": "This commentary is not divided by the Gemara's paragraphs, so it is shown here in full, at the top of the page",
      "reader.pageViewOnlyPrinted": "The page layout shows only Rashi and Tosafot",
      "commentary.none.steinsaltz": "No Steinsaltz on this page",
      "commentary.error.steinsaltz": "Couldn't load Steinsaltz — try again",
      "commentary.credit.steinsaltz": "Steinsaltz's commentary, William Davidson Edition (Koren), from Sefaria · {license} license",
      "reader.tosafot": "Tosafot",
      "commentary.none.tosafot": "No Tosafot on this page",
      "commentary.error.tosafot": "Couldn't load Tosafot — try again",
      "commentary.credit.tosafot": "Tosafot, Vilna edition (Sanhedrin: Wikisource), from Sefaria · {license} license",
      "reader.rotateHint": "Rotate your phone sideways, or scroll sideways to see the commentaries",
      "reader.view.vocalized": "Vocalized",
      "reader.view.page": "Page layout",
      "reader.view.print": "Original print (PDF)",
      "reader.error": "Couldn't load the page — try again",
      "reader.credit": "Text from Sefaria · {license} license",
      "error.code.unknown_tractate": "That tractate doesn't exist",
      "error.code.not_paged": "That book isn't numbered by page",
      "error.code.page_not_found": "There is no text on this page",
      "matchKind.exact": "Exact match",
      "matchKind.withPrefix": "With attached prefix",
      "matchKind.exactTag": "{n} exact",
      "matchKind.withPrefixTag": "{n} with prefix",
      "openInSefaria": "Sefaria ↗",

      "copy.button": "Copy",
      "copy.done": "✓ Copied",
      "copy.toastCopied": "Quote copied",
      "copy.toastFailed": "Copy failed",
      "share.button": "Share",

      "more.button": "Show {n} more",
      "more.loading": "Loading…",
      "more.error": "Failed to load — try again",

      "connections.button": "Find connections between results with AI",
      "connections.answerLabel": "AI's answer:",
      "connections.loading": "Looking for connections…",
      "connections.settingsLink": "⚙ AI settings",
      "connections.orExternal": "or ask an external AI ↗",
      "connections.error.generic": "Couldn't find a connection right now",
      "connections.error.code.no_credential": "No AI key is available",
      "connections.error.code.own_key_failed": "Your own AI key didn't work — check it in AI settings.",
      "connections.error.tryOwnKey": "Open AI settings to add your own key, or ask an external AI instead:",
      "connections.noProvider.askFavorite": "Ask {favorite} ↗",
      "connections.noProvider.otherProvider": "A different AI?",
      "connections.selectHint": "Check at least 2 results to find a connection between them",
      "connections.selectHintOneMore": "Check at least 1 more result",
      "connections.selectedCount": { one: "1 result selected", other: "{n} results selected" },
      "connections.selectForAi": "Send to AI",
      "connections.selectionCapToast": "You can select up to {n} results at a time",

      "chat.continueButton": "Continue chatting with AI",
      "chat.heading": "Chat with AI",
      "chat.placeholder": "Ask a follow-up question…",
      "chat.send": "Send",
      "chat.thinking": "Thinking…",
      "chat.error.generic": "Couldn't send the message right now",

      "aiSettings.openButton": "⚙ AI settings",
      "aiSettings.heading": "AI settings",
      "aiSettings.close": "Close",
      "aiSettings.description": "\"Find connections between results\" uses a language model (AI) with your own key — free with a few providers. Without a key, you can ask an external AI (ChatGPT, Claude and more) in one click.",
      "aiSettings.trustNote": "A key you add is saved only in your own browser (localStorage), and your browser sends it straight to the provider you picked — it never goes to this app's server at all.",
      "aiSettings.localModels": "A local model (Ollama) works here too — your browser calls it directly. Start Ollama with OLLAMA_ORIGINS allowing this site.",

      "external.copiedToast": "Question copied — paste it into the chat that opens",
      "external.questionIntro": "Here are search results from the Babylonian Talmud. What connects them?",
      "external.googleAiMode": "Google AI Mode",

      "error.title": "Error",
      "error.generic": "Search failed",
      "error.code.empty": "Enter a word, name, or phrase to search",
      "error.code.too_many": "You can search for up to 5 terms at once",
      "error.code.invalid_query": "Enter text using Hebrew letters",
      "error.code.unknown_book": "That book isn't available",
      "footer.attributionHtml":
        "Talmud text: <strong>William Davidson Edition</strong> — from " +
        "<a href=\"https://github.com/Sefaria/Sefaria-Export\" rel=\"noopener noreferrer\" target=\"_blank\">Sefaria</a>, " +
        "CC-BY-NC.",
      "footer.credit": "Built by joka-7",
      "footer.attribution.from": "from",
      "footer.link.github": "GitHub",
      "footer.link.site": "Site",
      "footer.link.repo": "Code",
      "footer.link.privacy": "Privacy",
      "footer.link.email": "Email",
      "footer.link.feedback": "Feedback",
    },

    fr: {
      "meta.description": "Recherchez et étudiez le Talmud de Babylone : mots, noms et expressions avec contexte ajustable, et lecture de chaque page avec Rachi.",
      "doc.title": "Shas Radar — Recherche et étude",

      "header.title": "Shas Radar",
      "header.subtitle": "Recherche et étude dans tout le Chas\nmots, noms et expressions — avec contexte",

      "settings.button": "Paramètres",
      "settings.heading": "Paramètres",
      "settings.close": "Fermer",
      "settings.languageHeading": "Langue",
      "settings.linksHeading": "Liens",

      "search.label": "Mot, nom, expression, ou plusieurs séparés par une virgule",
      "search.placeholder": "par ex. {example}",
      "search.button": "Rechercher",
      "search.clearAriaLabel": "Effacer la recherche",

      "stepper.before": "Mots avant",
      "stepper.after": "Mots après",
      "stepper.less": "Moins",
      "stepper.more": "Plus",

      "tractate.label": "Traité (optionnel)",
      "tractate.all": "Tout le Chas",
      "tractate.allInBook": "Tous les traités",
      "book.label": "Livre",

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
      "commentary.show": "Rachi sur cette page",
      "commentary.loading": "Chargement…",
      "commentary.none": "Pas de Rachi sur cette page",
      "commentary.error": "Impossible de charger Rachi — réessayez",
      "commentary.credit": "Rachi depuis Sefaria · licence {license}",
      "view.ariaLabel": "Affichage",
      "view.search": "Rechercher",
      "view.read": "Lire",
      "view.dafyomi": "Daf Yomi",
      "dafyomi.prev": "Mois précédent",
      "dafyomi.today": "Ce mois-ci",
      "dafyomi.next": "Mois suivant",
      "dafyomi.error": "Impossible de charger le Daf Yomi",
      "dafyomi.notInBavli": "Pas une page du Bavli ici",
      "reader.tractate": "Traité",
      "reader.daf": "Daf",
      "reader.amud": "Face de la page",
      "reader.amud.a": "a",
      "reader.amud.b": "b",
      "reader.rashi": "Rachi",
      "reader.previous": "Page précédente",
      "reader.next": "Page suivante",
      "reader.openInReader": "Ouvrir dans le lecteur",
      "reader.view": "Affichage",
      "reader.rashiCount": "Rachi ({n})",
      "reader.commentaries": "Commentaires",
      "reader.save": "Enregistrer",
      "reader.saved": "Enregistré ✓",
      "reader.saveFailed": "Échec de l'enregistrement",
      "reader.download": "Télécharger",
      "reader.downloadFailed": "Échec du téléchargement",
      "reader.savedList": "Enregistrés",
      "reader.savedHeading": "Enregistrés",
      "reader.recentHeading": "Lues récemment",
      "reader.recentSearchesHeading": "Recherches récentes",
      "reader.savedEmpty": "Rien d'enregistré",
      "reader.savedCopy": "Copie enregistrée sur cet appareil",
      "reader.kavanuDone": "Terminé · retour à Az Kavanu",
      "reader.done": "Marquer comme étudié",
      "reader.doneMarked": "Étudié ✓",
      "reader.delete": "Supprimer",
      "reader.steinsaltz": "Steinsaltz",
      "reader.pageNote": "{name} — sur toute la page",
      "reader.pageNoteWhy": "Ce commentaire n'est pas découpé selon les paragraphes de la Guemara ; il est donc affiché ici en entier, en haut de la page",
      "reader.pageViewOnlyPrinted": "La mise en page ne montre que Rachi et les Tossafot",
      "commentary.none.steinsaltz": "Pas de Steinsaltz sur cette page",
      "commentary.error.steinsaltz": "Impossible de charger Steinsaltz — réessayez",
      "commentary.credit.steinsaltz": "Commentaire de Steinsaltz, édition William Davidson (Koren), depuis Sefaria · licence {license}",
      "reader.tosafot": "Tossafot",
      "commentary.none.tosafot": "Pas de Tossafot sur cette page",
      "commentary.error.tosafot": "Impossible de charger les Tossafot — réessayez",
      "commentary.credit.tosafot": "Tossafot, édition de Vilna (Sanhédrin : Wikisource), depuis Sefaria · licence {license}",
      "reader.rotateHint": "Tournez le téléphone, ou faites défiler sur le côté pour voir les commentaires",
      "reader.view.vocalized": "Vocalisé",
      "reader.view.page": "Mise en page",
      "reader.view.print": "Imprimé original (PDF)",
      "reader.error": "Impossible de charger la page — réessayez",
      "reader.credit": "Texte depuis Sefaria · licence {license}",
      "error.code.unknown_tractate": "Ce traité n'existe pas",
      "error.code.not_paged": "Ce livre n'est pas numéroté par page",
      "error.code.page_not_found": "Il n'y a pas de texte sur cette page",
      "matchKind.exact": "Correspondance exacte",
      "matchKind.withPrefix": "Avec lettre de liaison",
      "matchKind.exactTag": "{n} exact",
      "matchKind.withPrefixTag": "{n} avec préfixe",
      "openInSefaria": "Sefaria ↗",

      "copy.button": "Copier",
      "copy.done": "✓ Copié",
      "copy.toastCopied": "Citation copiée",
      "copy.toastFailed": "Échec de la copie",
      "share.button": "Partager",

      "more.button": "Afficher {n} de plus",
      "more.loading": "Chargement…",
      "more.error": "Échec du chargement — réessayez",

      "connections.button": "Trouver des liens entre les résultats avec l'IA",
      "connections.answerLabel": "Réponse de l'IA :",
      "connections.loading": "Recherche de liens…",
      "connections.settingsLink": "⚙ Paramètres IA",
      "connections.orExternal": "ou demandez à une IA externe ↗",
      "connections.error.generic": "Impossible de trouver un lien pour le moment",
      "connections.error.code.no_credential": "Aucune clé IA n'est disponible",
      "connections.error.code.own_key_failed": "Votre propre clé IA n'a pas fonctionné — vérifiez-la dans les réglages IA.",
      "connections.error.tryOwnKey": "Ouvrez les paramètres IA pour ajouter votre propre clé, ou demandez à une IA externe :",
      "connections.noProvider.askFavorite": "Demandez à {favorite} ↗",
      "connections.noProvider.otherProvider": "Une autre IA ?",
      "connections.selectHint": "Cochez au moins 2 résultats pour trouver un lien entre eux",
      "connections.selectHintOneMore": "Cochez au moins 1 résultat de plus",
      "connections.selectedCount": { one: "1 résultat sélectionné", other: "{n} résultats sélectionnés" },
      "connections.selectForAi": "Envoyer à l'IA",
      "connections.selectionCapToast": "Vous pouvez sélectionner jusqu'à {n} résultats à la fois",

      "chat.continueButton": "Continuer la conversation avec l'IA",
      "chat.heading": "Conversation avec l'IA",
      "chat.placeholder": "Posez une question complémentaire…",
      "chat.send": "Envoyer",
      "chat.thinking": "Réflexion…",
      "chat.error.generic": "Impossible d'envoyer le message pour le moment",

      "aiSettings.openButton": "⚙ Paramètres IA",
      "aiSettings.heading": "Paramètres IA",
      "aiSettings.close": "Fermer",
      "aiSettings.description": "« Trouver des liens entre les résultats » utilise un modèle de langage (IA) avec votre propre clé — gratuite chez plusieurs fournisseurs. Sans clé, vous pouvez interroger une IA externe (ChatGPT, Claude, etc.) en un clic.",
      "aiSettings.trustNote": "Une clé que vous ajoutez n'est enregistrée que dans votre propre navigateur (localStorage), et votre navigateur l'envoie directement au fournisseur choisi — elle n'est jamais envoyée au serveur de cette application.",
      "aiSettings.localModels": "Un modèle local (Ollama) fonctionne aussi ici — votre navigateur l'appelle directement. Lancez Ollama avec OLLAMA_ORIGINS autorisant ce site.",

      "external.copiedToast": "Question copiée — collez-la dans le chat qui s'ouvre",
      "external.questionIntro": "Voici des résultats de recherche dans le Talmud de Babylone. Qu'est-ce qui les relie ?",
      "external.googleAiMode": "Mode IA de Google",

      "error.title": "Erreur",
      "error.generic": "La recherche a échoué",
      "error.code.empty": "Saisissez un mot, un nom ou une expression à rechercher",
      "error.code.too_many": "Vous pouvez rechercher jusqu'à 5 termes à la fois",
      "error.code.invalid_query": "Saisissez un texte en lettres hébraïques",
      "error.code.unknown_book": "Ce livre n'est pas disponible",
      "footer.attributionHtml":
        "Texte du Talmud : <strong>édition William Davidson</strong> — provenant de " +
        "<a href=\"https://github.com/Sefaria/Sefaria-Export\" rel=\"noopener noreferrer\" target=\"_blank\">Sefaria</a>, " +
        "CC-BY-NC.",
      "footer.credit": "Créé par joka-7",
      "footer.attribution.from": "provenant de",
      "footer.link.github": "GitHub",
      "footer.link.site": "Site",
      "footer.link.repo": "Code",
      "footer.link.privacy": "Confidentialité",
      "footer.link.email": "E-mail",
      "footer.link.feedback": "Avis",
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
