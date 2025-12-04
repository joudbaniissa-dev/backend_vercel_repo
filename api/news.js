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

  // Normalize lang (default 'en')
  let rawLang = Array.isArray(req.query.lang)
    ? req.query.lang[0]
    : req.query.lang;
  let lang = (rawLang || "en").toLowerCase();

  // --- 1) ENGLISH KEYWORDS PER TOPIC (3 English accounts) ---
  // --- 1) SIMPLIFIED ENGLISH KEYWORDS (single words only) ---
  const TOPIC_KEYWORDS_EN = {
    "labor-market": "(" + [
        "labor",
        "labour",
        "job",
        "jobs",
        "employment",
        "workforce",
        "market",
        "hiring",
        "Saudization",
        "localization"
    ].join(" OR ") + ")",
  
    empowerment: "(" + [
        "empower",
        "empowerment",
        "community",
        "communities",
        "society",
        "inclusion",
        "citizens",
        "individuals",
        "programs",
        "support"
    ].join(" OR ") + ")",
  
    "non-profit": "(" + [
        "nonprofit",
        "non-profit",
        "charity",
        "charities",
        "ngo",
        "volunteer",
        "volunteering",
        "foundation",
        "donations",
        "waqf",
        "impact"
    ].join(" OR ") + ")",
  
    "strategic-partnerships": "(" + [
        "partnership",
        "partnerships",
        "agreement",
        "agreements",
        "collaboration",
        "cooperation",
        "mou",
        "initiative",
        "alliances",
        "joint"
    ].join(" OR ") + ")"
  };
  // --- 2) ARABIC KEYWORDS PER TOPIC (Arabic accounts, broader: tokens + phrases) ---
  const TOPIC_KEYWORDS_AR = {
  // ================================================================
  // 1) LABOR MARKET (works already — simplified + expanded)
  // ================================================================
  "labor-market": "(" + [
      "سوق",
      "العمل",
      "وظائف",
      "وظيفة",
      "فرص",
      "التوظيف",
      "بطالة",
      "عاطلين",
      "توطين",
      "السعودة",
      "مهارة",
      "مهارات",
      "موارد",
      "موارد بشرية",
      "عمالة",
      "عاملين",
      "كوادر",
      "الشباب",
      "السعوديين",
      "جاذبة",
      "جاذبية",
      "بيئة",
      "بيئة العمل",
      "سلامة",
      "أجور",
      "رواتب"
  ].join(" OR ") + ")",

  // ================================================================
  // 2) EMPOWERMENT (copy labor-market style: tokens only)
  // ================================================================
  empowerment: "(" + [
      "تمكين",
      "تمكين",
      "تمكين المجتمع",
      "تمكين الأفراد",
      "مجتمع",
      "مجتمعات",
      "مجتمعي",
      "أفراد",
      "الفرد",
      "الأسر",
      "أسرة",
      "عائلة",
      "تنمية",
      "تنمية اجتماعية",
      "اجتماعية",
      "الدعم",
      "دعم",
      "دعم اجتماعي",
      "برامج",
      "برنامج",
      "مبادرات",
      "مبادرة",
      "اندماج",
      "دمج",
      "شمول",
      "شمولية",
      "اعتماد",
      "اعتماد ذاتي",
      "المجتمع السعودي",
      "جودة",
      "جودة الحياة"
  ].join(" OR ") + ")",

  // ================================================================
  // 3) NON-PROFIT SECTOR (broad everyday words)
  // ================================================================
  "non-profit": "(" + [
      "غير",
      "ربحي",
      "غير ربحي",
      "خيري",
      "خيرية",
      "جمعية",
      "جمعيات",
      "مؤسسة",
      "مؤسسات",
      "منظمات",
      "تطوعي",
      "تطوع",
      "متطوعين",
      "متطوع",
      "القطاع الثالث",
      "قطاع",
      "قطاع غير ربحي",
      "تبرعات",
      "توعية",
      "مبادرات",
      "أثر",
      "أثر اجتماعي",
      "مسؤولية",
      "مسؤولية اجتماعية",
      "استدامة",
      "تنمية",
      "تنمية الموارد",
      "وقفيات",
      "وقف",
      "أعمال خيرية"
  ].join(" OR ") + ")",

  // ================================================================
  // 4) STRATEGIC PARTNERSHIPS (match news words: شراكات / اتفاقيات)
  // ================================================================
  "strategic-partnerships": "(" + [
      "شراكة",
      "شراكات",
      "اتفاق",
      "اتفاقية",
      "اتفاقيات",
      "تعاون",
      "تعاون",
      "مذكرة",
      "مذكرة تفاهم",
      "تحالف",
      "تحالفات",
      "مبادرة مشتركة",
      "مشترك",
      "مشتركة",
      "عمل مشترك",
      "قطاع خاص",
      "قطاع عام",
      "القطاع الخاص",
      "القطاع العام",
      "شراكات دولية",
      "شراكات وطنية",
      "مشاريع مشتركة",
      "شراكات استراتيجية"
  ].join(" OR ") + ")"
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
      : ["alekhbariyaEN", "arabnews", "AlArabiya_Eng"];

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
        const body = await resp.text().catch(() => "");
        console.error(`Upstream error for ${account}:`, resp.status, body);
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
