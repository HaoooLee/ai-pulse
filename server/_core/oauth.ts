import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

/**
 * Preset accounts for AI Pulse.
 * Passwords are bcrypt hashed. To add more accounts, generate new hashes.
 */
const PRESET_USERS: Array<{ username: string; hash: string; displayName: string }> = [
  {
    username: "admin",
    hash: "$2b$10$QgSkU.lC4Zi/ifb0D6tiTOe/aLHMevl1uUCqSNNv56EnWGDWYFUQW",
    displayName: "Admin",
  },
  {
    username: "charles",
    hash: "$2b$10$sa0ANFe3wSwgvCzVhWMwNuPeqEHOzIfSoIHjETBuVvGjV4pd6rLcW",
    displayName: "Charles",
  },
  {
    username: "user01",
    hash: "$2b$10$an4gkWkn8HCLQH8ZAEmimOBPICGRpGOsfoclxZTl2wtZzfCiAXb9G",
    displayName: "User 01",
  },
  {
    username: "user02",
    hash: "$2b$10$yd0wPFKtAYF/I77W2XbAPOsc8eLd070292.JxCAm997/BTf.MH92i",
    displayName: "User 02",
  },
  {
    username: "user03",
    hash: "$2b$10$y0lcylZUTGS19gaogisNmO6NBYLRQilfQ.FrPi.EaaEy1smiZgfa2",
    displayName: "User 03",
  },
  {
    username: "user04",
    hash: "$2b$10$vnF3..7fQQ.jqLcAlsf0Q.Uu0kJAhRBU2gXe76Z/eUbJREDbIUSL.",
    displayName: "User 04",
  },
  {
    username: "user05",
    hash: "$2b$10$9RvdXjUlWw6E7SZDnAbh3OGFWR8l2Eig865O8JJtNiB0v557aAmAW",
    displayName: "User 05",
  },
  {
    username: "reader01",
    hash: "$2b$10$CYtU44/WJa55riPh3vIQT.hu0jZig4cXM/WDACPYT6mAX/ZVb0zsG",
    displayName: "Reader 01",
  },
  {
    username: "reader02",
    hash: "$2b$10$BKJlg6w5tKdkBD.i4p5Kh.xq7mgcwtpg7/2cgMfbK4uP5L2.zs3sK",
    displayName: "Reader 02",
  },
  {
    username: "reader03",
    hash: "$2b$10$dwKIeLDq9LHxTRTv3qtx7uUcxtkeMvlv/pwwtHmEikSBktPeoO40.",
    displayName: "Reader 03",
  },
];

export function registerOAuthRoutes(app: Express) {
  /**
   * POST /api/auth/login
   * Body: { username: string, password: string }
   * Returns: 200 with user info on success, 401 on failure
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    // Find preset user (case-insensitive username)
    const presetUser = PRESET_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!presetUser) {
      // Use constant time to prevent username enumeration
      await bcrypt.compare(password, "$2b$10$invalidhashtopreventtimingattacks00000000000000000000");
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const isValid = await bcrypt.compare(password, presetUser.hash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    // Upsert user in database
    const openId = `local_${presetUser.username}`;
    await db.upsertUser({
      openId,
      name: presetUser.displayName,
      email: null,
      loginMethod: "password",
      lastSignedIn: new Date(),
    });

    // Create session JWT
    const sessionToken = await sdk.createSessionToken(openId, {
      name: presetUser.displayName,
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    res.json({ success: true, user: { username: presetUser.username, name: presetUser.displayName } });
  });

  // Keep backward compatibility - redirect old OAuth routes to login
  app.get("/api/auth/github", (_req: Request, res: Response) => {
    res.redirect(302, "/login");
  });

  app.get("/api/auth/callback", (_req: Request, res: Response) => {
    res.redirect(302, "/login");
  });

  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect(302, "/login");
  });
}
