const { sendSms } = require("./egoSms");

async function sendBookingSms({ toNumber, message }) {
  try {
    await sendSms({ toNumber, message });
    console.log(`SMS sent successfully to ${toNumber}`);
    return { success: true, message: "SMS sent successfully" };
  } catch (error) {
    console.error(`Failed to send SMS to ${toNumber}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendBookingSms };
