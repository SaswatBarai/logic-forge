import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as challengeService from "../services/challenge.service";
import {
    ChallengeQuerySchema,
    RandomChallengeQuerySchema,
    SubmitAnswerSchema
} from "@logicforge/types";

// Helper to wrap async handlers and pass errors to next()
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export const getChallenges = asyncHandler(async (req: Request, res: Response) => {
    const query = ChallengeQuerySchema.parse(req.query);
    const result = await challengeService.getChallenges(query);
    res.status(200).json({ success: true, data: result });
});

export const getRandomChallenge = asyncHandler(async (req: Request, res: Response) => {
    const query = RandomChallengeQuerySchema.parse({
        ...req.query,
        // ensure excludeIds is an array
        excludeIds: req.query.excludeIds ? (Array.isArray(req.query.excludeIds) ? req.query.excludeIds : [req.query.excludeIds]) : [],
    });
    const result = await challengeService.getRandomChallenge(query);

    if (!result) {
        res.status(404).json({
            success: false,
            error: { code: "NOT_FOUND", message: "No challenges available matching criteria" }
        });
        return;
    }

    res.status(200).json({ success: true, data: result });
});

export const getChallengeById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await challengeService.getChallengeById(id);

    if (!result) {
        res.status(404).json({
            success: false,
            error: { code: "NOT_FOUND", message: "Challenge not found" }
        });
        return;
    }

    res.status(200).json({ success: true, data: result });
});

export const validateAnswer = asyncHandler(async (req: Request, res: Response) => {
    // Add simple validation route that the game-API and Code Runner will orchestrate with
    const { challengeId, code } = req.body;

    if (!challengeId || !code) {
        res.status(400).json({
            success: false,
            error: { code: "VALIDATION_ERROR", message: "challengeId and code are required" }
        });
        return;
    }

    const result = await challengeService.validateAnswer(challengeId, code);
    res.status(200).json({ success: true, data: result });
});
