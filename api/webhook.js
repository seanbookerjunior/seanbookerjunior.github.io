module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Acknowledge receipt — add fulfillment logic here as needed
  return res.status(200).json({ received: true });
};
