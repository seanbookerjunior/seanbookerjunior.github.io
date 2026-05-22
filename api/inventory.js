module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const url = process.env.GOOGLE_INVENTORY_URL;
  if (!url) return res.status(500).json({ error: 'Inventory not configured' });

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json(data);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};
