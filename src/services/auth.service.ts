import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Role, User, UserModel } from "../models/user.model";

export interface AuthUser {
  id: number;
  name: string;
  role: Role;
}

export const TOKEN_TTL_SECONDS = 8 * 60 * 60;

// Hash de relleno: evita revelar por tiempo de respuesta si el correo existe.
const DUMMY_HASH = bcrypt.hashSync("relleno-no-valido", 10);

export async function authenticate(email: string, password: string): Promise<User | null> {
  const user = UserModel.findByEmail(email);
  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  return user && valid ? user : null;
}

export function signToken(user: User): string {
  return jwt.sign({ sub: String(user.id) }, env.jwtSecret, { expiresIn: TOKEN_TTL_SECONDS });
}

/** Valida el token y recarga al usuario desde la base (rol y cuenta siempre actuales). */
export function userFromToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    const user = UserModel.findById(Number(payload.sub));
    return user ? { id: user.id, name: user.name, role: user.role } : null;
  } catch {
    return null;
  }
}
