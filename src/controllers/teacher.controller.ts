import { Request, Response } from "express";
import { z } from "zod";
import { setFlash } from "../middleware/flash";
import { CourseModel } from "../models/course.model";
import * as GradeService from "../services/grade.service";
import { HttpError } from "../utils/errors";
import { MAX_SCORE } from "../utils/grades";

const number = (label: string, min: number, max: number, unit = "") =>
  z.preprocess(
    (v) => {
      if (typeof v !== "string" || v.trim() === "") return NaN;
      return Number(v.trim().replace(",", ".")); // acepta 4,5 y 4.5
    },
    z
      .number({ invalid_type_error: `${label} debe ser un número.` })
      .min(min, `${label} debe estar entre ${min} y ${max}${unit}.`)
      .max(max, `${label} debe estar entre ${min} y ${max}${unit}.`)
  );

const gradeSchema = z.object({
  title: z.string().trim().min(1, "Escribe el nombre de la evaluación.").max(80, "El nombre admite hasta 80 caracteres."),
  score: number("La nota", 0, MAX_SCORE),
  weight: number("El porcentaje", 1, 100, " %"),
});

const intParam = (value: string): number => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(404, "No encontramos la página que buscas.");
  return n;
};

export function dashboard(req: Request, res: Response): void {
  res.render("teacher/dashboard", { title: "Mis cursos", courses: CourseModel.listByTeacher(req.user!.id) });
}

export function showCourse(req: Request, res: Response): void {
  const book = GradeService.getGradebook(intParam(req.params.courseId), req.user!.id);
  if (!book) throw new HttpError(404, "No encontramos ese curso en tu lista.");
  res.render("teacher/course", { title: book.course.name, ...book });
}

function finish(req: Request, res: Response, result: GradeService.SaveResult, okMessage: string): void {
  const back = `/teacher/courses/${intParam(req.params.courseId)}`;
  setFlash(res, result.ok ? "success" : "error", result.ok ? okMessage : result.error);
  res.redirect(back);
}

export function createGrade(req: Request, res: Response): void {
  const courseId = intParam(req.params.courseId);
  const parsed = gradeSchema.safeParse(req.body);
  const enrollmentId = Number(req.body?.enrollmentId);
  if (!parsed.success) {
    return finish(req, res, { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") }, "");
  }
  finish(req, res, GradeService.addGrade(req.user!.id, courseId, enrollmentId, parsed.data), "Nota guardada.");
}

export function updateGrade(req: Request, res: Response): void {
  const courseId = intParam(req.params.courseId);
  const parsed = gradeSchema.safeParse(req.body);
  if (!parsed.success) {
    return finish(req, res, { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") }, "");
  }
  finish(req, res, GradeService.editGrade(req.user!.id, courseId, intParam(req.params.gradeId), parsed.data), "Cambios guardados.");
}

export function deleteGrade(req: Request, res: Response): void {
  const courseId = intParam(req.params.courseId);
  finish(req, res, GradeService.removeGrade(req.user!.id, courseId, intParam(req.params.gradeId)), "Nota eliminada.");
}
