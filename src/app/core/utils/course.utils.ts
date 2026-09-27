import { Course, Lesson } from '../models/course.model';
export const lessonsOf = (course: Course): Lesson[] => course.sections.flatMap((s) => s.lessons);
