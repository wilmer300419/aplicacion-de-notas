import { NextFunction, Request, Response } from "express";
import { AuthUser, userFromToken } from "../services/auth.service";
import { Role } from "../models/user.model";
import { HttpError } from "../utils/errors";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const homeFor = (role: Role) => (role === "teacher" ? "/teacher" : "/student");

export function loadUser(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;
  const user = token ? userFromToken(token) : null;
  if (token && !user) res.clearCookie("token");
  req.user = user ?? undefined;
  res.locals.user = user;
  next();
}

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new HttpError(401, "Inicia sesión para continuar."));
    if (req.user.role !== role) return next(new HttpError(403, "No tienes permiso para ver esta página."));
    next();
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(new HttpError(401, "Inicia sesión para continuar."));
  next();
}
