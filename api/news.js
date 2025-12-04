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
  const useArabic = lang === "ar";

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

  // For now, we *only* use keywords for English.
  // Arabic will use account + lang filters, no heavy topic keywords,
  // to guarantee we actually get Arabic tweets.

  // Validate topic (for English); for Arabic we'll still accept any of the same keys.
  if (!TOPIC_KEYWORDS_EN[topic]) {
    res.status(400).json({ error: "Unknown topic" });
    return;
  }

  // --- 2) ACCOUNTS ---
  const ACCOUNTS_EN = ["AlArabiya_Eng", "arabnews", "alekhbariyaEN"];
  const ACCOUNTS_AR = ["sabqorg", "SaudiNews50", "aawsat_News"];

  const ACCOUNTS = useArabic ? ACCOUNTS_AR : ACCOUNTS_EN;

  const ALLOWED_USERNAMES = new Set(
    ACCOUNTS.map((u) => u.toLowerCase()) // lowercase for safety
  );

  // --- 3) Build TwitterAPI.io URL for one account ---
  function buildTwitterSearchUrl(account) {
    const baseUrl =
      "https://api.twitterapi.io/twitter/tweet/advanced_search";

    let query;

    if (useArabic) {
      // Arabic mode:
      //  - sabqorg & SaudiNews50: just latest Arabic main tweets (no topic filter).
      //  - aawsat_News: require "السعودية" to keep it Saudi-related.
      const fromPart = `from:${account} lang:ar`;

      if (account === "aawsat_News") {
        query = `(${fromPart}) السعودية -is:reply -is:retweet -is:quote`;
      } else {
        query = `(${fromPart}) -is:reply -is:retweet -is:quote`;
      }
    } else {
      // English mode: use topic-specific keywords
      const keywords = TOPIC_KEYWORDS_EN[topic] || "";
      const fromPart = `from:${account}`;
      const core =
        keywords && keywords.trim().length > 0
          ? `(${fromPart}) AND ${keywords}`
          : `(${fromPart})`;
      query = `${core} -is:reply -is:retweet -is:quote`;
    }

    const params = new URLSearchParams({
      query,
      queryType: "Latest",
      limit: "50",
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // --- 4) Fetch for each account in parallel ---
  async function fetchForAccount(account) {
    const url = buildTwitterSearchUrl(account);
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

    // --- 5) Hard filtering: only main/original tweets from allowed accounts ---
    const filtered = allTweets.filter((t) => {
      const author = t?.author || {};
      const userName =
        author.userName || author.username || author.screen_name;

      if (!userName) return false;

      // 5a) ensure author is one of our configured accounts
      if (!ALLOWED_USERNAMES.has(userName.toLowerCase())) return false;

      // 5b) must be a main/original tweet, not reply/retweet/quote
      const isReply =
        t.isReply === true || t.inReplyToId || t.inReplyToUserId;
      const hasQuoted = !!t.quoted_tweet;
      const hasRetweeted = !!t.retweeted_tweet;

      if (isReply || hasQuoted || hasRetweeted) return false;

      // 5c) In Arabic mode, enforce lang === 'ar'
      if (useArabic) {
        const tweetLang = t.lang || t.language || null;
        if (tweetLang && tweetLang.toLowerCase() !== "ar") return false;
      }

      return true;
    });

    // --- 6) De-duplicate by tweet id ---
    const byId = new Map();
    for (const t of filtered) {
      const id = t.id || t.tweet_id || t.tweetId;
      if (!id) continue;
      if (!byId.has(id)) byId.set(id, t);
    }
    const deduped = Array.from(byId.values());

    // --- 7) Sort by createdAt (newest first) ---
    deduped.sort((a, b) => {
      const aDate = new Date(a.createdAt || a.created_at || 0).getTime();
      const bDate = new Date(b.createdAt || b.created_at || 0).getTime();
      return bDate - aDate;
    });

    // --- 8) Return response ---
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
