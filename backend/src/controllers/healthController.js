// src/controllers/healthController.js
import healthRepository from "../models/repositories/dev/healthRepository.js";

const getHealth = async (req, res, next) => {
  try {
    const summary = await healthRepository.getHealthSummary();
    return res.json(summary);
  } catch (err) {
    return next(err);
  }
};

const healthController = {
  getHealth,
};

export default healthController;
