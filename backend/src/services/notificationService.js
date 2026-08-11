const { sendBookingSms } = require("./bookingSmsService");
const { generateSms } = require("./groqService");

// This will be set when socket.io is initialized
let io = null;

function setIo(socketIo) {
  io = socketIo;
}

// A user counts as online only if their socket is actually connected.
// This guards against stale isOnline/socketId state after a dropped connection.
function isOnline(user) {
  return Boolean(user && user.socketId && io && io.sockets.sockets.get(user.socketId));
}

async function buildSmsMessage(event, data, recipient) {
  try {
    const generated = await generateSms(event, data, recipient);
    if (generated) return generated;
  } catch (error) {
    console.error("AI SMS generation failed:", error.message);
  }
  return formatSmsMessage(event, data, recipient);
}

// Deliver a notification to a user:
//  - online  -> socket event only (no SMS)
//  - offline -> SMS only
async function deliver(userId, event, data, role) {
  const channels = [];
  try {
    const User = require("../models/User");
    const user = await User.findById(userId);
    if (!user) return channels;

    if (isOnline(user)) {
      io.to(user.socketId).emit(event, data);
      channels.push("socket");
      console.log(`Socket notification sent to ${role} ${userId} for event ${event}`);
      return channels;
    }

    if (user.phone) {
      const message = await buildSmsMessage(event, data, role);
      if (message) {
        const result = await sendBookingSms({ toNumber: user.phone, message });
        if (result.success) {
          channels.push("sms");
        }
      }
    }
  } catch (error) {
    console.error(`Notification failed for ${role} ${userId}:`, error.message);
  }

  return channels;
}

async function notifyFundi(fundiId, event, data) {
  return deliver(fundiId, event, data, "fundi");
}

async function notifyClient(clientId, event, data) {
  return deliver(clientId, event, data, "client");
}

function formatSmsMessage(event, data, recipient) {
  switch (event) {
    case "booking_request":
      return `New job: ${data.category} at ${data.address}. Client: ${data.clientName}, Tel: ${data.clientPhone}. Call or open FundiLink app to respond within 5 min.`;

    case "booking_accepted":
      if (recipient === "client") {
        return `Your booking has been accepted! Fundi: ${data.fundiName}. Phone: ${data.fundiPhone}. They are on their way.`;
      }
      return "";

    case "booking_declined":
      if (recipient === "client") {
        return `A fundi declined your booking. We are finding another available fundi for you.`;
      }
      return "";

    case "booking_cancelled":
      if (recipient === "client") {
        return `Your booking has been cancelled by the fundi. Reason: ${data.reason || "Not specified"}`;
      }
      return `The client has cancelled the booking. Reason: ${data.reason || "Not specified"}`;

    case "booking_expired":
      if (recipient === "fundi") {
        return `A job request has expired as no fundi responded in time.`;
      }
      return "";

    case "status_on_the_way":
      if (recipient === "client") {
        return `Your fundi is on the way! Track their location in the app.`;
      }
      return "";

    case "status_arrived":
      if (recipient === "client") {
        return `Your fundi has arrived at your location.`;
      }
      return "";

    case "status_in_progress":
      if (recipient === "client") {
        return `Your fundi has started working on your job.`;
      }
      return "";

    case "status_completed":
      if (recipient === "fundi") {
        return `The client has confirmed the job is complete. Thank you for your service!`;
      }
      return "";

    case "no_fundi_available":
      if (recipient === "client") {
        return `Sorry, no fundis are available right now. Please try again later.`;
      }
      return "";

    case "verification_approved":
      return "Congratulations! Your FundiLink profile has been verified. You can now receive job requests and start earning. Welcome to the platform!";

    case "verification_rejected":
      return `Your FundiLink profile verification was not approved.${data.notes ? ` Reason: ${data.notes}.` : ""} Please review your documents and re-submit for verification in the app.`;

    case "price_update":
      if (recipient === "client") {
        return data.priceAgreed
          ? `Price agreed at UGX ${Number(data.agreedPrice || 0).toLocaleString()}. Proceed to payment in the app.`
          : `New price proposal: UGX ${Number(data.proposedPrice || 0).toLocaleString()}. Open the app to respond.`;
      }
      return data.priceAgreed
        ? `Client agreed to UGX ${Number(data.agreedPrice || 0).toLocaleString()}.`
        : `New price proposal: UGX ${Number(data.proposedPrice || 0).toLocaleString()}. Open the app to respond.`;

    default:
      return "";
  }
}

async function notifyFundiLocation(clientId, locationData) {
  try {
    const User = require("../models/User");
    const client = await User.findById(clientId);

    if (isOnline(client)) {
      io.to(client.socketId).emit("fundi_location_update", locationData);
      console.log(`Live location sent to client ${clientId}`);
    }
  } catch (error) {
    console.error(`Location update failed for client ${clientId}:`, error.message);
  }
}

module.exports = {
  setIo,
  notifyFundi,
  notifyClient,
  notifyFundiLocation
};
