const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const FundiProfile = require("../models/FundiProfile");
const {
  issueOtp,
  verifyOtp,
  normalizePhone: normalizeUgandaPhone,
} = require("../services/otpService");
const { normalizePhone } = require("../services/egoSms");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const normalizeRole = (role) => (role === "client" ? "customer" : role);

const buildFullName = (firstName, lastName, fallback = "FundiLink User") => {
  const full = [firstName, lastName].filter(Boolean).join(" ").trim();
  return full || fallback;
};

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  fundiEnabled: user.fundiEnabled,
  phoneVerified: user.phoneVerified,
  dateOfBirth: user.dateOfBirth,
  profilePhoto: user.profilePhoto,
  coverPhoto: user.coverPhoto,
  onboardingComplete: user.onboardingComplete,
  createdAt: user.createdAt,
});

const createFundiProfile = async (userId, skills, experience) => {
  await FundiProfile.findOneAndUpdate(
    { userId },
    { userId, skills: skills || [], experience: experience || 0 },
    { upsert: true, new: true },
  );
};

const register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      name,
      email,
      role,
      phone,
      dateOfBirth,
      profilePhoto,
      skills,
      experience,
    } = req.body;

    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) {
      return res.status(400).json({ message: "role is required" });
    }

    const fullName = buildFullName(firstName, lastName, name);
    if (!fullName) {
      return res.status(400).json({ message: "name is required" });
    }
    if (!email && !phone) {
      return res.status(400).json({ message: "email or phone is required" });
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail)
        return res.status(400).json({ message: "Email already in use" });
    }

    if (phone) {
      const existingPhone = await User.findOne({
        phone: normalizePhone(phone),
      });
      if (existingPhone)
        return res.status(400).json({ message: "Phone already in use" });
    }

    const user = await User.create({
      name: fullName,
      firstName: firstName || fullName.split(" ")[0] || "",
      lastName: lastName || fullName.split(" ").slice(1).join(" ") || "",
      email: email || undefined,
      phone: phone ? normalizePhone(phone) : undefined,
      password: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10),
      role: normalizedRole,
      phoneVerified: Boolean(phone),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      profilePhoto: profilePhoto || "",
      coverPhoto: req.body.coverPhoto || "",
      onboardingComplete: normalizedRole === "customer",
      location: { lat: 0, lng: 0 },
    });

    if (normalizedRole === "fundi") {
      await createFundiProfile(user._id, skills, experience);
    }

    return res.status(201).json({
      token: generateToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const sendOtp = async (req, res, next) => {
  try {
    const { phone, purpose } = req.body;
    if (!phone || !purpose) {
      return res
        .status(400)
        .json({ message: "phone and purpose are required" });
    }
    if (!["register", "login"].includes(purpose)) {
      return res
        .status(400)
        .json({ message: "purpose must be register or login" });
    }

    if (purpose === "login") {
      const existing = await User.findOne({ phone: normalizePhone(phone) });
      if (!existing) {
        return res.status(404).json({
          message: "Account not found. Please create an account first.",
        });
      }
    }

    if (purpose === "register") {
      const existing = await User.findOne({ phone: normalizePhone(phone) });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Phone already registered. Try signing in." });
      }
    }

    const result = await issueOtp(phone, purpose);
    return res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
};

const verifyOtpRegister = async (req, res, next) => {
  try {
    const {
      phone,
      code,
      firstName,
      lastName,
      name,
      role,
      email,
      dateOfBirth,
      profilePhoto,
      skills,
      experience,
    } = req.body;

    if (!phone || !code || !role) {
      return res
        .status(400)
        .json({ message: "phone, code and role are required" });
    }

    const normalizedRole = normalizeRole(role);
    const fullName = buildFullName(firstName, lastName, name);
    if (!fullName) {
      return res
        .status(400)
        .json({ message: "firstName and lastName are required" });
    }

    const normalized = await verifyOtp(phone, code, "register");
    const existing = await User.findOne({ phone: normalized });
    if (existing) {
      return res.status(400).json({ message: "Phone already registered" });
    }

    const user = await User.create({
      name: fullName,
      firstName: firstName || "",
      lastName: lastName || "",
      email: email || undefined,
      phone: normalized,
      password: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10),
      role: normalizedRole,
      phoneVerified: true,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      profilePhoto: profilePhoto || "",
      coverPhoto: req.body.coverPhoto || "",
      onboardingComplete: normalizedRole === "customer",
      location: { lat: 0, lng: 0 },
    });

    if (normalizedRole === "fundi") {
      await createFundiProfile(user._id, skills, experience);
    }

    return res.status(201).json({
      token: generateToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
};

const verifyOtpLogin = async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ message: "phone and code are required" });
    }

    const normalized = await verifyOtp(phone, code, "login");
    const user = await User.findOne({ phone: normalized });
    if (!user) {
      return res.status(404).json({
        message: "Account not found. Please create an account first.",
      });
    }

    user.phoneVerified = true;
    await user.save();

    const isDualRole = user.fundiEnabled && user.role === "customer";

    return res.json({
      token: generateToken(user._id),
      user: formatUser(user),
      requireRoleSelection: isDualRole,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
};

const selectRole = async (req, res, next) => {
  try {
    const { role, userId } = req.body;
    if (!role || !["customer", "fundi"].includes(role)) {
      return res.status(400).json({ message: "role must be 'customer' or 'fundi'" });
    }
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }
    return res.json({
      token: generateToken(user._id),
      user: formatUser(user),
      selectedRole: role,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  sendOtp,
  verifyOtpRegister,
  verifyOtpLogin,
  selectRole,
};
