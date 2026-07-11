const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function isConfigured() {
  return !!(process.env.GROQ_API_KEY && process.env.GROQ_MODEL);
}

const SYSTEM_PROMPT = `You are a helpful customer support assistant for FundiLink, a platform that connects clients with local fundis (artisans/skilled workers) in Uganda.

Your role:
- Help users understand how the platform works
- Answer questions about booking, pricing, payments, and safety
- Guide users through common tasks (creating a booking, accepting jobs, etc.)
- Be friendly, professional, and concise in your responses
- If you don't know something, say so honestly
- Keep responses brief (2-3 sentences max when possible)

Key platform features:
- Clients can browse fundis by category (plumbers, electricians, carpenters, painters, etc.)
- Bookings have a 5-minute response window for fundis
- Price negotiation happens after booking acceptance
- Fundis are matched by proximity and availability
- Communication happens through the app's chat and socket system
- SMS notifications are sent for key events
- Payments and ratings come after job completion

Common issues:
- If a fundi doesn't respond within 5 minutes, the booking moves to the next available fundi
- Prices can be negotiated between client and fundi after acceptance
- Cancellations can be made by either party before the job starts`;

async function getBotResponse(messages) {
  if (!isConfigured()) {
    return fallbackResponse(messages);
  }

  const model = process.env.GROQ_MODEL;

  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-10)
    ],
    max_tokens: 300,
    temperature: 0.7
  };

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      console.error(`Groq API error (${res.status}): ${errText}`);
      return fallbackResponse(messages);
    }

    const json = await res.json();
    let reply = json?.choices?.[0]?.message?.content?.trim();
    if (!reply) return fallbackResponse(messages);

    reply = reply.replace(/^["']+|["']+$/g, "");
    return reply;
  } catch (error) {
    console.error("Groq support bot request failed:", error.message);
    return fallbackResponse(messages);
  }
}

function fallbackResponse(messages) {
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
  const m = lastMsg;

  if (m.includes("cancel") || m.includes("cancel")) {
    return "To cancel a booking, go to the booking details and tap Cancel. Both clients and fundis can cancel before the job starts.";
  }
  if (m.includes("price") || m.includes("cost") || m.includes("fee") || m.includes("how much")) {
    return "Prices are negotiated between you and the fundi after a booking is accepted. You can discuss and agree on a fair price through the app.";
  }
  if (m.includes("payment") || m.includes("pay") || m.includes("mpesa") || m.includes("mobile money")) {
    return "Payments are handled between you and the fundi. The app helps you connect; payment terms are agreed upon directly.";
  }
  if (m.includes("fundi") || m.includes("artisan") || m.includes("worker")) {
    return "Fundis are skilled workers available on FundiLink. Browse by category like plumbing, electrical, carpentry, and painting to find the right expert near you.";
  }
  if (m.includes("booking") || m.includes("request") || m.includes("hire")) {
    return "To create a booking, browse fundis by category, select one near you, describe your job, and send the request. The fundi will respond within 5 minutes.";
  }
  if (m.includes("hello") || m.includes("hi ") || m.includes("hey") || m.includes("good")) {
    return "Hello! Welcome to FundiLink. I'm here to help you with any questions about using the platform. How can I assist you today?";
  }
  if (m.includes("time") || m.includes("minute") || m.includes("how long") || m.includes("wait")) {
    return "Fundis have 5 minutes to respond to a booking request. If no response, the request moves to the next available fundi.";
  }
  if (m.includes("location") || m.includes("near") || m.includes("distance") || m.includes("far")) {
    return "FundiLink matches you with fundis near your location. You can see the distance to each fundi before selecting one.";
  }
  if (m.includes("safe") || m.includes("secure") || m.includes("trust") || m.includes("scam")) {
    return "FundiLink profiles show ratings, reviews, and completed jobs to help you choose trusted fundis. Always communicate through the app.";
  }
  if (m.includes("thank")) {
    return "You're welcome! Feel free to ask if you need anything else. Happy using FundiLink!";
  }

  return "I'm not sure I understand. Could you rephrase your question? You can ask me about bookings, pricing, payments, fundis, or how the platform works.";
}

module.exports = { getBotResponse, isConfigured };
