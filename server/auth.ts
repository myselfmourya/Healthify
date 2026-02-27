import { type Express, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "healthify-secret-key-development-only";
const TOKEN_EXPIRY = "7d"; // 7 days

// In-memory store (replace with DB later)
export const users = new Map<string, any>();

// Middleware to protect routes
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Malformed token" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        // Attach to request
        (req as any).user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

export const registerAuthRoutes = (app: Express) => {
    // ─── Register ──────────────────────────────────────────────
    app.post("/api/auth/register", async (req: Request, res: Response) => {
        try {
            const { name, phone, password, profile } = req.body;
            if (!name || !phone || !password) {
                return res.status(400).json({ error: "Name, phone, and password required" });
            }

            if (users.has(phone)) {
                return res.status(409).json({ error: "User with this phone already exists" });
            }

            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            const userId = "user_" + Date.now().toString(36);
            const newUser = {
                id: userId,
                name,
                phone,
                passwordHash,
                profile: profile || {},
            };

            users.set(phone, newUser);

            const token = jwt.sign({ id: userId, phone, name }, JWT_SECRET, {
                expiresIn: TOKEN_EXPIRY,
            });

            res.status(201).json({ message: "Registered successfully", token, user: { id: userId, name, phone, profile: newUser.profile } });
        } catch (err: any) {
            res.status(500).json({ error: err.message || "Registration failed" });
        }
    });

    // ─── Login ─────────────────────────────────────────────────
    app.post("/api/auth/login", async (req: Request, res: Response) => {
        try {
            const { phone, password } = req.body;
            if (!phone || !password) {
                return res.status(400).json({ error: "Phone and password required" });
            }

            const user = users.get(phone);
            if (!user) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const token = jwt.sign({ id: user.id, phone, name: user.name }, JWT_SECRET, {
                expiresIn: TOKEN_EXPIRY,
            });

            res.json({ message: "Logged in successfully", token, user: { id: user.id, name: user.name, phone, profile: user.profile } });
        } catch (err: any) {
            res.status(500).json({ error: err.message || "Login failed" });
        }
    });

    // ─── Setup / Update Profile ────────────────────────────────
    app.post("/api/user/profile", authMiddleware, (req: Request, res: Response) => {
        try {
            const { profile } = req.body;
            const currentUser = (req as any).user;

            const user = users.get(currentUser.phone);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            user.profile = { ...user.profile, ...profile };
            users.set(currentUser.phone, user);

            res.json({ message: "Profile updated", profile: user.profile });
        } catch (err: any) {
            res.status(500).json({ error: err.message || "Update failed" });
        }
    });

    // ─── Get Profile ────────────────────────────────
    app.get("/api/user/profile", authMiddleware, (req: Request, res: Response) => {
        try {
            const currentUser = (req as any).user;
            const user = users.get(currentUser.phone);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            res.json({ profile: user.profile });
        } catch (err: any) {
            res.status(500).json({ error: err.message || "Get profile failed" });
        }
    });
};
