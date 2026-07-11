const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadChat } = require("../middleware/uploadMiddleware");
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  uploadChatImage,
  supportChat,
  markAsRead
} = require("../controllers/chatController");

router.post("/conversations", protect, getOrCreateConversation);
router.get("/conversations", protect, getConversations);
router.get("/conversations/:id/messages", protect, getMessages);
router.post("/conversations/:id/messages", protect, sendMessage);
router.post("/conversations/:id/read", protect, markAsRead);
router.post("/support", protect, supportChat);
router.post("/upload", protect, uploadChat.single("image"), uploadChatImage);

module.exports = router;
