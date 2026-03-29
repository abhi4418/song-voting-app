import cors from "cors";
import express from "express";
import { authMiddleware } from "./middleware/authMiddleware";
import { ALLOWED_ORIGINS, IS_PRODUCTION, PORT } from "./env";
import authRouter from "./routes/authRouter";
import playListRouter from "./routes/playListRouter";
import songRouter from "./routes/songRouter";

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: false,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (IS_PRODUCTION) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
});

app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  res.status(200).send("Healthy server");
});

app.use("/api/auth", authRouter);
app.use("/api/playlist", authMiddleware, playListRouter);
app.use("/api/song", authMiddleware, songRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
