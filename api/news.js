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
  const lang = req.query.lang || "en"; // 'en' (default) or 'ar'

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
        "labor reforms",
        "labor policies",
      ].join(" OR ") +
      ")",

    empowerment:
      "(" +
      [
        "Saudi society",
        "saudi community",
        "saudi social development",
        "social empowerment",
        "empowering individuals",
        "empowering communities",
        "empowering citizens",
        "self reliance",
        "self-reliance",
        "economic empowerment",
        "community programs",
        "social programs",
        "HRSD programs",
        "quality of life",
        "social cohesion",
        "social inclusion",
      ].join(" OR ") +
      ")",

    "non-profit":
      "(" +
      [
        "non-profit sector",
        "nonprofit sector",
        "third sector",
        "saudi non-profit",
        "saudi nonprofit",
        "saudi charity",
        "charitable organizations in Saudi",
        "charity organizations",
        "volunteer work",
        "volunteering",
        "voluntary sector",
        "foundations",
        "endowments",
        "waqf",
        "social impact",
        "corporate social responsibility",
        "CSR programs",
      ].join(" OR ") +
      ")",

    "strategic-partnerships":
      "(" +
      [
        "strategic partnerships",
        "strategic partnership",
        "saudi strategic partnerships",
        "national partnerships",
        "international partnerships",
        "partnership agreements",
        "cooperation agreements",
        "memorandums of understanding",
        "MOUs",
        "public private partnership",
        "PPP",
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
        "الوظائف",
        "فرص",
        "فرص العمل",
        "التوظيف",
        "البطالة",
        "توطين",
        "السعودة",
        "بيئة",
        "بيئة العمل",
        "سلامة",
        "مهنية",
        "تمكين",
        "الشباب",
        "السعوديين",
        "جودة",
        "الحياة",

        // key phrases
        '"سوق العمل"',
        '"سوق العمل السعودي"',
        '"توطين الوظائف"',
        '"بيئة عمل جاذبة"',
        '"بيئة عمل آمنة"',
        '"سلامة مهنية"',
        '"ممارسات عمل"',
        '"تمكين السعوديين"',
        '"تمكين الشباب"',
        '"جودة الحياة"',
        '"نوعية الحياة"',
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
        '"تمكين الأفراد"',
        '"تمكين الفرد"',
        '"تمكين المجتمع"',
        '"تمكين المجتمعات"',
        '"تمكين الأسر"',
        '"التنمية الاجتماعية"',
        '"برامج تمكين"',
        '"برامج مجتمعية"',
        '"برامج التنمية الاجتماعية"',
        '"تعزيز الاعتماد على الذات"',
        '"الاعتماد على الذات"',
        '"الدعم الاجتماعي"',
        '"برامج الدعم"',
        '"جودة الحياة"',
        '"رفاه المجتمع"',
        '"المسؤولية المجتمعية"',
      ].join(" OR ") +
      ")",

    // Enabling the Non-Profit Sector
    "non-profit":
      "(" +
      [
        // base tokens
        "القطاع",
        "غير الربحي",
        "الخيري",
        "الجمعيات",
        "الجمعيات الخيرية",
        "جمعيات",
        "جمعيات أهلية",
        "منظمات",
        "منظمات غير ربحية",
        "مؤسسات",
        "مؤسسات خيرية",
        "العمل الخيري",
        "العمل التطوعي",
        "تطوع",
        "متطوعين",
        "مبادرات",
        "مبادرات تطوعية",
        "الأثر",
        "الأثر الاجتماعي",
        "المسؤولية الاجتماعية",
        "استدامة",
        "استدامة مالية",
        "تنمية الموارد",

        // phrases
        '"القطاع غير الربحي"',
        '"القطاع الثالث"',
        '"القطاع الخيري"',
        '"المنظمات غير الربحية"',
        '"المنظمات الأهلية"',
        '"الجمعيات الخيرية"',
        '"جمعيات أهلية"',
        '"مؤسسات خيرية"',
        '"العمل الخيري"',
        '"العمل التطوعي"',
        '"مبادرات تطوعية"',
        '"تمكين القطاع غير الربحي"',
        '"حوكمة القطاع غير الربحي"',
        '"الأثر الاجتماعي"',
        '"المسؤولية الاجتماعية"',
        '"استدامة مالية"',
        '"تنمية الموارد"',
      ].join(" OR ") +
      ")",

    // Strategic Partnerships
    "strategic-partnerships":
      "(" +
      [
        // base tokens
        "شراكات",
        "شراكة",
        "استراتيجية",
        "وطنية",
        "دولية",
        "مستدامة",
        "فاعلة",
        "اتفاقيات",
        "اتفاقية",
        "تعاون",
        "مذكرات",
        "مذكرة تفاهم",
        "مذكرات تفاهم",
        "تحالفات",
        "تعاون دولي",
        "القطاع الخاص",
        "القطاع العام",
        "القطاعين العام والخاص",
        "القطاع غير الربحي",

        // phrases
        '"شراكات استراتيجية"',
        '"شراكة استراتيجية"',
        '"شراكات وطنية"',
        '"شراكات دولية"',
        '"شراكات مستدامة"',
        '"شراكات فاعلة"',
        '"اتفاقيات تعاون"',
        '"اتفاقية تعاون"',
        '"اتفاقيات شراكة"',
        '"مذكرة تفاهم"',
        '"مذكرات تفاهم"',
        '"تعاون مشترك"',
        '"شراكات القطاعين العام والخاص"',
        '"شراكات مع القطاع الخاص"',
        '"شراكات مع القطاع غير الربحي"',
        '"تحالفات"',
        '"تعاون دولي"',
      ].join(" OR ") +
      ")",
  };

  // Pick keyword set based on lang
  let keywords =
    lang === "ar" ? TOPIC_KEYWORDS_AR[topic] : TOPIC_KEYWORDS_EN[topic];

  if (!keywords) {
    res.status(400).json({ error: "Unknown topic" });
    return;
  }

  // --- 3) ACCOUNTS ---
  // English mode: 3 English news accounts
  // Arabic mode: sabqorg + SaudiNews50 + aawsat_News
  let ACCOUNTS =
    lang === "ar"
      ? ["sabqorg", "SaudiNews50", "aawsat_News"]
      : ["AlArabiya_Eng", "arabnews", "alekhbariyaEN"];

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
    // Special rule: for aawsat_News in Arabic, always require "السعودية"
    const accountKeywords =
      useArabic && account === "aawsat_News"
        ? `(السعودية) AND ${keywords}`
        : keywords;

    const url = buildTwitterSearchUrl(account, accountKeywords);
    console.log("[TWITTER FETCH]", { topic, lang, account, url });

    try {
      const resp = await fetch(url, {
        headers: { "X-API-Key": process.env.TWITTER_API_KEY },
      });

      console.log("[TWITTER STATUS]", { account, status: resp.status });

      if (!resp.ok) {
        console.error(`Upstream error for ${account}:`, resp.status);
        return [];
      }

      const json = await resp.json();
      const tweets = Array.isArray(json.tweets) ? json.tweets : [];
      console.log("[TWITTER RESULT]", {
        account,
        topic,
        lang,
        tweetCount: tweets.length,
      });
      return tweets;
    } catch (err) {
      console.error(`Error fetching tweets for ${account}:`, err);
      return [];
    }
  }

  try {
    const allResults = await Promise.all(ACCOUNTS.map(fetchForAccount));
    const allTweets = allResults.flat();

    // --- 6) Hard filtering: only main/original tweets from allowed accounts ---
    const filtered = allTweets.filter((t) => {
      const author = t?.author || {};
      const userName =
        author.userName || author.username || author.screen_name;

      if (!userName) return false;

      // ensure author is one of our configured accounts
      if (!ALLOWED_USERNAMES.has(userName.toLowerCase())) return false;

      // must be a main/original tweet, not reply/retweet/quote
      const isReply =
        t.isReply === true || t.inReplyToId || t.inReplyToUserId;
      const hasQuoted = !!t.quoted_tweet;
      const hasRetweeted = !!t.retweeted_tweet;

      if (isReply || hasQuoted || hasRetweeted) return false;

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
