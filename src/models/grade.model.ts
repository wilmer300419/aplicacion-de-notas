import { db } from "../config/database";
import { GradeRow } from "../utils/grades";

export interface GradeInput {
  title: string;
  score: number;
  weight: number;
}

export const GradeModel = {
  listByEnrollments(ids: number[]): GradeRow[] {
    if (ids.length === 0) return [];
    const marks = ids.map(() => "?").join(",");
    return db
      .prepare(
        `SELECT id, enrollment_id, title, score, weight, created_at
           FROM grades WHERE enrollment_id IN (${marks}) ORDER BY created_at, id`
      )
      .all(...ids) as GradeRow[];
  },
  enrollmentInCourse(enrollmentId: number, courseId: number): boolean {
    return !!db.prepare("SELECT 1 FROM enrollments WHERE id = ? AND course_id = ?").get(enrollmentId, courseId);
  },
  findInCourse(gradeId: number, courseId: number): { id: number; enrollment_id: number } | undefined {
    return db
      .prepare(
        `SELECT g.id, g.enrollment_id FROM grades g
           JOIN enrollments e ON e.id = g.enrollment_id
          WHERE g.id = ? AND e.course_id = ?`
      )
      .get(gradeId, courseId) as { id: number; enrollment_id: number } | undefined;
  },
  weightUsed(enrollmentId: number, excludeGradeId = 0): number {
    const row = db
      .prepare("SELECT COALESCE(SUM(weight), 0) AS total FROM grades WHERE enrollment_id = ? AND id <> ?")
      .get(enrollmentId, excludeGradeId) as { total: number };
    return row.total;
  },
  insert(enrollmentId: number, g: GradeInput): void {
    db.prepare("INSERT INTO grades (enrollment_id, title, score, weight) VALUES (?, ?, ?, ?)").run(
      enrollmentId, g.title, g.score, g.weight
    );
  },
  update(id: number, g: GradeInput): void {
    db.prepare("UPDATE grades SET title = ?, score = ?, weight = ? WHERE id = ?").run(g.title, g.score, g.weight, id);
  },
  remove(id: number): void {
    db.prepare("DELETE FROM grades WHERE id = ?").run(id);
  },
};
