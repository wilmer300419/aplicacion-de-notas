import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import path from "path";
import { env } from "./config/env";
import { loadUser } from "./middleware/auth";
import { csrf } from "./middleware/csrf";
import { errorHandler, notFound } from "./middleware/error";
import { flash } from "./middleware/flash";
import { router } from "./routes";
import { formatScore, MAX_SCORE, PASS_SCORE, statusOf } from "./utils/grades";

export function createApp() {
  const app = express();
  const root = path.join(__dirname, "..");

  app.set("trust proxy", 1); // detrás de Render, Railway, Nginx, etc.
  app.set("view engine", "ejs");
  app.set("views", path.join(root, "views"));
  app.disable("x-powered-by");

  app.locals.formatScore = formatScore;
  app.locals.statusOf = statusOf;
  app.locals.PASS_SCORE = PASS_SCORE;
  app.locals.MAX_SCORE = MAX_SCORE;

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'"],
          "style-src": ["'self'"],
          "img-src": ["'self'", "data:"],
          "form-action": ["'self'"],
          "upgrade-insecure-requests": null, // permite probar por http en una red local
        },
      },
    })
  );
  app.use(express.static(path.join(root, "public"), { maxAge: env.isProd ? "7d" : 0 }));
  app.use(express.urlencoded({ extended: false, limit: "10kb" }));
  app.use(cookieParser());
  app.use(loadUser);
  app.use(flash);
  app.use(csrf);

  app.use(router);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
