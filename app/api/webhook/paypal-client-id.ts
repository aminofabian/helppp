import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const paypalClientId = process.env.PAYPAL_CLIENT_ID;

  if (!paypalClientId) {
    return res.status(500).json({ error: 'PayPal client ID not found.' });
  }

  return res.status(200).json({ paypalClientId });
}