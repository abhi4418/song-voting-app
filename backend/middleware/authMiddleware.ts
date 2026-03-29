import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../env";

declare global {
  namespace Express {
    interface Request {
      userId: string;
      role: Role;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string" || !decoded.id || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    req.userId = decoded.id as string;
    req.role = decoded.role as Role;
    next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};
