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

  // --- 1) English keywords per topic (used for AlArabiya_Eng / arabnews / alekhbariyaEN) ---
  const TOPIC_KEYWORDS_EN = {
    "labor-market":
      "(Saudi labor OR labor market OR Saudi jobs OR employment OR workforce)",
    empowerment:
      "(saudi society OR saudi community OR saudi social development OR empowering individuals OR empowering communities OR social empowerment)",
    "non-profit":
      "(saudi donation OR saudi volunteer OR saudi non-profit OR saudi non-profit sector OR saudi charity OR non-profit sector OR third sector)",
    "strategic-partnerships":
      "(saudi strategic partnerships OR saudi strategic agreements OR saudi mou OR saudi collaboration OR national partnerships OR public private partnership)",
  };

  // --- 2) Arabic keywords per topic (used for sabqorg, lang=ar) ---
  const TOPIC_KEYWORDS_AR = {
    // Labor market / empowerment of Saudis in سوق العمل
    "labor-market":
      '( "سوق العمل" OR توطين OR الوظائف OR "بيئة العمل" OR "سلامة مهنية" OR "ممارسات عمل" OR تمكين OR "تمكين الشباب" OR "تمكين السعوديين" OR "سياسات العمل" OR تشريعات OR "تنظيمات العمل" OR "معايير عالمية" OR "جودة العمل" OR "تطوير المهارات" OR التوظيف )',

    // Empowering Society & Individuals
    empowerment:
      '( "تمكين الأفراد" OR "تمكين المجتمع" OR "تمكين المجتمعات" OR "تمكين الأسر" OR "التنمية الاجتماعية" OR "برامج تمكين" OR "برامج مجتمعية" OR "برامج التنمية الاجتماعية" OR "الاعتماد على الذات" OR "تعزيز الاعتماد على الذات" OR "الدعم الاجتماعي" OR "برامج الدعم" )',

    // Enabling the Non-Profit Sector
    "non-profit":
      '( "القطاع غير الربحي" OR "القطاع الثالث" OR "المنظمات غير الربحية" OR "الجمعيات الخيرية" OR "العمل الخيري" OR "العمل التطوعي" OR "تمكين القطاع غير الربحي" OR "حوكمة القطاع غير الربحي" OR "الأثر الاجتماعي" OR "المسؤولية الاجتماعية" OR "مبادرات مجتمعية" )',

    // Strategic Partnerships
    "strategic-partnerships":
      '( "شراكات استراتيجية" OR "شراكة استراتيجية" OR "شراكات وطنية" OR "شراكات مستدامة" OR "شراكات فاعلة" OR "اتفاقيات تعاون" OR "مذكرات تفاهم" OR "تعاون مشترك" OR "شراكات القطاعين العام والخاص" OR "شراكات مع القطاع غير الربحي" )',
  };

  let keywords =
    lang === "ar"
      ? TOPIC_KEYWORDS_AR[topic]
      : TOPIC_KEYWORDS_EN[topic];

  if (!keywords) {
    res.status(400).json({ error: "Unknown topic" });
    return;
  }

  // --- 3) Accounts to use ---
  // English mode: 3 news accounts
  // Arabic mode: sabqorg only
  let ACCOUNTS =
    lang === "ar"
      ? ["sabqorg"]
      : ["AlArabiya_Eng", "arabnews", "alekhbariyaEN"];

  const ALLOWED_USERNAMES = new Set(
    ACCOUNTS.map((u) => u.toLowerCase()) // lowercase for safety
  );

  const useArabic = lang === "ar";

  // --- 4) Helper to build TwitterAPI.io URL for one account+topic ---
  function buildTwitterSearchUrl(account, keywordsForQuery) {
    const baseUrl =
      "https://api.twitterapi.io/twitter/tweet/advanced_search";

    // from:ACCOUNT [lang:ar] AND (keywords) -is:reply -is:retweet -is:quote
    const fromPart = useArabic
      ? `from:${account} lang:ar`
      : `from:${account}`;

    const query = `(${fromPart}) AND ${keywordsForQuery} -is:reply -is:retweet -is:quote`;

    const params = new URLSearchParams({
      query,
      queryType: "Latest",
      limit: "50", // up to 50 tweets per account
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // --- 5) Fetch for each account in parallel ---
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

    // --- 6) Hard filtering: only main tweets from the allowed accounts ---
    const filtered = allTweets.filter((t) => {
      const author = t?.author || {};
      const userName =
        author.userName || author.username || author.screen_name;

      if (!userName) return false;

      // must be one of the allowed accounts
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

    // --- 8) Sort by createdAt descending (newest first) ---
    deduped.sort((a, b) => {
      const aDate = new Date(a.createdAt || a.created_at || 0).getTime();
      const bDate = new Date(b.createdAt || b.created_at || 0).getTime();
      return bDate - aDate;
    });

    // --- 9) Return a simple, consistent shape ---
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
