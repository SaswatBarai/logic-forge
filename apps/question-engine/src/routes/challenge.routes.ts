import { Router } from "express";
import {
    getChallenges,
    getChallengeById,
    getRandomChallenge,
    validateAnswer
} from "../handlers/challenge.handler";
import { seedChallenges } from "../handlers/seed.handler";

const router = Router();

// GET /api/v1/challenges
router.get("/", getChallenges);

// GET /api/v1/challenges/random
router.get("/random", getRandomChallenge);

// POST /api/v1/challenges/validate
router.post("/validate", validateAnswer);

// GET /api/v1/challenges/:id
router.get("/:id", getChallengeById);

// POST /api/v1/challenges/seed
router.post("/seed", seedChallenges);

export default router;
