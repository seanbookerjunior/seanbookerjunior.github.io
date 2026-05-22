module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid body' });
  }

  const paymentId = body?.payment?.id ?? body?.data?.payment?.id ?? body?.payment_id ?? '';

  const url = process.env.GOOGLE_SHEET_URL;
  if (url && paymentId) {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', payment_id: paymentId }),
    }).catch(() => {});
  }

  return res.status(200).json({ received: true });
};
