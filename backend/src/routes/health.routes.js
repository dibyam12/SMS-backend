import healthController from "../controllers/healthController.js";
import { Router } from "express";

const healthRouter = Router();

healthRouter.get("/", healthController.getHealth);

export default healthRouter;
