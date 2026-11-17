import { Request, Response } from "express";
import { getStudentReport } from "../services/grade.service";

export function dashboard(req: Request, res: Response): void {
  const { courses, overall } = getStudentReport(req.user!.id);
  res.render("student/dashboard", { title: "Mis notas", courses, overall });
}
