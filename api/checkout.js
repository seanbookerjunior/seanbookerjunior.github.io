async function checkStock(cart) {
  const url = process.env.GOOGLE_INVENTORY_URL;
  if (!url) return;
  const res = await fetch(url);
  const stock = await res.json();
  for (const item of cart) {
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const available = stock[item.name] ?? 0;
    if (available < qty) throw new Error(`${item.name} is out of stock`);
  }
}

async function decrementStock(cart) {
  const url = process.env.GOOGLE_INVENTORY_URL;
  if (!url) return;
  const items = cart.map(item => ({
    name: item.name,
    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
  }));
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'decrement', items }),
  });
}

async function logOrderToSheet({ paymentId, email, shipping, lines, amount }) {
  const url = process.env.GOOGLE_SHEET_URL;
  if (!url) return;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create',
      payment_id: paymentId,
      email,
      shipping,
      items: lines.join(', '),
      total: amount,
    }),
  });
}

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

  const { cart, email, shipping } = body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const { name, street, city, state, zip, country } = shipping || {};
  if (!name || !street || !city || !state || !zip || !country) {
    return res.status(400).json({ error: 'Shipping address is incomplete' });
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

  try {
    await checkStock(cart);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // TODO: Easy Pay Direct integration
  // Wire up EPD API key, endpoint, and request shape here
  return res.status(501).json({ error: 'Payment processor not yet configured' });
};
