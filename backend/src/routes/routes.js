import express from 'express';
import userRouter from './user.routes.js';

const router = express.Router();



router.get('/', (req, res) => {
  res.json({ message: 'Test route working' });
}); 

router.get('/user',userRouter)

export default router;
