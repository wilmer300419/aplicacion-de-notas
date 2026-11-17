import { db } from "../config/database";

export type Role = "student" | "teacher";

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
}

export const UserModel = {
  findByEmail(email: string): User | undefined {
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
  },
  findById(id: number): User | undefined {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
  },
  create(data: { name: string; email: string; passwordHash: string; role: Role }): number {
    const info = db
      .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)")
      .run(data.name, data.email, data.passwordHash, data.role);
    return Number(info.lastInsertRowid);
  },
};
