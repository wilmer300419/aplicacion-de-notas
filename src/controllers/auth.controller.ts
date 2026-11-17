import { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { homeFor } from "../middleware/auth";
import { authenticate, signToken, TOKEN_TTL_SECONDS } from "../services/auth.service";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1).max(200),
});

const renderLogin = (res: Response, email = "", error?: string) => {
  if (error) res.locals.flash = { type: "error", message: error };
  return res.render("login", { title: "Iniciar sesión", email, showDemo: env.seedDemo });
};

export function showLogin(req: Request, res: Response): void {
  if (req.user) return res.redirect(homeFor(req.user.role));
  renderLogin(res);
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400);
    return renderLogin(res, String(req.body?.email ?? ""), "Escribe un correo válido y tu contraseña.");
  }
  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    res.status(401);
    return renderLogin(res, parsed.data.email, "Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.");
  }
  res.cookie("token", signToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: req.secure,
    maxAge: TOKEN_TTL_SECONDS * 1000,
  });
  res.redirect(homeFor(user.role));
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie("token");
  res.redirect("/login");
}
