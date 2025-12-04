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

  // --- 1) ENGLISH KEYWORDS PER TOPIC (3 English accounts) ---
  const TOPIC_KEYWORDS_EN = {
    "labor-market":
      "(" +
      [
        "Saudi labor",
        "Saudi labour",
        "labor market",
        "labour market",
        "Saudi jobs",
        "employment",
        "workforce",
        "Saudi workforce",
        "job opportunities in Saudi",
        "unemployment",
        "Saudization",
        "localization of jobs",
        "HRSD labor market",
        "work environment",
        "decent work",
        "quality of work",

        // HRSD + initiatives
        "HRSD initiatives",
        "Ministry of Human Resources and Social Development",
        "human resources and social development",
        "Saudi Ministry of Labor",
        "Saudi Ministry of Labour",

        // supporting phrases
        "empower Saudi nationals",
        "support Saudi workers",
        "safe work environment",
        "inclusive employment",
        "flexible work",
        "remote work",
        "remote jobs",
        "part-time jobs",
        "skills development",
        "upskilling",
        "reskilling",
        "job mobility",
        "labor regulations",
        "employment regulations",
        "workplace reforms",
        "labor reform",
        "wage protection",
        "occupational safety",
        "occupational health and safety",
        "work injuries",
        "occupational risks",
        "workplace inspection",
        "labor inspection",

        // Vision 2030 + labor
        "Vision 2030 employment",
        "Vision 2030 labor market",
        "national transformation labor",
      ].join(" OR ") +
      ")",

    empowerment:
      "(" +
      [
        "empowering society",
        "empowering individuals",
        "empowering citizens",
        "empowering Saudis",
        "empowering women",
        "women's empowerment",
        "youth empowerment",
        "social development",
        "community development",
        "social programs",
        "social protection",
        "social safety net",
        "family support",
        "support for families",
        "support for persons with disabilities",
        "volunteering",
        "volunteer work",
        "civil society",
        "non-profit initiatives",
        "community initiatives",
        "social responsibility",
        "corporate social responsibility",
        "quality of life",
        "quality of life programs",
        "social cohesion",
        "social inclusion",
        "inclusion",
        "marginalized groups",
        "vulnerable groups",
        "support vulnerable groups",
        "digital inclusion",
        "digital literacy",
        "financial literacy",
        "self-reliance",
        "entrepreneurship support",
        "small business support",
        "social entrepreneurship",
      ].join(" OR ") +
      ")",

    "non-profit":
      "(" +
      [
        "non-profit sector",
        "nonprofit sector",
        "non profit sector",
        "charitable sector",
        "charity sector",
        "third sector",
        "civil society organizations",
        "non-governmental organizations",
        "NGOs in Saudi",
        "Saudi NGOs",
        "charitable organizations",
        "charities in Saudi",
        "philanthropy in Saudi",
        "philanthropic initiatives",
        "endowments",
        "waqf",
        "social investment",
        "impact investment",
        "social impact",
        "non-profit governance",
        "non-profit regulations",
        "non-profit development",
        "non-profit empowerment",
        "supporting the non-profit sector",
        "capacity building for non-profits",
        "non-profit sustainability",
        "volunteer organizations",
        "volunteerism in Saudi",
      ].join(" OR ") +
      ")",

    governance:
      "(" +
      [
        "governance",
        "good governance",
        "institutional governance",
        "corporate governance",
        "transparency",
        "accountability",
        "anti-corruption",
        "compliance",
        "risk management",
        "internal controls",
        "performance measurement",
        "organizational excellence",
        "quality management",
        "ISO certification",
        "institutional development",
        "organizational development",
        "policies and procedures",
        "digital governance",
        "e-governance",
        "data governance",
        "AI governance",

        "strategic planning",
        "strategic initiatives",
        "KPIs",
        "key performance indicators",
        "results-based management",

        "Vision 2030 governance",
        "government transformation",
        "institutional transformation",
      ].join(" OR ") +
      ")",

    "labor-resilience":
      "(" +
      [
        "labor market resilience",
        "resilient labor market",
        "employment resilience",
        "job security",
        "income security",
        "social protection",
        "social safety net",
        "unemployment insurance",
        "wage protection system",
        "crisis response",
        "COVID-19 labor measures",
        "labor market shocks",
        "economic shocks",
        "support for workers in crises",
        "remote work readiness",
        "future of work",
        "automation and jobs",
        "skills of the future",
        "skills mismatch",
        "labor market data",
        "labor market observatories",
        "labor market indicators",
      ].join(" OR ") +
      ")",

    "labor-governance":
      "(" +
      [
        "labor market governance",
        "labor regulations",
        "employment regulations",
        "labor laws",
        "occupational safety and health",
        "OSH governance",
        "work inspection",
        "labor inspection",
        "wage governance",
        "compliance with labor law",
        "labor disputes",
        "labor courts",
        "worker rights",
        "employer obligations",
        "governance of employment programs",
        "governance of social programs",
      ].join(" OR ") +
      ")",

    "private-sector":
      "(" +
      [
        "private sector development",
        "private sector partnerships",
        "public-private partnership",
        "PPP",
        "SME support",
        "support for small and medium enterprises",
        "entrepreneurship support",
        "business environment",
        "investment climate",
        "ease of doing business",
        "private sector jobs",
        "job creation in private sector",
        "labor productivity",
        "workforce productivity",
        "human capital development",
      ].join(" OR ") +
      ")",

    "civil-society":
      "(" +
      [
        "civil society",
        "civil society organizations",
        "CSOs",
        "NGOs",
        "community-based organizations",
        "volunteer groups",
        "social movements",
        "citizen engagement",
        "public participation",
        "social dialogue",
        "tripartite dialogue",
        "workers' organizations",
        "employers' organizations",
      ].join(" OR ") +
      ")",

    "quality-of-life":
      "(" +
      [
        "quality of life",
        "wellbeing",
        "well-being",
        "mental health",
        "health and safety",
        "safe communities",
        "green spaces",
        "public spaces",
        "cultural activities",
        "sports and recreation",
        "leisure activities",
        "arts and culture",
        "entertainment sector",
        "tourism development",
      ].join(" OR ") +
      ")",

    "labor-safety":
      "(" +
      [
        "occupational safety",
        "occupational health and safety",
        "OSH",
        "work-related injuries",
        "work accidents",
        "workplace safety",
        "safety regulations",
        "health and safety standards",
        "risk assessment",
        "safety training",
      ].join(" OR ") +
      ")",

    "skills-development":
      "(" +
      [
        "skills development",
        "upskilling",
        "reskilling",
        "lifelong learning",
        "vocational training",
        "TVET",
        "technical and vocational education and training",
        "apprenticeships",
        "on-the-job training",
        "digital skills",
        "future skills",
        "STEM skills",
      ].join(" OR ") +
      ")",

    "nonprofit-partnerships":
      "(" +
      [
        "partnerships with non-profit sector",
        "collaboration with NGOs",
        "public-nonprofit partnership",
        "corporate social responsibility",
        "CSR initiatives",
        "joint initiatives",
        "partnerships with non-profit sector",
        "partnerships with private sector",
      ].join(" OR ") +
      ")",
  };

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

  // --- Pick keyword set based on lang ---
  // Pick keyword set based on lang
  let keywords =
    lang === "ar" ? TOPIC_KEYWORDS_AR[topic] : TOPIC_KEYWORDS_EN[topic];
  
  // If topic not found in the map, gracefully fall back to labor-market
  if (!keywords) {
    console.warn("[NEWS BACKEND] Unknown topic, falling back to labor-market:", {
      topic,
      lang,
    });
    keywords =
      lang === "ar"
        ? TOPIC_KEYWORDS_AR["labor-market"]
        : TOPIC_KEYWORDS_EN["labor-market"];
  }


  // --- 3) ACCOUNTS (this is the critical part) ---
  // English mode: 3 English news accounts
  // Arabic mode: sabqorg + SaudiNews50 + aawsat_News (with السعودية enforced)
  let ACCOUNTS =
    lang === "ar"
      ? ["sabqorg", "SaudiNews50", "aawsat_News"]
      : ["AlArabiya_Eng", "arabnews", "alekhbariyaEN"];

  console.log(
    "🔎 /api/news → topic:",
    topic,
    "lang:",
    lang,
    "ACCOUNTS:",
    ACCOUNTS
  );

  const ALLOWED_USERNAMES = new Set(
    ACCOUNTS.map((u) => u.toLowerCase()) // lowercase for safety
  );

  const useArabic = lang === "ar";

  // --- 4) Build TwitterAPI.io URL for one account ---
  function buildTwitterSearchUrl(account, keywordsForQuery) {
    const baseUrl =
      "https://api.twitterapi.io/twitter/tweet/advanced_search";

    const fromPart = useArabic
      ? `from:${account} lang:ar`
      : `from:${account}`;

    // Only original tweets (no replies/retweets/quotes)
    const query = `(${fromPart}) AND ${keywordsForQuery} -is:reply -is:retweet -is:quote`;

    const params = new URLSearchParams({
      query,
      queryType: "Latest",
      limit: "50",
    });

    return `${baseUrl}?${params.toString()}`;
  }

  

  // --- 5) Fetch for each account in parallel ---
  async function fetchForAccount(account) {
    // For aawsat_News in Arabic, always require "السعودية"
    let accountKeywords = keywords;
    if (lang === "ar" && account === "aawsat_News") {
      accountKeywords = `(${keywords}) AND "السعودية"`;
    }

    const url = buildTwitterSearchUrl(account, accountKeywords);
    console.log("🔍 Query for", account, ":", url);

    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_API_KEY}`,
      },
    });

    if (!resp.ok) {
      console.error(
        "❌ TwitterAPI.io error for",
        account,
        resp.status,
        await resp.text()
      );
      return [];
    }

    const json = await resp.json();
    const data = Array.isArray(json?.data) ? json.data : [];

    // Attach username + createdAt normalizations here if needed later
    return data;
  }

  try {
    // Fetch for all accounts in parallel
    const results = await Promise.all(ACCOUNTS.map((acc) => fetchForAccount(acc)));
    let all = [];
    results.forEach((arr) => {
      if (Array.isArray(arr)) all.push(...arr);
    });

    // --- 6) Filter by allowed usernames + sanity checks ---
    const filtered = all.filter((tweet) => {
      const author = tweet.author || tweet.user || {};
      const usernameRaw =
        author.userName || author.username || author.screen_name || "";
      const username = usernameRaw.toLowerCase();

      if (!ALLOWED_USERNAMES.has(username)) return false;
      if (!tweet.text && !tweet.full_text) return false;

      return true;
    });

    // --- 7) De-duplicate by tweet id ---
    const byId = new Map();
    for (const t of filtered) {
      const id = t.id || t.tweet_id || t.tweetId;
      if (!id) continue;
      if (!byId.has(id)) byId.set(id, t);
    }
    const deduped = Array.from(byId.values());

    // --- 8) Sort by createdAt (newest first) ---
    deduped.sort((a, b) => {
      const aDate = new Date(a.createdAt || a.created_at || 0).getTime();
      const bDate = new Date(b.createdAt || b.created_at || 0).getTime();
      return bDate - aDate;
    });

    // --- 9) Return response ---
    res.status(200).json({
      tweets: deduped,
      has_next_page: false,
      next_cursor: null,
      topic,
      lang,
      sources: ACCOUNTS,
    });
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Failed to fetch tweets" });
  }
}
