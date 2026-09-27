import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { Course } from '../models/course.model';
import { LessonProgress, ProgressMap } from '../models/progress.model';
import { coursePercent, isUnlocked, progressKey, recordPosition } from '../utils/progress.utils';
export interface Persistence {
  read(): ProgressMap;
  write(value: ProgressMap): void;
}
export const PERSISTENCE = new InjectionToken<Persistence>('Progress persistence', {
  providedIn: 'root',
  factory: () => ({
    read: () => {
      try {
        const raw: unknown = JSON.parse(localStorage.getItem('thaheen.progress.v1') ?? '{}');
        const result: ProgressMap = {};
        if (raw && typeof raw === 'object')
          for (const [key, value] of Object.entries(raw)) {
            if (
              value &&
              typeof value === 'object' &&
              'position' in value &&
              typeof value.position === 'number' &&
              Number.isFinite(value.position) &&
              value.position >= 0 &&
              'completed' in value &&
              typeof value.completed === 'boolean' &&
              'updatedAt' in value &&
              typeof value.updatedAt === 'number'
            )
              result[key] = {
                position: value.position,
                completed: value.completed,
                updatedAt: value.updatedAt,
              };
          }
        return result;
      } catch {
        return {};
      }
    },
    write: (value) => localStorage.setItem('thaheen.progress.v1', JSON.stringify(value)),
  }),
});
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly persistence = inject(PERSISTENCE);
  readonly progress = signal(this.persistence.read());
  readonly watchedTime = computed(() => {
    const totalSeconds = Math.floor(
      Object.values(this.progress()).reduce((sum, lesson) => sum + lesson.position, 0),
    );
    return { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 };
  });
  readonly warning = signal('');
  get(courseId: string, lessonId: string): LessonProgress | undefined {
    return this.progress()[progressKey(courseId, lessonId)];
  }
  percent(course: Course) {
    return coursePercent(course, this.progress());
  }
  unlocked(course: Course, lessonId: string) {
    return isUnlocked(course, lessonId, this.progress());
  }
  save(courseId: string, lessonId: string, position: number, duration: number) {
    const key = progressKey(courseId, lessonId);
    this.progress.update((all) => ({
      ...all,
      [key]: recordPosition(all[key], position, duration, Date.now()),
    }));
    try {
      this.persistence.write(this.progress());
      this.warning.set('');
    } catch {
      this.warning.set('تعذّر حفظ التقدم على هذا الجهاز. سيبقى تقدمك متاحًا حتى إغلاق الصفحة.');
    }
  }
}
