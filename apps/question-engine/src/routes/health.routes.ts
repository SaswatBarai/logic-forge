import { Router } from "express";

const router: Router = Router();

router.get("/", (req, res) => {
    // Ideally, query DB to check health
    res.status(200).json({ status: "ok", service: "question-engine" });
});

export default router;
