export const MAX_SCORE = 5;
export const PASS_SCORE = 3;

export interface GradeRow {
  id: number;
  enrollment_id: number;
  title: string;
  score: number;
  weight: number;
  created_at: string;
}

/** Promedio ponderado sobre lo evaluado hasta ahora (null si aún no hay notas). */
export function weightedAverage(grades: Pick<GradeRow, "score" | "weight">[]): number | null {
  const total = totalWeight(grades);
  if (total === 0) return null;
  return grades.reduce((sum, g) => sum + g.score * g.weight, 0) / total;
}

export function totalWeight(grades: Pick<GradeRow, "weight">[]): number {
  return grades.reduce((sum, g) => sum + g.weight, 0);
}

export function formatScore(n: number | null): string {
  return n === null ? "—" : n.toFixed(2);
}

export function statusOf(avg: number | null): { label: string; css: string } {
  if (avg === null) return { label: "Sin notas", css: "neutral" };
  return avg >= PASS_SCORE ? { label: "Aprobando", css: "ok" } : { label: "En riesgo", css: "risk" };
}
