import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', router);

router.get('/', (req, res) => {
  res.json({ message: 'School Management API working' });
});

export default app;
