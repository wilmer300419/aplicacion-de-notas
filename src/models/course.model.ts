import { db } from "../config/database";

export interface Course {
  id: number;
  code: string;
  name: string;
  teacher_id: number;
}
export interface CourseSummary extends Course {
  student_count: number;
}
export interface RosterEntry {
  enrollment_id: number;
  student_id: number;
  name: string;
  email: string;
}
export interface StudentCourse {
  course_id: number;
  enrollment_id: number;
  code: string;
  name: string;
  teacher_name: string;
}

export const CourseModel = {
  listByTeacher(teacherId: number): CourseSummary[] {
    return db
      .prepare(
        `SELECT c.*, COUNT(e.id) AS student_count
           FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id
          WHERE c.teacher_id = ? GROUP BY c.id ORDER BY c.name`
      )
      .all(teacherId) as CourseSummary[];
  },
  /** Devuelve el curso solo si pertenece al profesor (control de acceso a nivel de datos). */
  findOwned(courseId: number, teacherId: number): Course | undefined {
    return db.prepare("SELECT * FROM courses WHERE id = ? AND teacher_id = ?").get(courseId, teacherId) as
      | Course
      | undefined;
  },
  roster(courseId: number): RosterEntry[] {
    return db
      .prepare(
        `SELECT e.id AS enrollment_id, u.id AS student_id, u.name, u.email
           FROM enrollments e JOIN users u ON u.id = e.student_id
          WHERE e.course_id = ? ORDER BY u.name`
      )
      .all(courseId) as RosterEntry[];
  },
  listForStudent(studentId: number): StudentCourse[] {
    return db
      .prepare(
        `SELECT c.id AS course_id, e.id AS enrollment_id, c.code, c.name, t.name AS teacher_name
           FROM enrollments e
           JOIN courses c ON c.id = e.course_id
           JOIN users t ON t.id = c.teacher_id
          WHERE e.student_id = ? ORDER BY c.name`
      )
      .all(studentId) as StudentCourse[];
  },
};
