import express from 'express';
import { loginUser, logoutUser, refreshUserToken, registerUser } from '../controllers/authController.js';
import { loginLimiter } from '../middleware/rateLimit.js';


const userRouter = express.Router();

// User Routes
userRouter.post('/register',registerUser)
userRouter.post('/login',loginLimiter,loginUser)
userRouter.post('/logout',logoutUser);
userRouter.post('/refresh-token',refreshUserToken);

export default userRouter;