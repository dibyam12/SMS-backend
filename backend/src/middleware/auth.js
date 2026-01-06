// src/middleware/auth.js
import jwt from "jsonwebtoken";

// 1) define the middleware
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_ACCESS);
    // decoded: { userId, role, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(401).json({ message: "Token is not valid" });
  }
};

// 2) generateToken helper
const generateToken = (user, time, type) => {
  const secret =
    type === "access"
      ? process.env.JWT_SECRET_ACCESS
      : process.env.JWT_SECRET_REFRESH;

  return jwt.sign(
    { userId: user.id, role: user.role },
    secret,
    { expiresIn: time }
  );
};

// 3) export correctly
export { authMiddleware, generateToken };
export default authMiddleware;
