const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // A user qualifies for the "fundi" role if their DB role is "fundi" OR if
    // they are fundi-enabled (dual-role accounts keep role="customer" but have
    // fundiEnabled=true). This lets dual-role fundis use the fundi workflows.
    const allowed =
      roles.includes(req.user.role) ||
      (roles.includes("fundi") && Boolean(req.user.fundiEnabled));

    if (!allowed) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(" or ")}` 
      });
    }
    
    next();
  };
};

module.exports = { protect, requireRole };
