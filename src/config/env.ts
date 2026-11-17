import "dotenv/config";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "notas.sqlite");

/** Usa JWT_SECRET si existe; si no, genera una clave y la persiste junto a la base de datos. */
function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const file = path.join(path.dirname(dbPath), ".jwt_secret");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
  const secret = crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(file, secret, { mode: 0o600 });
  return secret;
}

export const env = {
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? 3000),
  dbPath,
  jwtSecret: resolveJwtSecret(),
  seedDemo: (process.env.SEED_DEMO ?? "true").toLowerCase() === "true",
};
