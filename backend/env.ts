const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required to start the backend.");
}

const parsedPort = Number(process.env.PORT ?? "3001");

export const PORT = Number.isFinite(parsedPort) ? parsedPort : 3001;
export const JWT_SECRET = jwtSecret;
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (IS_PRODUCTION && ALLOWED_ORIGINS.length === 0) {
  throw new Error("CORS_ORIGIN must be set in production.");
}
