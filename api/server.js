// api/server.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
import bcrypt from "bcryptjs";

// server/db.ts
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// drizzle/schema.ts
import { integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
var roleEnum = pgEnum("role", ["user", "admin"]);
var itemTypeEnum = pgEnum("item_type", ["tweet", "academic"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  /** GitHub OAuth user ID */
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatarUrl: text("avatar_url"),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull()
});
var userArchives = pgTable("user_archives", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemType: itemTypeEnum("item_type").notNull(),
  itemId: varchar("item_id", { length: 128 }).notNull(),
  itemData: text("item_data").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// server/db.ts
var _db = null;
function getDb() {
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!_db && dbUrl) {
    try {
      const sql = neon(dbUrl);
      _db = drizzle(sql);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (existing.length > 0) {
      await db.update(users).set({
        name: user.name ?? existing[0].name,
        email: user.email ?? existing[0].email,
        avatarUrl: user.avatarUrl ?? existing[0].avatarUrl,
        loginMethod: user.loginMethod ?? existing[0].loginMethod,
        lastSignedIn: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.openId, user.openId));
    } else {
      await db.insert(users).values({
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        avatarUrl: user.avatarUrl ?? null,
        loginMethod: user.loginMethod ?? "github",
        role: "user",
        lastSignedIn: /* @__PURE__ */ new Date()
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserArchives(userId) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(userArchives).where(eq(userArchives.userId, userId)).orderBy(userArchives.createdAt);
}
async function addUserArchive(data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(userArchives).values(data);
}
async function removeUserArchive(userId, itemType, itemId) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userArchives).where(
    and(
      eq(userArchives.userId, userId),
      eq(userArchives.itemType, itemType),
      eq(userArchives.itemId, itemId)
    )
  );
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "ai-pulse-secret-key-change-in-production",
  databaseUrl: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // GitHub OAuth
  githubClientId: process.env.GITHUB_CLIENT_ID ?? "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  // App URL for OAuth redirects
  appUrl: process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  // Manus built-in APIs (kept for compatibility)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/sdk.ts
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var SDKServer = class {
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a user openId
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId || "ai-pulse",
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return { openId, appId, name };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const user = await getUserByOpenId(session.openId);
    if (!user) {
      console.warn("[Auth] Valid session but user not found in DB for openId:", session.openId);
      throw ForbiddenError("User not found - please log in again");
    }
    upsertUser({
      openId: user.openId,
      lastSignedIn: /* @__PURE__ */ new Date()
    }).catch((err) => console.warn("[Auth] Failed to update lastSignedIn:", err));
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
var PRESET_USERS = [
  {
    username: "admin",
    hash: "$2b$10$QgSkU.lC4Zi/ifb0D6tiTOe/aLHMevl1uUCqSNNv56EnWGDWYFUQW",
    displayName: "Admin"
  },
  {
    username: "charles",
    hash: "$2b$10$sa0ANFe3wSwgvCzVhWMwNuPeqEHOzIfSoIHjETBuVvGjV4pd6rLcW",
    displayName: "Charles"
  },
  {
    username: "user01",
    hash: "$2b$10$an4gkWkn8HCLQH8ZAEmimOBPICGRpGOsfoclxZTl2wtZzfCiAXb9G",
    displayName: "User 01"
  },
  {
    username: "user02",
    hash: "$2b$10$yd0wPFKtAYF/I77W2XbAPOsc8eLd070292.JxCAm997/BTf.MH92i",
    displayName: "User 02"
  },
  {
    username: "user03",
    hash: "$2b$10$y0lcylZUTGS19gaogisNmO6NBYLRQilfQ.FrPi.EaaEy1smiZgfa2",
    displayName: "User 03"
  },
  {
    username: "user04",
    hash: "$2b$10$vnF3..7fQQ.jqLcAlsf0Q.Uu0kJAhRBU2gXe76Z/eUbJREDbIUSL.",
    displayName: "User 04"
  },
  {
    username: "user05",
    hash: "$2b$10$9RvdXjUlWw6E7SZDnAbh3OGFWR8l2Eig865O8JJtNiB0v557aAmAW",
    displayName: "User 05"
  },
  {
    username: "reader01",
    hash: "$2b$10$CYtU44/WJa55riPh3vIQT.hu0jZig4cXM/WDACPYT6mAX/ZVb0zsG",
    displayName: "Reader 01"
  },
  {
    username: "reader02",
    hash: "$2b$10$BKJlg6w5tKdkBD.i4p5Kh.xq7mgcwtpg7/2cgMfbK4uP5L2.zs3sK",
    displayName: "Reader 02"
  },
  {
    username: "reader03",
    hash: "$2b$10$dwKIeLDq9LHxTRTv3qtx7uUcxtkeMvlv/pwwtHmEikSBktPeoO40.",
    displayName: "Reader 03"
  }
];
function registerOAuthRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }
    const presetUser = PRESET_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    if (!presetUser) {
      await bcrypt.compare(password, "$2b$10$invalidhashtopreventtimingattacks00000000000000000000");
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }
    const isValid = await bcrypt.compare(password, presetUser.hash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }
    const openId = `local_${presetUser.username}`;
    await upsertUser({
      openId,
      name: presetUser.displayName,
      email: null,
      loginMethod: "password",
      lastSignedIn: /* @__PURE__ */ new Date()
    });
    const sessionToken = await sdk.createSessionToken(openId, {
      name: presetUser.displayName,
      expiresInMs: ONE_YEAR_MS
    });
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.json({ success: true, user: { username: presetUser.username, name: presetUser.displayName } });
  });
  app2.get("/api/auth/github", (_req, res) => {
    res.redirect(302, "/login");
  });
  app2.get("/api/auth/callback", (_req, res) => {
    res.redirect(302, "/login");
  });
  app2.get("/api/oauth/callback", (_req, res) => {
    res.redirect(302, "/login");
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z2 } from "zod";
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  archive: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserArchives(ctx.user.id);
    }),
    add: protectedProcedure.input(z2.object({
      itemType: z2.enum(["tweet", "academic"]),
      itemId: z2.string(),
      itemData: z2.string(),
      metadata: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await addUserArchive({
        userId: ctx.user.id,
        itemType: input.itemType,
        itemId: input.itemId,
        itemData: input.itemData,
        metadata: input.metadata ?? null
      });
      return { success: true };
    }),
    remove: protectedProcedure.input(z2.object({
      itemType: z2.enum(["tweet", "academic"]),
      itemId: z2.string()
    })).mutation(async ({ ctx, input }) => {
      await removeUserArchive(ctx.user.id, input.itemType, input.itemId);
      return { success: true };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// api/server.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerOAuthRoutes(app);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var server_default = app;
export {
  server_default as default
};
