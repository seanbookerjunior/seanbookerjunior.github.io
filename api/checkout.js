const PRODUCTS = {
  'GLO':     160,
  'BPC-157':  85,
  'TB-500':   85,
  'GHK-Cu':   75,
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { cart, email } = body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Use server-side prices — never trust the client
  let amount = 0;
  const lines = [];
  for (const item of cart) {
    const price = PRODUCTS[item.name];
    if (!price) return res.status(400).json({ error: `Unknown product: ${item.name}` });
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    amount += price * qty;
    lines.push(`${item.name} x${qty}`);
  }

  const apiKey = process.env.NEXAPAY_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server configuration error' });

  try {
    const response = await fetch('https://nexapay.one/api/v1/payments', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'USDC',
        customer_email: email,
        description: lines.join(', '),
        success_url: 'https://elvynlabs.com/success',
        cancel_url: 'https://elvynlabs.com/cancel',
        callback_url: 'https://elvynlabs.com/api/webhook',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.errors?.[0]?.detail || data?.message || 'Payment creation failed';
      return res.status(response.status).json({ error: msg });
    }

    const checkoutUrl = data?.data?.payment?.checkout_url;
    if (!checkoutUrl) return res.status(500).json({ error: 'No checkout URL returned' });

    return res.status(200).json({ checkout_url: checkoutUrl });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
