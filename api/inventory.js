module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const url = process.env.GOOGLE_INVENTORY_URL;
  if (!url) return res.status(500).json({ error: 'Inventory not configured' });

  try {
    const response = await fetch(url, { redirect: 'follow' });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch {
      return res.status(500).json({ error: 'Invalid JSON from inventory', raw: text.slice(0, 300), status: response.status });
    }
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch inventory', detail: err.message });
  }
};
