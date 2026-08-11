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
  // Global dev-mode guard: with COMMS_DEV_MODE=true nothing is ever sent to the
  // real gateway. Messages are logged so flows can be tested without cost.
  if (process.env.COMMS_DEV_MODE === "true") {
    console.log(`[DEV SMS] to ${normalizePhone(toNumber)}: ${message}`);
    return { Status: "OK", devMode: true };
  }

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

  const timeoutMs = Number(process.env.COMMS_TIMEOUT_MS) || 10000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (fetchErr) {
    throw new Error(fetchErr.name === "AbortError" ? `SMS gateway timeout after ${timeoutMs}ms` : fetchErr.message);
  } finally {
    clearTimeout(timer);
  }

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
