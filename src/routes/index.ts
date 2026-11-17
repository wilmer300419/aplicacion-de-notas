import { Request, Response, Router } from "express";
import rateLimit from "express-rate-limit";
import * as Auth from "../controllers/auth.controller";
import * as Student from "../controllers/student.controller";
import * as Teacher from "../controllers/teacher.controller";
import { homeFor, requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/async";
import { setFlash } from "../middleware/flash";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    setFlash(res, "error", "Demasiados intentos fallidos. Espera 15 minutos antes de volver a intentarlo.");
    res.redirect("/login");
  },
});

export const router = Router();

router.get("/healthz", (_req, res) => res.json({ status: "ok" }));
router.get("/", (req, res) => res.redirect(req.user ? homeFor(req.user.role) : "/login"));

router.get("/login", Auth.showLogin);
router.post("/login", loginLimiter, asyncHandler(Auth.login));
router.post("/logout", requireAuth, Auth.logout);

router.get("/student", requireRole("student"), Student.dashboard);

const teacher = Router();
teacher.use(requireRole("teacher"));
teacher.get("/", Teacher.dashboard);
teacher.get("/courses/:courseId", Teacher.showCourse);
teacher.post("/courses/:courseId/grades", Teacher.createGrade);
teacher.post("/courses/:courseId/grades/:gradeId/update", Teacher.updateGrade);
teacher.post("/courses/:courseId/grades/:gradeId/delete", Teacher.deleteGrade);
router.use("/teacher", teacher);
