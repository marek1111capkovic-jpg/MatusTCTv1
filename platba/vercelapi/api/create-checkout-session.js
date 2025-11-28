// create-checkout-session.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.matustct.sk");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Preflight request (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { priceId, quantity = 1 } = req.body;

    // create Checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity }],
      mode: 'payment', // 'subscription' for recurring
      payment_method_types: ['card'],
      success_url: `${process.env.FRONTEND_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.FRONTEND_CANCEL_URL,
    });

    // return URL to frontend
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe create session error:', err);
    res.status(500).json({ error: err.message });
  }
}
