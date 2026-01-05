
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import app from './src/app.js';
import pool from './src/config/db.js';
const PORT = process.env.PORT || 5000;

// Test PostgreSQL connection
pool.connect()
  .then(() => console.log('✅ Database connection successful'))
  .catch((err) => {
    console.error('❌ Database connection error:', err.stack);
    process.exit(1);
  });

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
