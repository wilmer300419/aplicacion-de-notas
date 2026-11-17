import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { env } from "./env";

fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });

export const db = new Database(env.dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// El esquema se crea solo (idempotente): no hace falta ejecutar migraciones a mano.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS courses (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT
  );
  CREATE TABLE IF NOT EXISTS enrollments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (course_id, student_id)
  );
  CREATE TABLE IF NOT EXISTS grades (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    score         REAL NOT NULL CHECK (score BETWEEN 0 AND 5),
    weight        REAL NOT NULL CHECK (weight > 0 AND weight <= 100),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
  CREATE INDEX IF NOT EXISTS idx_grades_enrollment ON grades(enrollment_id);
`);

/** Carga datos de ejemplo solo si la base está vacía y SEED_DEMO=true. */
export function seedDemoData(): void {
  if (!env.seedDemo) return;
  const { total } = db.prepare("SELECT COUNT(*) AS total FROM users").get() as { total: number };
  if (total > 0) return;

  const hash = bcrypt.hashSync("Demo1234!", 10);
  const insertUser = db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
  const insertCourse = db.prepare("INSERT INTO courses (code, name, teacher_id) VALUES (?, ?, ?)");
  const insertEnrollment = db.prepare("INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)");
  const insertGrade = db.prepare("INSERT INTO grades (enrollment_id, title, score, weight) VALUES (?, ?, ?, ?)");

  db.transaction(() => {
    const t1 = Number(insertUser.run("Laura Gómez", "profesor@demo.edu", hash, "teacher").lastInsertRowid);
    const t2 = Number(insertUser.run("Carlos Ruiz", "profesor2@demo.edu", hash, "teacher").lastInsertRowid);
    const students = [
      ["Ana Torres", "estudiante@demo.edu"],
      ["Luis Pérez", "luis@demo.edu"],
      ["Sofía Ramírez", "sofia@demo.edu"],
      ["Mateo Díaz", "mateo@demo.edu"],
    ].map(([n, e]) => Number(insertUser.run(n, e, hash, "student").lastInsertRowid));

    const calc = Number(insertCourse.run("MAT201", "Cálculo Vectorial", t1).lastInsertRowid);
    const bd = Number(insertCourse.run("SIS310", "Bases de Datos", t1).lastInsertRowid);
    const sw = Number(insertCourse.run("SIS320", "Ingeniería de Software", t2).lastInsertRowid);

    const enroll = (course: number, student: number) => Number(insertEnrollment.run(course, student).lastInsertRowid);
    const [a, l, s, m] = students;
    const e1 = enroll(calc, a), e2 = enroll(calc, l), e3 = enroll(calc, s);
    const e4 = enroll(bd, a), e5 = enroll(bd, m);
    const e6 = enroll(sw, a), e7 = enroll(sw, l), e8 = enroll(sw, s), e9 = enroll(sw, m);

    insertGrade.run(e1, "Parcial 1", 4.2, 30); insertGrade.run(e1, "Taller integrales", 4.8, 20);
    insertGrade.run(e2, "Parcial 1", 2.4, 30); insertGrade.run(e2, "Taller integrales", 3.1, 20);
    insertGrade.run(e3, "Parcial 1", 3.6, 30);
    insertGrade.run(e4, "Modelo E-R", 4.5, 25); insertGrade.run(e4, "Taller SQL", 3.9, 25);
    insertGrade.run(e5, "Modelo E-R", 3.0, 25);
    insertGrade.run(e6, "Sprint 1", 4.0, 40);
    insertGrade.run(e7, "Sprint 1", 3.4, 40);
    insertGrade.run(e8, "Sprint 1", 4.7, 40);
    insertGrade.run(e9, "Sprint 1", 2.8, 40);
  })();
  console.log("Datos de ejemplo cargados (contraseña de todos: Demo1234!).");
}
