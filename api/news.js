please continue the code from where it cut off below:

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
  const langParam = req.query.lang;
  let lang = typeof langParam === "string" ? langParam.toLowerCase() : "en";
  if (lang !== "ar" && lang !== "en") lang = "en";

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

  // --- 2) ARABIC KEYWORDS PER TOPIC (Arabic accounts, broader: tokens + phrases) ---
  const TOPIC_KEYWORDS_AR = {
    // Labor market / Saudization / jobs / work environment
    "labor-market":
      "(" +
      [
        // base tokens (broader matching)
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

        // combined phrases (quoted)
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

    // Empowering Society & Individuals
    empowerment:
      "(" +
      [
        // base tokens
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

        // phrases
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

    // Non-profit / Third sector
    "non-profit":
      "(" +
      [
        // base tokens
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

        // phrases
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

    // Governance quality / transparency / institutional development
    governance:
      "(" +
      [
        // base
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

        // phrases
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

    // Labor resilience / crisis response
    "labor-resilience":
      "(" +
      [
        // base
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

        // phrases
        '"مرونة سوق العمل"',
        '"تعزيز مرونة سوق العمل"',
        '"حماية الوظائف"',
        '"برامج الحماية الاجتماعية"',
        '"دعم المتضررين"',
        '"برامج دعم التوظيف"',
        '"برامج دعم الأجور",
                '"برامج دعم الأجور"',
        '"التعامل مع الأزمات"',
        '"استجابة سوق العمل للأزمات"',
        '"العمل عن بعد أثناء الأزمات"',
        '"العمل المرن أثناء الأزمات"',
        '"إجراءات سوق العمل خلال الجائحة"'
      ].join(" OR ") +
      ")",

    // Labor governance / regulations
    "labor-governance":
      "(" +
      [
        // base
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


        // phrases
        '"حوكمة سوق العمل"',
        '"مراقبة تطبيق نظام العمل"',
        '"التشريعات العمالية"',
        '"القوانين العمالية"',
        '"شروط السلامة المهنية"',
        '"إصابات العمل"'
      ].join(" OR ") +
      ")",

    // Private sector
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


        // phrases
        '"تنمية القطاع الخاص"',
        '"التوظيف في القطاع الخاص"',
        '"ريادة الأعمال"',
        '"بيئة الأعمال في السعودية"'
      ].join(" OR ") +
      ")",

    // Civil society
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


        // phrases
        '"المجتمع المدني"',
        '"المشاركة المجتمعية"',
        '"الحوار المجتمعي"'
      ].join(" OR ") +
      ")",

    // Quality of life
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


        // phrases
        '"جودة الحياة"',
        '"تحسين جودة الحياة"',
        '"الأنشطة الترفيهية"',
        '"الأنشطة الرياضية"'
      ].join(" OR ") +
      ")",

    // Safety / OSH
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


        // phrases
        '"السلامة المهنية"',
        '"الصحة والسلامة المهنية"',
        '"إصابات العمل"',
        '"حوادث العمل"'
      ].join(" OR ") +
      ")",

    // Skills development
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


        // phrases
        '"تطوير المهارات"',
        '"مهارات المستقبل"',
        '"التدريب المهني"'
      ].join(" OR ") +
      ")",

    // Nonprofit partnerships
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


        // phrases
        '"الشراكة المجتمعية"',
        '"الشراكات مع القطاع غير الربحي"',
        '"المسؤولية الاجتماعية"'
      ].join(" OR ") +
      ")",
  };

  // --- 3) SELECT ACCOUNTS (Arabic vs English) ---
  const ACCOUNTS =
    lang === "ar"
      ? ["sabqorg", "SaudiNews50", "aawsat_News"]
      : ["AlArabiya_Eng", "arabnews", "alekhbariyaEN"];

  console.log("🔎 BACKEND FETCH → topic:", topic, "lang:", lang, "accounts:", ACCOUNTS);

  const QUERY = lang === "ar"
    ? TOPIC_KEYWORDS_AR[topic] || TOPIC_KEYWORDS_AR["labor-market"]
    : TOPIC_KEYWORDS_EN[topic] || TOPIC_KEYWORDS_EN["labor-market"];

  // --- 4) BUILD FINAL TWITTER QUERY ---
  function buildQuery(account) {
    const fromPart =
      lang === "ar"
        ? `(from:${account} AND lang:ar)`
        : `(from:${account})`;

    return `${fromPart} AND ${QUERY} -is:retweet -is:reply -is:quote`;
  }

  // --- 5) CALL TWITTER API ---
  const fetch = require("node-fetch");

  async function searchTweets(query) {
    const url =
      "https://api.twitterapi.io/twitter/tweet/advanced_search?query=" +
      encodeURIComponent(query);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.TWITTER_API_KEY}` },
    });

    if (!response.ok) {
      console.log("❌ Twitter API Error:", response.status, await response.text());
      return [];
    }

    const data = await response.json();
    return data?.data ?? [];
  }

  try {
    let allTweets = [];

    for (const acc of ACCOUNTS) {
      const q = buildQuery(acc);
      console.log("🔍 Query Executed:", q);
      const tweets = await searchTweets(q);
      allTweets.push(...tweets);
    }

    // sort newest → oldest
    allTweets.sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    });

    res.status(200).json({
      topic,
      lang,
      accounts: ACCOUNTS,
      count: allTweets.length,
      tweets: allTweets,
    });
  } catch (err) {
    console.error("🔥 Backend Error:", err);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
}

