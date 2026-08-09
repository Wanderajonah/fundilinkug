const TRADE_CATEGORIES = ["plumber", "electrician", "carpenter", "painter"];

// Maps each trade category (job title, used by the AI + browse) to the skill
// names stored on FundiProfile.skills (gerunds like "plumbing").
const TRADE_SKILLS = {
  plumber: ["plumbing", "plumber", "pipe fitting", "water heater installation"],
  electrician: ["electrical", "electrician", "wiring", "lighting installation"],
  carpenter: ["carpentry", "carpenter", "furniture making", "cabinet installation"],
  painter: ["painting", "painter", "wall finishing", "decorative painting"],
};

const buildSkillsQuery = (category) => ({
  skills: { $in: TRADE_SKILLS[category] || [category] },
});

const guessTradeFromText = (text) => {
  const m = (text || "").toLowerCase();
  if (/plumb|pipe|leak|tap|toilet|sink|water|drain|bathroom|kitchen/.test(m)) return "plumber";
  if (/electr|power|socket|wiring|light|fuse|switch|short/.test(m)) return "electrician";
  if (/carpent|wood|furniture|cabinet|door|shelf/.test(m)) return "carpenter";
  if (/paint|wall color|repaint|plaster|drywall/.test(m)) return "painter";
  return null;
};

module.exports = { TRADE_CATEGORIES, TRADE_SKILLS, buildSkillsQuery, guessTradeFromText };
