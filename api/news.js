// api/news.js
export default async function handler(req, res) {
  // --- CORS: allow specific GitHub Pages frontends ---
  const allowedOrigins = new Set([
    "https://joudbaniissa-dev.github.io",
    "https://omar-shandaq.github.io",
    "https://ai-exec-office.vercel.app",
    "https://ai-exec-office.vercel.app/AI_exec_office.html",
    // Note: browsers send origin without path, so this is redundant but harmless:
    "https://omar-shandaq.github.io/AI-Agent-/"
  ]);

  const origin = req.headers.origin;
  if (allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

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
    "labor-market":
      "(" +
      [
        "labor",
        "labour",
        "job",
        "jobs",
        "employment",
        "workforce",
        "labor market",
        "hiring",
        "Saudization",
        "localization",
        "nationals",
        "talents",
        "national talent"
      ].join(" OR ") +
      ")",

    empowerment:
      "(" +
      [
        "empower",
        "empowerment",
        "community",
        "communities",
        "society",
        "inclusion",
        "citizens",
        "individuals",
        "programs",
        "support",
        "program",
      ].join(" OR ") +
      ")",

    "non-profit":
      "(" +
      [
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
        "impact",
      ].join(" OR ") +
      ")",

    "strategic-partnerships":
      "(" +
      [
        "partnership",
        "partnerships",
        "agreement",
        "agreements",
        "collaboration",
        "cooperation",
        "mou",
        "contract",
        "alliances",
        "joint",
        "strategic partnership",
        "strategic partnerships",
        "sustainable partnership",
      ].join(" OR ") +
      ")",
  };

  // --- 2) ARABIC KEYWORDS PER TOPIC (Arabic accounts, broader: tokens + phrases) ---
  const TOPIC_KEYWORDS_AR = {
    // ================================================================
    // 1) LABOR MARKET (already working — lightly expanded)
    // ================================================================
    "labor-market":
      "(" +
      [
        "سوق",
        "العمل",
        "وظائف",
        "وظيفة",
        "فرص",
        "التوظيف",
        "توظيف",
        "بطالة",
        "عاطلين",
        "توطين",
        "السعودة",
        "موارد",
        "كوادر",
        "شباب",
        "السعوديين",
        "بيئة",
        "سلامة",
        "أجور",
        "رواتب",
        "مهارات",
      ].join(" OR ") +
      ")",

    // ================================================================
    // 2) EMPOWERMENT (expanded, high-frequency tokens)
    // ================================================================
    empowerment:
      "(" +
      [
        "تمكين",
        "مجتمع",
        "مجتمعي",
        "مجتمعات",
        "أفراد",
        "تنمية",
        "تنمية",
        "اجتماعية",
        "اجتماعي",
        "برامج",
        "برنامج",
        "مبادرات",
        "مبادرة",
        "دعم",
        "دعم اجتماعي",
        "ذاتي",
        "شمول",
        "اندماج",
        "رفاه",
        "رفاهية",
        "جودة",
        "جودة الحياة",
        "المجتمع السعودي",
      ].join(" OR ") +
      ")",

    // ================================================================
    // 3) NON-PROFIT (expanded with the most common Saudi non-profit vocabulary)
    // ================================================================
    "non-profit":
      "(" +
      [
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
        "قطاع",
        "قطاع ثالث",
        "القطاع الثالث",
        "تطوع",
        "تطوعي",
        "متطوعين",
        "متطوع",
        "مبادرات",
        "مبادرة",
        "تبرع",
        "تبرعات",
        "وقفيات",
        "وقف",
        "أثر",
        "أثر اجتماعي",
        "مسؤولية",
        "مسؤولية اجتماعية",
        "استدامة",
        "استدامة مالية",
        "تنمية",
        "تنمية الموارد",
        "عمل خيري",
        "أعمال خيرية",
      ].join(" OR ") +
      ")",

    // ================================================================
    // 4) STRATEGIC PARTNERSHIPS (very common words used in news)
    // ================================================================
    "strategic-partnerships":
      "(" +
      [
        "شراكة",
        "شراكات",
        "استراتيجية",
        "استراتيجي",
        "اتفاق",
        "اتفاقية",
        "اتفاقيات",
        "تعاون",
        "مشترك",
        "مشتركة",
        "مشاريع مشتركة",
        "مذكرة",
        "مذكرة تفاهم",
        "تحالف",
        "تحالفات",
        "قطاع خاص",
        "قطاع عام",
        "القطاع الخاص",
        "القطاع العام",
        "شراكات دولية",
        "شراكات وطنية",
        "مبادرة",
        "مبادرات",
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
    const query = `(${fromPart}) AND ${keywordsForQuery} -is:reply -is:retweet`;

    const params = new URLSearchParams({
      query,
      queryType: "Top",
      limit: "50",
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // --- 5) Fetch for each account in parallel ---
  async function fetchForAccount(account) {
    // Default: just use topic keywords
    let accountKeywords = keywords;

    // Special rule: for aawsat_News in Arabic, always require "السعودية" or "سعودية"
    if (useArabic && account === "aawsat_News") {
      accountKeywords = `((السعودية OR سعودية) AND ${keywords})`;
    }
    // Special rule: for arabnews & AlArabiya_Eng in English, always require "Saudi"
    else if (
      !useArabic &&
      (account === "arabnews" || account === "AlArabiya_Eng")
    ) {
      accountKeywords = `(Saudi AND ${keywords})`;
    }

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

      if (isReply || hasRetweeted) return false;

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
