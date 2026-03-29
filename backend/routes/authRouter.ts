import express from "express";
import jwt from "jsonwebtoken";
import { signInSchema, signUpSchema } from "../../common/authTypes";
import prisma from "../db";
import { JWT_SECRET } from "../env";

const authRouter = express.Router();

const buildToken = (user: { id: string; email: string; role: "USER" | "CREATOR" }) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

authRouter.post("/sign-up", async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const role = req.body?.role;
    const parsed = signUpSchema.safeParse({ email, password, role });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid request",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await Bun.password.hash(password, "bcrypt");
    const user = await prisma.user.create({
      data: {
        email,
        role,
        password: hashedPassword,
      },
    });

    const token = buildToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

authRouter.post("/sign-in", async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const role = req.body?.role;
    const parsed = signInSchema.safeParse({ email, password, role });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid request",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user || user.role !== role) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await Bun.password.verify(password, user.password, "bcrypt");

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = buildToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: "User signed in successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

authRouter.post("/verify-token", async (req, res) => {
  const tokenFromHeader = req.headers.authorization?.split(" ")[1];
  const tokenFromBody =
    typeof req.body?.token === "string" ? req.body.token.replace(/^Bearer\s+/i, "") : "";
  const token = tokenFromHeader || tokenFromBody;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Token is required",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string" || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token verified successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
});

export default authRouter;
