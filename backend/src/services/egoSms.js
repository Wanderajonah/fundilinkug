const DEFAULT_ENDPOINT = "https://comms.egosms.co/api/v1/json/";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in environment`);
  return v;
}

function normalizePhone(phone) {
  const raw = String(phone || "").trim();
  const cleaned = raw.startsWith("+")
    ? `+${raw.slice(1).replace(/\D/g, "")}`
    : raw.replace(/\D/g, "");
  return cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
}

async function sendSms({ toNumber, message, senderid, priority = "0" }) {
  const endpoint = process.env.COMMS_ENDPOINT || DEFAULT_ENDPOINT;
  const username = requireEnv("COMMS_USERNAME");
  const password = requireEnv("COMMS_API_KEY");
  const effectiveSender = senderid || process.env.COMMS_SENDER_ID;
  if (!effectiveSender) throw new Error("Missing COMMS_SENDER_ID (or senderid)");

  const payload = {
    method: "SendSms",
    userdata: { username, password },
    msgdata: [
      {
        number: normalizePhone(toNumber),
        message: String(message),
        senderid: String(effectiveSender),
        priority: String(priority)
      }
    ]
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((json && (json.Message || json.message)) || `SMS gateway error (${res.status})`);
  }
  if (!json || json.Status !== "OK") {
    throw new Error((json && json.Message) || "SMS send failed");
  }
  return json;
}

module.exports = { sendSms, normalizePhone };
