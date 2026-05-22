const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-nexapay-signature'];
  const timestamp  = req.headers['x-nexapay-timestamp'];

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid body' });
  }

  // Verify HMAC signature if a webhook secret is configured
  const webhookSecret = process.env.NEXAPAY_WEBHOOK_SECRET;
  if (webhookSecret && signature) {
    const payload = JSON.stringify(body);
    const expected = 'sha256=' + crypto
      .createHmac('sha256', webhookSecret)
      .update(timestamp + '.' + payload)
      .digest('hex');

    if (signature !== expected) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const maxAge = 5 * 60 * 1000;
    if (Math.abs(Date.now() - parseInt(timestamp)) > maxAge) {
      return res.status(401).json({ error: 'Webhook expired' });
    }
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
