import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { prisma } from "./lib/prisma.js";

import {
  COOKIE_NAME,
  requireAuth,
  type AuthenticatedRequest,
} from "./middleware/auth.js";

import {
  createFirstAccount,
  getSetupStatus,
  loginWithPin,
  logoutSession,
} from "./services/auth.service.js";

import {
  requestPinReset,
  verifyPinResetOtp,
  resetPin,
  requestChangePinOtp,
  verifyChangePinOtp,
  changePin,
} from "./services/otp.service.js";

import profileRoutes from "./routes/profile.js";
import dreamRoutes from "./routes/dreams.js";
import memoryRoutes from "./routes/memory.routes.js";

const app = express();

const PORT = Number(
  process.env.PORT ?? 4000,
);

const HOST =
  process.env.HOST ?? "0.0.0.0";

const CLIENT_URL =
  process.env.CLIENT_URL ??
  "http://localhost:5173";

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(cookieParser());

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get(
  "/api/health",
  async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      res.json({
        ok: true,
        service: "sakuri-server",
        database: "connected",
      });
    } catch (error) {
      console.error(
        "Health check failed:",
        error,
      );

      res.status(503).json({
        ok: false,
        service: "sakuri-server",
        database: "disconnected",
      });
    }
  },
);

// --------------------------------------------------
// Setup status
// --------------------------------------------------

