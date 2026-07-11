const CATEGORY_KEYWORDS = {
  plumbing: ["sink", "pipe", "leak", "toilet", "drain", "tap", "water"],
  electrical: ["socket", "wire", "light", "power", "circuit", "switch", "electric"],
  carpentry: ["door", "window", "cabinet", "wood", "table", "shelf", "carpenter"],
  masonry: ["wall", "brick", "cement", "concrete", "plaster", "tile", "masonry"]
};

const classifyText = (text) => {
  const normalized = (text || "").toLowerCase();
  const scores = Object.entries(CATEGORY_KEYWORDS).map(([category, keywords]) => {
    const hits = keywords.reduce((acc, word) => acc + (normalized.includes(word) ? 1 : 0), 0);
    return { category, hits };
  });

  scores.sort((a, b) => b.hits - a.hits);
  const best = scores[0] || { category: "plumbing", hits: 0 };
  const totalHits = scores.reduce((sum, item) => sum + item.hits, 0);
  const confidence = totalHits > 0 ? Number((best.hits / totalHits).toFixed(2)) : 0.4;

  return {
    category: best.category,
    confidence
  };
};

module.exports = { classifyText };
