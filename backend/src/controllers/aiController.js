const { classifyText } = require("../services/aiClassifier");

const classifyIssue = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "text is required" });

    const result = classifyText(text);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = { classifyIssue };