app.get(
  "/api/setup/status",
  async (_req, res, next) => {
    try {
      const status =
        await getSetupStatus();

      res.json(status);
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// FIRST-TIME ACCOUNT CREATION
// --------------------------------------------------

app.post(
  "/api/auth/first-setup",
  async (req, res, next) => {
    try {
      const {
        email,
        pin,
      } = req.body;

      const result =
        await createFirstAccount({
          email,
          pin,
        });

      res.cookie(
        COOKIE_NAME,
        result.token,
        {
          httpOnly: true,

          secure:
            process.env.NODE_ENV ===
            "production",

          sameSite:
            process.env.NODE_ENV ===
            "production"
              ? "none"
              : "lax",

          maxAge:
            365 *
            24 *
            60 *
            60 *
            1000,

          path: "/",
        },
      );

      res.status(201).json({
        message:
          "Account created. Create your profile next.",

        account:
          result.account,
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// PROFILES AVAILABLE FOR LOGIN
// --------------------------------------------------

app.get(
  "/api/auth/profiles",
  async (_req, res, next) => {
    try {
      const profiles =
        await prisma.profile.findMany({
          select: {
            id: true,
            accountId: true,
            username: true,
            profileImage: true,
            description: true,
          },

          orderBy: {
            createdAt: "asc",
          },
        });

      res.json({
        profiles,
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

app.post(
  "/api/auth/login",
  async (req, res, next) => {
    try {
      const {
        accountId,
        pin,
      } = req.body;

      const result =
        await loginWithPin(
          accountId,
          pin,
        );

      res.cookie(
        COOKIE_NAME,
        result.token,
        {
          httpOnly: true,

          secure:
            process.env.NODE_ENV ===
            "production",

          sameSite:
            process.env.NODE_ENV ===
            "production"
              ? "none"
              : "lax",

          maxAge:
            365 *
            24 *
            60 *
            60 *
            1000,

          path: "/",
        },
      );

      res.json({
        account:
          result.account,
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// FORGOT PIN
// --------------------------------------------------

app.post(
  "/api/auth/forgot-pin",
  async (req, res, next) => {
    try {
      const {
        email,
      } = req.body;

      await requestPinReset(
        email,
      );

      res.json({
        message:
          "If an account exists for that email, a verification code has been sent.",
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// VERIFY FORGOT-PIN OTP
// --------------------------------------------------

app.post(
  "/api/auth/verify-otp",
  async (req, res, next) => {
    try {
      const {
        email,
        otp,
      } = req.body;

      const result =
        await verifyPinResetOtp(
          email,
          otp,
        );

      res.json({
        message:
          "OTP verified.",

        otpId:
          result.otpId,
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// RESET PIN
// --------------------------------------------------

app.post(
  "/api/auth/reset-pin",
  async (req, res, next) => {
    try {
      const {
        otpId,
        newPin,
      } = req.body;

      await resetPin(
        otpId,
        newPin,
      );

      res.json({
        message:
          "PIN changed successfully. Please login again.",
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// CURRENT AUTHENTICATED ACCOUNT
// --------------------------------------------------

app.get(
  "/api/auth/me",
  requireAuth,
  (
    req: AuthenticatedRequest,
    res,
  ) => {
    res.json({
      account:
        req.account,
    });
  },
);

// --------------------------------------------------
// SETTINGS
// SEND CHANGE-PIN OTP
// --------------------------------------------------

app.post(
  "/api/auth/change-pin/send-otp",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
    next,
  ) => {
    try {
      if (!req.account) {
        res.status(401).json({
          message:
            "Authentication required.",
        });

        return;
      }

      const account =
        await prisma.account.findUnique({
          where: {
            id: req.account.id,
          },

          select: {
            email: true,
          },
        });

      if (!account) {
        res.status(401).json({
          message:
            "Authenticated account could not be found.",
        });

        return;
      }

      await requestChangePinOtp(
        account.email,
      );

      res.json({
        message:
          "A verification code has been sent to your registered email.",
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// SETTINGS
// VERIFY CHANGE-PIN OTP
// --------------------------------------------------

app.post(
  "/api/auth/change-pin/verify-otp",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
    next,
  ) => {
    try {
      if (!req.account) {
        res.status(401).json({
          message:
            "Authentication required.",
        });

        return;
      }

      const {
        otp,
      } = req.body;

      const account =
        await prisma.account.findUnique({
          where: {
            id: req.account.id,
          },

          select: {
            email: true,
          },
        });

      if (!account) {
        res.status(401).json({
          message:
            "Authenticated account could not be found.",
        });

        return;
      }

      const result =
        await verifyChangePinOtp(
          account.email,
          otp,
        );

      res.json({
        message:
          "OTP verified.",

        otpId:
          result.otpId,
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// SETTINGS
// CHANGE PIN
// --------------------------------------------------

app.post(
  "/api/auth/change-pin",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
    next,
  ) => {
    try {
      if (!req.account) {
        res.status(401).json({
          message:
            "Authentication required.",
        });

        return;
      }

      const {
        otpId,
        newPin,
      } = req.body;

      await changePin(
        otpId,
        newPin,
      );

      res.clearCookie(
        COOKIE_NAME,
        {
          httpOnly: true,

          secure:
            process.env.NODE_ENV ===
            "production",

          sameSite:
            process.env.NODE_ENV ===
            "production"
              ? "none"
              : "lax",

          path: "/",
        },
      );

      res.json({
        message:
          "PIN changed successfully. Please login again.",
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// PROFILE ROUTES
// --------------------------------------------------

app.use(
  "/api/profile",
  profileRoutes,
);

// --------------------------------------------------
// DREAM ROUTES
// --------------------------------------------------

app.use(
  "/api/dreams",
  dreamRoutes,
);

// --------------------------------------------------
// MEMORY ROUTES
// --------------------------------------------------

app.use(
  "/api/memories",
  memoryRoutes,
);

// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

app.post(
  "/api/auth/logout",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
    next,
  ) => {
    try {
      const token =
        req.cookies?.[
          COOKIE_NAME
        ];

      if (token) {
        await logoutSession(
          token,
        );
      }

      res.clearCookie(
        COOKIE_NAME,
        {
          httpOnly: true,

          secure:
            process.env.NODE_ENV ===
            "production",

          sameSite:
            process.env.NODE_ENV ===
            "production"
              ? "none"
              : "lax",

          path: "/",
        },
      );

      res.json({
        message:
          "Logged out.",
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// 404 HANDLER
// --------------------------------------------------

app.use(
  (_req, res) => {
    res.status(404).json({
      message:
        "Sakuri API route not found.",
    });
  },
);

// --------------------------------------------------
// ERROR HANDLER
// --------------------------------------------------

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(
      "Server error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong.";

    res.status(400).json({
      message,
    });
  },
);

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(
  PORT,
  HOST,
  () => {
    console.log("");

    console.log(
      "🌸 Sakuri server started",
    );

    console.log(
      `→ ${HOST}:${PORT}`,
    );

    console.log(
      `→ Client: ${CLIENT_URL}`,
    );

    console.log("");
  },
);