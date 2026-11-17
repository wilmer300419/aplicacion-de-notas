import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/errors";

/** Protección CSRF por "double submit cookie": el token va en cookie y en cada formulario. */
export function csrf(req: Request, res: Response, next: NextFunction): void {
  let token = req.cookies?.csrf as string | undefined;
  if (!token) {
    token = crypto.randomBytes(24).toString("hex");
    res.cookie("csrf", token, { httpOnly: true, sameSite: "lax", secure: req.secure });
  }
  res.locals.csrfToken = token;

  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    const sent = String(req.body?._csrf ?? "");
    const a = Buffer.from(sent);
    const b = Buffer.from(token);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return next(new HttpError(403, "Tu sesión de formulario expiró. Recarga la página e inténtalo de nuevo."));
    }
  }
  next();
}
