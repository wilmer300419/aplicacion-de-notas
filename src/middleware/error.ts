import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/errors";

export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, "No encontramos la página que buscas."));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const status = err instanceof HttpError ? err.status : 500;
  if (status === 401 && req.method === "GET") {
    res.redirect("/login");
    return;
  }
  if (status === 500) console.error(err);
  const message = err instanceof HttpError ? err.message : "Algo salió mal de nuestro lado. Inténtalo de nuevo en unos minutos.";
  res.status(status).render("error", { title: "Ups", status, message });
}
