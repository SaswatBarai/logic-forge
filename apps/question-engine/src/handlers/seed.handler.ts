import { Request, Response, NextFunction } from "express";
import * as seedService from "../services/seed.service";

export const seedChallenges = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await seedService.seedChallenges();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
