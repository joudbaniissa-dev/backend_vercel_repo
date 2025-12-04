// api/news.js
export default async function handler(req, res) {
  // Allow CORS for your GitHub Pages origin
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://joudbaniissa-dev.github.io"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // Preflight request
    res.status(200).end();
    return;
  }

  const { topic } = req.query; // e.g. 'labor-market'

  // --- Normalize lang safely ---
  const rawLang = Array.isArray(req.query.lang)
    ? req.query.lang[0]
    : req.query.lang;
  let lang = (rawLang || "en").toLowerCase();
  if (lang !== "ar" && lang !== "en") {
    lang = "en";
  }

  const baseUrl =
    "https://api.twitterapi.io/twitter/tweet/advanced_search";

  // ---------------------------------------------------------------------------
  // 1) ENGLISH: RESTORE SIMPLE PER-TOPIC QUERIES (like twitterSearchConfig)
  // ---------------------------------------------------------------------------

  // These match your frontend twitterSearchConfig exactly
  const EN_TOPIC_SIMPLE_QUERIES = {
    "labor-market":
      "(from:AlArabiya_Eng OR from:arabnews OR from:alekhbariyaEN) AND " +
      "(Saudi labor OR labor market OR Saudi jobs OR employment OR workforce)",

    empowerment:
      "(from:AlArabiya_Eng OR from:arabnews OR from:alekhbariyaEN) AND " +
      "(saudi society OR saudi community OR saudi social development)",

    "non-profit":
      "(from:AlArabiya_Eng OR from:arabnews OR from:alekhbariyaEN) AND " +
      "(saudi donation OR saudi volunteer OR saudi non-profit OR saudi non-profit sector OR saudi charity)",

    "strategic-partnerships":
      "(from:AlArabiya_Eng OR from:arabnews OR from:alekhbariyaEN) AND " +
      "(saudi strategic partnerships OR saudi strategic agreements OR saudi mou OR saudi collaboration)",
  };

  if (lang === "en") {
    // Use the simple query that we KNOW used to work
    let query = EN_TOPIC_SIMPLE_QUERIES[topic];
    if (!query) {
      console.warn(
        "[NEWS BACKEND] Unknown EN topic, falling back to labor-market:",
        { topic }
      );
      query = EN_TOPIC_SIMPLE_QUERIES["labor-market"];
    }

    const params = new URLSearchParams({
      query,
      queryType: "Latest",
      limit: "100",
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log("[EN NEWS FETCH]", { topic, lang, url });

    try {
      const resp = await fetch(url, {
        headers: {
          "X-API-Key": process.env.TWITTER_API_KEY,
        },
      });

      console.log("[EN NEWS STATUS]", { status: resp.status });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        console.error("[EN NEWS UPSTREAM ERROR]", {
          status: resp.status,
          body: text,
        });
        return res.status(200).json({
          tweets: [],
          has_next_page: false,
          next_cursor: null,
          topic,
          lang,
          sources: ["AlArabiya_Eng", "arabnews", "alekhbariyaEN"],
        });
      }

      const json = await resp.json();
      const raw = Array.isArray(json.tweets)
        ? json.tweets
        : Array.isArray(json.data)
        ? json.data
        : [];

      const EN_ALLOWED = new Set([
        "alarabiya_eng",
        "arabnews",
        "alekhbariyaen",
      ]);

      // Filter + dedupe + sort (just like before)
      const filtered = raw.filter((tweet) => {
        const author = tweet.author || tweet.user || {};
        const usernameRaw =
          author.userName || author.username || author.screen_name || "";
        const username = usernameRaw.toLowerCase();
        if (!EN_ALLOWED.has(username)) return false;
        if (!tweet.text && !tweet.full_text) return false;
        return true;
      });

      const byId = new Map();
      for (const t of filtered) {
        const id = t.id || t.tweet_id || t.tweetId;
        if (!id) continue;
        if (!byId.has(id)) byId.set(id, t);
      }
      const deduped = Array.from(byId.values());

      deduped.sort((a, b) => {
        const aDate = new Date(a.createdAt || a.created_at || 0).getTime();
        const bDate = new Date(b.createdAt || b.created_at || 0).getTime();
        return bDate - aDate;
      });

      return res.status(200).json({
        tweets: deduped,
        has_next_page: false,
        next_cursor: null,
        topic,
        lang,
        sources: ["AlArabiya_Eng", "arabnews", "alekhbariyaEN"],
      });
    } catch (err) {
      console.error("[EN NEWS PROXY ERROR]", err);
      return res.status(500).json({
        error: "Failed to fetch EN tweets",
        details: err.message,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 2) ARABIC: KEEP YOUR EXISTING ADVANCED LOGIC
  // ---------------------------------------------------------------------------
  // (copied from your current file, only used for lang === 'ar')
  // :contentReference[oaicite:0]{index=0}

  // --- 2) ARABIC KEYWORDS PER TOPIC ---
  const TOPIC_KEYWORDS_AR = {
    // Labor market
    "labor-market":
      "(" +
      [
        "سوق",
        "العمل",
        "وظائف",
        "التوظيف",
        "القوى العاملة",
        "العاملين",
        "الموظفين",
        "المنشآت",
        "القطاع الخاص",
        "القطاع الحكومي",
        "القطاع العام",
        "القطاع غير الربحي",

        '"سوق العمل"',
        '"فرص العمل"',
        '"فرص وظيفية"',
        '"فرص توظيف"',
        '"الباحثين عن عمل"',
        '"العمل المرن"',
        '"العمل الحر"',
        '"العمل الجزئي"',
        '"العمل عن بعد"',
        '"توطين الوظائف"',
        '"سعودة الوظائف"',
        '"السعودة"',
        '"توطين"',
        '"الموارد البشرية والتنمية الاجتماعية"',
        '"وزارة الموارد البشرية والتنمية الاجتماعية"',
        '"التنمية الاجتماعية"',
        '"بيئة العمل"',
        '"تحسين بيئة العمل"',
        '"جودة بيئة العمل"',
        '"السلامة والصحة المهنية"',
        '"السلامة المهنية"',
        '"الصحة والسلامة في العمل"',
        '"التفتيش العمالي"',
        '"حقوق العاملين"',
        '"حقوق الموظفين"',
        '"حماية الأجور"',
        '"نظام حماية الأجور"',
        '"التدريب والتأهيل"',
        '"رفع كفاءة سوق العمل"',
      ].join(" OR ") +
      ")",

    empowerment:
      "(" +
      [
        "تمكين",
        "الأفراد",
        "الفرد",
        "المجتمع",
        "المجتمعات",
        "الأسر",
        "التنمية",
        "التنمية الاجتماعية",
        "الدعم",
        "الدعم الاجتماعي",
        "برامج",
        "برامج تمكين",
        "برامج مجتمعية",
        "جودة",
        "جودة الحياة",
        "رفاه",
        "رفاه المجتمع",
        "المسؤولية",
        "المسؤولية المجتمعية",

        '"تمكين المجتمع"',
        '"تمكين الأفراد"',
        '"تمكين الشباب"',
        '"تمكين المرأة"',
        '"التمكين الاجتماعي"',
        '"الدعم الاجتماعي"',
        '"برامج جودة الحياة"',
        '"تحسين جودة الحياة"',
        '"دعم الأسر"',
        '"حماية الأسرة"',
        '"حماية الفئات الأكثر احتياجاً"',
        '"الفئات المستفيدة"',
        '"برامج الحماية الاجتماعية"',
        '"برامج الدعم الحكومي"',
        '"برامج التنمية المجتمعية"',
        '"القطاع غير الربحي"',
        '"المسؤولية الاجتماعية للشركات"',
        '"الشراكة المجتمعية"',
      ].join(" OR ") +
      ")",

    "non-profit":
      "(" +
      [
        "القطاع غير الربحي",
        "القطاع الثالث",
        "الجمعيات",
        "المؤسسات الأهلية",
        "المؤسسات غير الربحية",
        "المنظمات غير الربحية",
        "المنظمات غير الحكومية",
        "المنظمات الأهلية",
        "الوقف",
        "الأوقاف",
        "العمل الخيري",
        "الأعمال الخيرية",
        "العمل التطوعي",
        "المتطوعين",
        "المتطوع",
        "التطوع",
        "المسؤولية المجتمعية",
        "المسؤولية الاجتماعية",

        '"القطاع غير الربحي"',
        '"تنمية القطاع غير الربحي"',
        '"تمكين القطاع غير الربحي"',
        '"استدامة القطاع غير الربحي"',
        '"حوكمة القطاع غير الربحي"',
        '"الحوكمة في الجمعيات"',
        '"الحوكمة في المؤسسات الأهلية"',
        '"برامج التطوع"',
        '"منصة التطوع"',
        '"تنظيم العمل التطوعي"',
        '"الإسهام المجتمعي"',
        '"التنمية المجتمعية"',
      ].join(" OR ") +
      ")",

    governance:
      "(" +
      [
        "الحوكمة",
        "الشفافية",
        "المساءلة",
        "الالتزام",
        "الامتثال",
        "إدارة المخاطر",
        "الرقابة الداخلية",
        "التطوير المؤسسي",
        "التطوير التنظيمي",
        "الجودة",
        "إدارة الجودة",
        "التميز المؤسسي",
        "السياسات والإجراءات",
        "التحول الرقمي",
        "التحول المؤسسي",

        '"الحوكمة المؤسسية"',
        '"الحوكمة في القطاع غير الربحي"',
        '"الشفافية والمساءلة"',
        '"إدارة المخاطر المؤسسية"',
        '"تعزيز الامتثال"',
        '"التطوير المؤسسي"',
        '"التطوير التنظيمي"',
        '"التميز المؤسسي"',
        '"التحول المؤسسي"',
        '"التحول الرقمي في الخدمات"',
      ].join(" OR ") +
      ")",

    "labor-resilience":
      "(" +
      [
        "مرونة سوق العمل",
        "المرونة الاقتصادية",
        "المرونة الوظيفية",
        "أمن الوظيفة",
        "أمن الدخل",
        "الحماية الاجتماعية",
        "شبكات الحماية الاجتماعية",
        "التأمين ضد التعطل",
        "صندوق تنمية الموارد البشرية",
        "دعم الباحثين عن عمل",
        "دعم العمالة",

        '"مرونة سوق العمل"',
        '"تعزيز مرونة سوق العمل"',
        '"حماية الوظائف"',
        '"برامج الحماية الاجتماعية"',
        '"دعم المتضررين"',
        '"برامج دعم التوظيف"',
        '"برامج دعم الأجور"',
        '"التعامل مع الأزمات"',
        '"استجابة سوق العمل للأزمات"',
        '"العمل عن بعد أثناء الأزمات"',
        '"العمل المرن أثناء الأزمات"',
        '"إجراءات سوق العمل خلال الجائحة"',
      ].join(" OR ") +
      ")",

    "labor-governance":
      "(" +
      [
        "حوكمة سوق العمل",
        "التشريعات العمالية",
        "القوانين العمالية",
        "نظام العمل",
        "العمل السعودي",
        "الرقابة العمالية",
        "التفتيش العمالي",
        "فض المنازعات العمالية",
        "حقوق العامل",
        "حقوق الموظف",
        "شروط العمل",
        "عقود العمل",

        '"حوكمة سوق العمل"',
        '"مراقبة تطبيق نظام العمل"',
        '"التشريعات العمالية"',
        '"القوانين العمالية"',
        '"شروط السلامة المهنية"',
        '"إصابات العمل"',
      ].join(" OR ") +
      ")",

    "private-sector":
      "(" +
      [
        "القطاع الخاص",
        "المنشآت",
        "الشركات",
        "الاستثمار",
        "بيئة الأعمال",
        "التوظيف في القطاع الخاص",
        "الوظائف في القطاع الخاص",
        "تنمية القطاع الخاص",
        "المشاريع الصغيرة",
        "ريادة الأعمال",

        '"تنمية القطاع الخاص"',
        '"التوظيف في القطاع الخاص"',
        '"ريادة الأعمال"',
        '"بيئة الأعمال في السعودية"',
      ].join(" OR ") +
      ")",

    "civil-society":
      "(" +
      [
        "المجتمع المدني",
        "المنظمات الأهلية",
        "الجمعيات",
        "المبادرات المجتمعية",
        "التطوع",
        "المتطوعين",
        "المشاركة المجتمعية",
        "الحوار المجتمعي",
        "المنظمات غير الحكومية",

        '"المجتمع المدني"',
        '"المشاركة المجتمعية"',
        '"الحوار المجتمعي"',
      ].join(" OR ") +
      ")",

    "quality-of-life":
      "(" +
      [
        "جودة الحياة",
        "رفاهية",
        "الصحة النفسية",
        "الصحة",
        "السلامة",
        "الرياضة",
        "الأنشطة الرياضية",
        "الأنشطة الترفيهية",
        "الترفيه",
        "المساحات العامة",
        "المساحات الخضراء",
        "الحدائق",
        "الثقافة",
        "الأنشطة الثقافية",
        "الفعاليات",

        '"جودة الحياة"',
        '"تحسين جودة الحياة"',
        '"الأنشطة الترفيهية"',
        '"الأنشطة الرياضية"',
      ].join(" OR ") +
      ")",

    "labor-safety":
      "(" +
      [
        "السلامة المهنية",
        "الصحة المهنية",
        "الصحة والسلامة",
        "إصابات العمل",
        "الحوادث العمالية",
        "بيئة العمل الآمنة",
        "الوقاية من المخاطر",
        "إدارة المخاطر المهنية",

        '"السلامة المهنية"',
        '"الصحة والسلامة المهنية"',
        '"إصابات العمل"',
        '"حوادث العمل"',
      ].join(" OR ") +
      ")",

    "skills-development":
      "(" +
      [
        "المهارات",
        "تطوير المهارات",
        "رفع المهارات",
        "إعادة التأهيل",
        "التدريب",
        "برامج التدريب",
        "مهارات المستقبل",
        "المهارات الرقمية",
        "التعليم المهني",
        "التدريب المهني",

        '"تطوير المهارات"',
        '"مهارات المستقبل"',
        '"التدريب المهني"',
      ].join(" OR ") +
      ")",

    "nonprofit-partnerships":
      "(" +
      [
        "الشراكات",
        "الشراكات المجتمعية",
        "الشراكة مع القطاع غير الربحي",
        "الشراكات غير الربحية",
        "الشراكات مع الجمعيات",
        "المسؤولية الاجتماعية",
        "برامج المسؤولية الاجتماعية",
        "التعاون مع الجمعيات",

        '"الشراكة المجتمعية"',
        '"الشراكات مع القطاع غير الربحي"',
        '"المسؤولية الاجتماعية"',
      ].join(" OR ") +
      ")",
  };

  // Arabic keywords by topic (fallback to labor-market)
  let arKeywords = TOPIC_KEYWORDS_AR[topic];
  if (!arKeywords) {
    console.warn(
      "[NEWS BACKEND] Unknown AR topic, falling back to labor-market:",
      { topic }
    );
    arKeywords = TOPIC_KEYWORDS_AR["labor-market"];
  }

  const ACCOUNTS_AR = ["sabqorg", "SaudiNews50", "aawsat_News"];
  const ALLOWED_USERNAMES_AR = new Set(
    ACCOUNTS_AR.map((u) => u.toLowerCase())
  );

  const useArabic = true;

  function buildTwitterSearchUrlAr(account, keywordsForQuery) {
    const fromPart = `from:${account} lang:ar`;
    const query = `(${fromPart}) AND ${keywordsForQuery} -is:reply -is:retweet -is:quote`;

    const params = new URLSearchParams({
      query,
      queryType: "Latest",
      limit: "50",
    });

    return `${baseUrl}?${params.toString()}`;
  }

  async function fetchForAccountAr(account) {
    // For aawsat_News in Arabic, always require "السعودية"
    const accountKeywords =
      account === "aawsat_News"
        ? `(السعودية) AND ${arKeywords}`
        : arKeywords;

    const url = buildTwitterSearchUrlAr(account, accountKeywords);
    console.log("[AR TWITTER FETCH]", { topic, lang, account, url });

    const resp = await fetch(url, {
      headers: {
        "X-API-Key": process.env.TWITTER_API_KEY,
      },
    });

    console.log("[AR TWITTER STATUS]", { account, status: resp.status });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("[AR TWITTER UPSTREAM ERROR]", {
        account,
        status: resp.status,
        body: text,
      });
      return [];
    }

    const json = await resp.json();
    const tweets = Array.isArray(json.tweets)
      ? json.tweets
      : Array.isArray(json.data)
      ? json.data
      : [];

    console.log("[AR TWITTER RESULT]", {
      account,
      topic,
      lang,
      tweetCount: tweets.length,
    });

    return tweets;
  }

  try {
    const results = await Promise.all(
      ACCOUNTS_AR.map((acc) => fetchForAccountAr(acc))
    );
    let all = [];
    results.forEach((arr) => {
      if (Array.isArray(arr)) all.push(...arr);
    });

    const filtered = all.filter((tweet) => {
      const author = tweet.author || tweet.user || {};
      const usernameRaw =
        author.userName || author.username || author.screen_name || "";
      const username = usernameRaw.toLowerCase();

      if (!ALLOWED_USERNAMES_AR.has(username)) return false;
      if (!tweet.text && !tweet.full_text) return false;

      return true;
    });

    const byId = new Map();
    for (const t of filtered) {
      const id = t.id || t.tweet_id || t.tweetId;
      if (!id) continue;
      if (!byId.has(id)) byId.set(id, t);
    }
    const deduped = Array.from(byId.values());

    deduped.sort((a, b) => {
      const aDate = new Date(a.createdAt || a.created_at || 0).getTime();
      const bDate = new Date(b.createdAt || b.created_at || 0).getTime();
      return bDate - aDate;
    });

    return res.status(200).json({
      tweets: deduped,
      has_next_page: false,
      next_cursor: null,
      topic,
      lang,
      sources: ACCOUNTS_AR,
    });
  } catch (err) {
    console.error("[AR NEWS PROXY ERROR]", err);
    return res.status(500).json({
      error: "Failed to fetch AR tweets",
      details: err.message,
    });
  }
}
