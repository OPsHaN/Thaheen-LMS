export interface LessonProgress {
  position: number;
  completed: boolean;
  updatedAt: number;
}
export type ProgressMap = Record<string, LessonProgress>;
