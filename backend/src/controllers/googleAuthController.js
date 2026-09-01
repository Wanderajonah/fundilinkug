const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });

    const { sub: googleId, email, name, picture } = ticket.getPayload();

    if (!email) {
      return res.status(400).json({ message: "Email not found in Google account" });
    }

    // Find existing user by email or googleId
    let user =
      (await User.findOne({ googleId })) ||
      (await User.findOne({ email }));

    if (user) {
      // Link Google ID if not already linked
      user.googleId = user.googleId || googleId;
      user.profilePhoto = user.profilePhoto || picture || "";
      if (!user.email && email) user.email = email;
      await user.save();
    } else {
      // Create new customer account
      const [firstName = "", ...rest] = (name || "").split(" ");
      user = await User.create({
        name: name || email.split("@")[0],
        firstName,
        lastName: rest.join(" "),
        email,
        googleId,
        profilePhoto: picture || "",
        phoneVerified: true,
        role: "customer",
        password: crypto.randomBytes(24).toString("hex"),
        location: { lat: 0, lng: 0 },
      });
    }

    return res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        fundiEnabled: user.fundiEnabled,
        profilePhoto: user.profilePhoto,
        phoneVerified: user.phoneVerified,
        dateOfBirth: user.dateOfBirth,
        onboardingComplete: user.onboardingComplete,
        locationConfigured:
          Number(user.location?.lat) !== 0 || Number(user.location?.lng) !== 0,
        location: user.location
          ? { lat: user.location.lat, lng: user.location.lng }
          : null,
        locationLabel: user.locationLabel || "",
      },
    });
  } catch (error) {
    if (error.message?.includes("Token used too late") || error.message?.includes("Invalid token")) {
      return res.status(401).json({ message: "Invalid or expired Google token" });
    }
    return next(error);
  }
};

module.exports = { googleAuth };
