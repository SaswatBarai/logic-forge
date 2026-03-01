import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// 1. Import the cached connection manager from your db workspace
import { getModels } from "@logicforge/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // 2. Destructure UserModel. This safely reuses the cached MongoDB connection!
        const { UserModel } = await getModels();

        // 3. Query the user. Using .lean() makes it faster by returning a plain JS object.
        const user = await UserModel.findOne({ email }).lean();

        if (!user || !user.passwordHash) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // 4. Compare the provided password with the stored hash using bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash as string);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // 5. Generate the short-lived Access Token (15 minutes)
        const accessToken = jwt.sign(
            {
                userId: String(user._id),
                role: user.role || "Candidate"
            },
            process.env.JWT_SECRET!,
            { expiresIn: "15m" }
        );

        // 6. Generate the long-lived Refresh Token (7 days)
        const refreshToken = jwt.sign(
            { userId: String(user._id) },
            process.env.REFRESH_SECRET!,
            { expiresIn: "7d" }
        );

        // 7. Return the tokens
        return NextResponse.json({
            accessToken,
            refreshToken,
            user: {
                id: String(user._id),
                name: user.name,
                email: user.email,
                role: user.role || "Candidate"
            }
        }, { status: 200 });

    } catch (error) {
        console.error("[AUTH_LOGIN_ERROR]:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
