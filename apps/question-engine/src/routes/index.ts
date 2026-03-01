import { Router } from "express";
import healthRoutes from "./health.routes";
import challengeRoutes from "./challenge.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/challenges", challengeRoutes);

export default router;
