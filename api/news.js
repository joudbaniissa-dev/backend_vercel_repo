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

  // --- 1) Keywords per topic (used for ALL three accounts) ---
  const TOPIC_KEYWORDS = {
    "labor-market":
      "(Saudi labor OR labor market OR Saudi jobs OR employment OR workforce)",
    empowerment:
      "(saudi society OR saudi community OR saudi social development)",
    "non-profit":
      "(saudi donation OR saudi volunteer OR saudi non-profit OR saudi non-profit sector OR saudi charity)",
    "strategic-partnerships":
      "(saudi strategic partnerships OR saudi strategic agreements OR saudi mou OR saudi collaboration)",
  };

  const keywords = TOPIC_KEYWORDS[topic];
  if (!keywords) {
    res.status(400).json({ error: "Unknown topic" });
    return;
  }

  // --- 2) The three official accounts we care about ---
  const ACCOUNTS = ["AlArabiya_Eng", "arabnews", "alekhbariyaEN"];

  const ALLOWED_USERNAMES = new Set(
    ACCOUNTS.map((u) => u.toLowerCase()) // lowercase for safety
  );

  // --- 3) Helper to build TwitterAPI.io URL for one account+topic ---
  function buildTwitterSearchUrl(account, keywords) {
    const baseUrl =
      "https://api.twitterapi.io/twitter/tweet/advanced_search";

    // Query: from:ACCOUNT AND (keywords) -is:reply -is:retweet -is:quote
    const query = `(from:${account}) AND ${keywords} -is:reply -is:retweet -is:quote`;

    const params = new URLSearchParams({
      query,
      queryType: "Latest",
      limit: "25", // per account; adjust if you want fewer/more
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // --- 4) Fetch for each account in parallel ---
  async function fetchForAccount(account) {
    const url = buildTwitterSearchUrl(account, keywords);
    try {
      const resp = await fetch(url, {
        headers: { "X-API-Key": process.env.TWITTER_API_KEY },
      });
      if (!resp.ok) {
        console.error(`Upstream error for ${account}:`, resp.status);
        return [];
      }
      const json = await resp.json();
      const tweets = Array.isArray(json.tweets) ? json.tweets : [];
      return tweets;
    } catch (err) {
      console.error(`Error fetching tweets for ${account}:`, err);
      return [];
    }
  }

  try {
    const allResults = await Promise.all(ACCOUNTS.map(fetchForAccount));
    const allTweets = allResults.flat();

    // --- 5) Hard filtering: only main tweets from the three accounts ---
    const filtered = allTweets.filter((t) => {
      const author = t?.author || {};
      const userName =
        author.userName || author.username || author.screen_name;

      if (!userName) return false;

      // must be one of the three accounts
      if (!ALLOWED_USERNAMES.has(userName.toLowerCase())) return false;

      // must be a main/original tweet, not reply/retweet/quote
      const isReply = t.isReply === true || t.inReplyToId || t.inReplyToUserId;
      const hasQuoted = !!t.quoted_tweet;
      const hasRetweeted = !!t.retweeted_tweet;

      if (isReply || hasQuoted || hasRetweeted) return false;

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

    // --- 7) Sort by createdAt descending (newest first) ---
    deduped.sort((a, b) => {
      const aDate = new Date(a.createdAt || a.created_at || 0).getTime();
      const bDate = new Date(b.createdAt || b.created_at || 0).getTime();
      return bDate - aDate;
    });

    // --- 8) Return a simple, consistent shape ---
    res.status(200).json({
      tweets: deduped,
      has_next_page: false,
      next_cursor: null,
      topic,
      sources: ACCOUNTS,
    });
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Failed to fetch tweets" });
  }
}
