import type { NextFunction, Request, Response } from "express";

import { getAccountFromSession } from "../services/auth.service.js";

const COOKIE_NAME = "sakuri_session";

export type AuthenticatedRequest = Request & {
  account?: {
    id: string;

    profile: {
      id: string;
      username: string;
      profileImage: string | null;
      description: string | null;
    } | null;
  };

  sessionId?: string;
};

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      res.status(401).json({
        message: "Authentication required.",
      });

      return;
    }

    const session =
      await getAccountFromSession(token);

    if (!session) {
      res.clearCookie(COOKIE_NAME);

      res.status(401).json({
        message: "Session expired.",
      });

      return;
    }

    req.account = session.account;
    req.sessionId = session.sessionId;

    next();
  } catch (error) {
    next(error);
  }
}

export { COOKIE_NAME };