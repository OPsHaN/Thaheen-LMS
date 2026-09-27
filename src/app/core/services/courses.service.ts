import { Injectable, signal } from '@angular/core';
import { Course } from '../models/course.model';
@Injectable({ providedIn: 'root' })
export class CoursesService {
  readonly courses = signal<Course[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  private pending?: Promise<void>;
  load(): Promise<void> {
    return (this.pending ??= this.fetchCourses());
  }
  async retry() {
    this.pending = undefined;
    await this.load();
  }
  private async fetchCourses() {
    this.loading.set(true);
    this.error.set(false);
    try {
      const data = await import('../../../assets/data/courses.json');
      this.courses.set(data.default);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
  find(id: string | null) {
    return this.courses().find((c) => c.id === id);
  }
}
