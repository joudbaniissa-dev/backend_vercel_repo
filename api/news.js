// api/news.js
export default async function handler(req, res) {
    // Allow CORS for your GitHub Pages origin
    res.setHeader('Access-Control-Allow-Origin', 'https://joudbaniissa-dev.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') {
      // Preflight request
      res.status(200).end();
      return;
    }
  
    const { topic } = req.query; // e.g. 'labor-market'
  
    // Map topic → TwitterAPI.io URL
    const urls = {
      'labor-market':
        'https://api.twitterapi.io/twitter/tweet/advanced_search?query=%28from%3AAlArabiya_Eng%20OR%20from%3Aarabnews%20OR%20from%3AalekhbariyaEN%29%20AND%20%28Saudi%20labor%20OR%20labor%20market%20OR%20Saudi%20jobs%20OR%20employment%20OR%20workforce%29%20-is%3Areply%20-is%3Aretweet%20-is%3Aquote&queryType=Latest&limit=20',
    
      'empowerment':
        'https://api.twitterapi.io/twitter/tweet/advanced_search?query=%28from%3AAlArabiya_Eng%20OR%20from%3Aarabnews%20OR%20from%3AalekhbariyaEN%29%20AND%20%28saudi%20society%20OR%20saudi%20community%20OR%20saudi%20social%20development%29%20-is%3Areply%20-is%3Aretweet%20-is%3Aquote&queryType=Latest&limit=25',
    
      'non-profit':
        'https://api.twitterapi.io/twitter/tweet/advanced_search?query=%28from%3AAlArabiya_Eng%20OR%20from%3Aarabnews%20OR%20from%3AalekhbariyaEN%29%20AND%20%28saudi%20donation%20OR%20saudi%20volunteer%20OR%20saudi%20non-profit%20OR%20saudi%20non-profit%20sector%20OR%20saudi%20charity%29%20-is%3Areply%20-is%3Aretweet%20-is%3Aquote&queryType=Latest&limit=25',
    
      'strategic-partnerships':
        'https://api.twitterapi.io/twitter/tweet/advanced_search?query=%28from%3AAlArabiya_Eng%20OR%20from%3Aarabnews%20OR%20from%3AalekhbariyaEN%29%20AND%20%28saudi%20strategic%20partnerships%20OR%20saudi%20strategic%20agreements%20OR%20saudi%20mou%20OR%20saudi%20collaboration%29%20-is%3Areply%20-is%3Aretweet%20-is%3Aquote&queryType=Latest&limit=25',
    };

  
    const upstreamUrl = urls[topic];
    if (!upstreamUrl) {
      res.status(400).json({ error: 'Unknown topic' });
      return;
    }
  
    try {
      const upstreamRes = await fetch(upstreamUrl, {
        headers: { 'X-API-Key': process.env.TWITTER_API_KEY },
      });
  
      if (!upstreamRes.ok) {
        res.status(upstreamRes.status).json({ error: 'Upstream error' });
        return;
      }
  
      const data = await upstreamRes.json();
      res.status(200).json(data);
    } catch (err) {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Failed to fetch tweets' });
    }
  }
