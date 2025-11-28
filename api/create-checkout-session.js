import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "https://www.matustct.sk");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  // --- END CORS ---

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Test Produkt",
            },
            unit_amount: 4000,
          },
          quantity: 1,
        },
      ],
      success_url: "https://www.matustct.sk/platba/frontend/success.html",
      cancel_url: "https://www.matustct.sk/platba/frontend/cancel.html",
    });

    // DÔLEŽITÉ: Vráťte aj URL, nie len ID!
    res.status(200).json({ 
      id: session.id,
      url: session.url  // ← TOTO PŘIDAJTE
    });
    
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
}

