module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // TODO: Easy Pay Direct webhook signature verification
  // Add EPD-specific header checks and HMAC/secret validation here

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid body' });
  }

  const { payment_id, status } = body || {};

  const sheetUrl = process.env.GOOGLE_SHEET_URL;
  if (sheetUrl && payment_id && status) {
    const statusMap = { completed: 'PAID', failed: 'FAILED', expired: 'EXPIRED' };
    const sheetStatus = statusMap[status];
    if (sheetStatus) {
      fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', payment_id, status: sheetStatus }),
      }).catch(() => {});
    }
  }

  return res.status(200).json({ received: true });
};
