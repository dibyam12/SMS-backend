// src/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateToken } from "../middleware/auth.js";
import redisClient from "../redis/redisClient.js";
import userRepository from "../models/repositories/user/userRepository.js";

const { allowedRoles } = userRepository;

// REGISTER
const registerUser = async (req, res) => {
  const { email, username, password, first_name, last_name, role, is_staff } =
    req.body;

  if (
    !email ||
    !username ||
    !password ||
    !first_name ||
    !last_name ||
    !role ||
    typeof is_staff !== "boolean"
  ) {
    return res.status(400).json({ message: "Invalid or missing fields" });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const existingByEmail = await userRepository.findByEmail(email);
    if (existingByEmail) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const existingByUsername = await userRepository.findByUsername(username);
    if (existingByUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await userRepository.createUser({
      email,
      username,
      passwordHash,
      first_name,
      last_name,
      role,
      is_staff,
    });

    return res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    if (err.message === "INVALID_ROLE") {
      return res.status(400).json({ message: "Invalid role" });
    }
    console.error("Error registering user:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// LOGIN
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await userRepository.findByUsername(username);
    if (!user) {
      return res.status(400).json({ message: "Incorrect email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Incorrect email or password" });
    }

    // include role in token
    const accessToken = generateToken(user, "15m", "access");
    const refreshToken = generateToken(user, "7d", "refresh");

    if (redisClient) {
      const hashedRefresh = await bcrypt.hash(refreshToken, 10);
      await redisClient.set(`refresh:${user.id}`, hashedRefresh, {
        EX: 60 * 60 * 24 * 7,
      });
    }

    return res
      .status(200)
      .json({ message: "Login successful", accessToken, refreshToken });
  } catch (err) {
    console.error("Error logging in user:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// LOGOUT
const logoutUser = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(200).json({ message: "Logged out (no token provided)" });
  }

  if (!redisClient) {
    return res.status(200).json({ message: "Logged out" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);
    await redisClient.del(`refresh:${decoded.userId}`);
  } catch (err) {
    // ignore invalid/expired token
  }

  return res.status(200).json({ message: "Logged out successfully" });
};

// REFRESH
const refreshUserToken = async (req, res) => {
  if (!redisClient) {
    return res
      .status(503)
      .json({ message: "Refresh tokens disabled (no Redis)" });
  }

  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  let userId;
  let role;
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);
    userId = decoded.userId;
    role = decoded.role;
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }

  try {
    const storedHashedToken = await redisClient.get(`refresh:${userId}`);
    if (!storedHashedToken) {
      return res
        .status(403)
        .json({ message: "Refresh token revoked or invalid" });
    }

    const isMatch = await bcrypt.compare(refreshToken, storedHashedToken);
    if (!isMatch) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // One-time use refresh token
    await redisClient.del(`refresh:${userId}`);

    const userPayload = { id: userId, role };

    const newAccessToken = generateToken(userPayload, "15m", "access");
    const newRefreshToken = generateToken(userPayload, "7d", "refresh");

    const hashedNewRefresh = await bcrypt.hash(newRefreshToken, 10);
    await redisClient.set(`refresh:${userId}`, hashedNewRefresh, {
      EX: 60 * 60 * 24 * 7,
    });

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("Error refreshing token:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

export { registerUser, loginUser, logoutUser, refreshUserToken };
