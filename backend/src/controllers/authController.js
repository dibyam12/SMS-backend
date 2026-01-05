import pool from "../config/db.js";
import bcrypt from 'bcrypt';
import { generateToken } from "../middleware/auth.js";
import redisClient from "../redis/redisClient.js";

const allowedRoles = [
  "principal",
  "class_teacher",
  "teacher",
  "accountant",
  "admin",
  "parent",
  "student",
  "other_staff",
];

const registerUser = async (req, res) => {
  const { email, username, password, first_name, last_name, role, is_staff } = req.body;

  
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
    }
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

  try {
    // Check if user already exists (email)
    const userEmailExists = await pool.query(
      "SELECT id FROM app_users WHERE email = $1",
      [email]
    );
    if (userEmailExists.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Check if username already exists
    const usernameExists = await pool.query(
      "SELECT id FROM app_users WHERE username = $1",
      [username]
    );
    if (usernameExists.rows.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const result = await pool.query(
      `INSERT INTO app_users (
        email,
        username,
        password_hash,
        first_name,
        last_name,
        role,
        is_active,
        is_staff
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        TRUE,
        $7
      )
      RETURNING id, email, username, first_name, last_name, role, is_active, is_staff, created_at
      `,
      [email, username, hashedPassword, first_name, last_name, role, is_staff]
    );

    const newUser = result.rows[0];

    return res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    console.error("Error registering user:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};



const loginUser = async (req, res) => {

    // redis disabled
    if (redisClient) {
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await redisClient.set(`refresh:${user.id}`, hashedRefresh, {
        EX: 60 * 60 * 24 * 7,
    });
    }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const result = await pool.query(
      "SELECT * FROM app_users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Incorrect email or password" });
    }

    const user = result.rows[0];

    // Optionally check active flag
    // if (!user.is_active) {
    //   return res.status(403).json({ message: "User is inactive" });
    // }

    // Check if password is correct
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Incorrect email or password" });
    }

    // Generate tokens
    const accessToken = generateToken(user.id, "15m", "access");
    const refreshToken = generateToken(user.id, "7d", "refresh");

    // Store hashed refresh token in Redis
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await redisClient.set(`refresh:${user.id}`, hashedRefresh, {
      EX: 60 * 60 * 24 * 7,
    });

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


const logoutUser = async (req, res) => {

    // redis disabled
    if (redisClient && refreshToken) {
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);
        await redisClient.del(`refresh:${decoded.userId}`);
    } catch (err) {
        // ignore
    }
    }
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(200).json({ message: "Logged out (no token provided)" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);
    await redisClient.del(`refresh:${decoded.userId}`);
  } catch (err) {
    // ignore invalid/expired token
  }

  return res.status(200).json({ message: "Logged out successfully" });
};


const refreshUserToken = async (req, res) =>
{
    if (!redisClient) {
        return res.status(503).json({ message: "Refresh tokens disabled (no Redis)" });
    }
    
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token required" });
    }

    let userId;
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);
        userId = decoded.userId;
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    try {
        // Check if this refresh token is still valid in Redis
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

        // Token Rotation: Invalidate old, create new
        await redisClient.del(`refresh:${userId}`);

        const newAccessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET_ACCESS,
        { expiresIn: "15m" }
        );

        const newRefreshToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET_REFRESH,
        { expiresIn: "7d" }
        );

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

export { registerUser,
    loginUser, 
    logoutUser,
    refreshUserToken,
 };
