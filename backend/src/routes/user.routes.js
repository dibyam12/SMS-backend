import express from 'express';
import { loginUser, logoutUser, refreshUserToken, registerUser } from '../controllers/authController.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import  authMiddleware  from '../middleware/auth.js';
import userController from '../controllers/userController.js';


const userRouter = express.Router();

// User Routes
userRouter.post('/register',registerUser)
userRouter.post('/login',loginLimiter,loginUser)
userRouter.post('/logout',logoutUser);
userRouter.post('/refresh-token',refreshUserToken);


// User profile routes
userRouter.get("/me", authMiddleware, userController.getMe);
userRouter.patch("/me", authMiddleware, userController.updateMe);

// Optional admin route
// userRouter.get("/", authMiddleware, requireAdmin, userController.listUsersByRole);

export default userRouter;