import type { NextFunction, Request, Response } from "express";

import { COOKIE_NAME } from "./auth.js";
import { getAccountFromSession } from "../services/auth.service.js";

export type AuthenticatedAccount = {
  id: string;
  profile: unknown;
};

export interface AuthenticatedRequest extends Request {
  account?: AuthenticatedAccount;
}

export async function authenticate(
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

    const result = await getAccountFromSession(token);

    if (!result) {
      res.status(401).json({
        message: "Session expired. Please login again.",
      });

      return;
    }

    req.account = result.account;

    next();
  } catch (error) {
    next(error);
  }
}