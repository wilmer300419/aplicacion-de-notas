import { NextFunction, Request, Response } from "express";

export type FlashType = "success" | "error";

/** Mensaje de un solo uso que sobrevive a una redirección (cookie de 10 s). */
export function setFlash(res: Response, type: FlashType, message: string): void {
  res.cookie("flash", JSON.stringify({ type, message }), { httpOnly: true, sameSite: "lax", maxAge: 10_000 });
}

export function flash(req: Request, res: Response, next: NextFunction): void {
  res.locals.flash = null;
  const raw = req.cookies?.flash as string | undefined;
  if (raw) {
    try {
      res.locals.flash = JSON.parse(raw);
    } catch {
      /* cookie manipulada: se ignora */
    }
    res.clearCookie("flash");
  }
  next();
}
