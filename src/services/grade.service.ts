import { CourseModel, Course, StudentCourse } from "../models/course.model";
import { GradeInput, GradeModel } from "../models/grade.model";
import { GradeRow, totalWeight, weightedAverage } from "../utils/grades";

export type SaveResult = { ok: true } | { ok: false; error: string };

export interface StudentGradebook {
  enrollmentId: number;
  studentId: number;
  name: string;
  email: string;
  grades: GradeRow[];
  average: number | null;
  weightUsed: number;
}

export interface CourseReport extends StudentCourse {
  grades: GradeRow[];
  average: number | null;
  weightUsed: number;
}

/** Libro de notas de un curso (solo si es del profesor). */
export function getGradebook(courseId: number, teacherId: number): { course: Course; students: StudentGradebook[] } | null {
  const course = CourseModel.findOwned(courseId, teacherId);
  if (!course) return null;
  const roster = CourseModel.roster(courseId);
  const grades = GradeModel.listByEnrollments(roster.map((r) => r.enrollment_id));
  const students = roster.map((r) => {
    const mine = grades.filter((g) => g.enrollment_id === r.enrollment_id);
    return {
      enrollmentId: r.enrollment_id,
      studentId: r.student_id,
      name: r.name,
      email: r.email,
      grades: mine,
      average: weightedAverage(mine),
      weightUsed: totalWeight(mine),
    };
  });
  return { course, students };
}

/** Informe del estudiante: sus cursos con notas y promedio ponderado. */
export function getStudentReport(studentId: number): { courses: CourseReport[]; overall: number | null } {
  const courses = CourseModel.listForStudent(studentId);
  const grades = GradeModel.listByEnrollments(courses.map((c) => c.enrollment_id));
  const report = courses.map((c) => {
    const mine = grades.filter((g) => g.enrollment_id === c.enrollment_id);
    return { ...c, grades: mine, average: weightedAverage(mine), weightUsed: totalWeight(mine) };
  });
  const averages = report.map((r) => r.average).filter((a): a is number => a !== null);
  const overall = averages.length ? averages.reduce((s, a) => s + a, 0) / averages.length : null;
  return { courses: report, overall };
}

const EPSILON = 1e-9;
function checkWeight(used: number, weight: number): SaveResult {
  if (used + weight > 100 + EPSILON) {
    const free = Math.max(0, 100 - used);
    return { ok: false, error: `Los porcentajes no pueden superar 100 %. Para este estudiante quedan ${free} % disponibles.` };
  }
  return { ok: true };
}

export function addGrade(teacherId: number, courseId: number, enrollmentId: number, input: GradeInput): SaveResult {
  if (!CourseModel.findOwned(courseId, teacherId) || !GradeModel.enrollmentInCourse(enrollmentId, courseId)) {
    return { ok: false, error: "No tienes permiso para calificar a este estudiante." };
  }
  const check = checkWeight(GradeModel.weightUsed(enrollmentId), input.weight);
  if (!check.ok) return check;
  GradeModel.insert(enrollmentId, input);
  return { ok: true };
}

export function editGrade(teacherId: number, courseId: number, gradeId: number, input: GradeInput): SaveResult {
  const grade = CourseModel.findOwned(courseId, teacherId) && GradeModel.findInCourse(gradeId, courseId);
  if (!grade) return { ok: false, error: "No se encontró la nota." };
  const check = checkWeight(GradeModel.weightUsed(grade.enrollment_id, gradeId), input.weight);
  if (!check.ok) return check;
  GradeModel.update(gradeId, input);
  return { ok: true };
}

export function removeGrade(teacherId: number, courseId: number, gradeId: number): SaveResult {
  const grade = CourseModel.findOwned(courseId, teacherId) && GradeModel.findInCourse(gradeId, courseId);
  if (!grade) return { ok: false, error: "No se encontró la nota." };
  GradeModel.remove(gradeId);
  return { ok: true };
}
