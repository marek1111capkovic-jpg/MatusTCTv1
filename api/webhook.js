// webhook.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // IMPORTANT: need raw body for constructEvent. Vercel provides body as text by default in edge? 
    // On Node runtime this works. If using frameworks that parse body, ensure raw body is available.
    const buf = await getRawBody(req); // helper below
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // TODO: do fulfillment: save order in DB, send email, etc.
      console.log('Checkout session completed:', session.id, session.customer);
      break;
    // handle other event types as needed
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}

// Helper to get raw body (works with Vercel Node runtime)
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = [];
    req.on('data', chunk => data.push(chunk));
    req.on('end', () => resolve(Buffer.concat(data).toString()));
    req.on('error', err => reject(err));
  });
}
