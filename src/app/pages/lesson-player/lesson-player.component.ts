import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CoursesService } from '../../core/services/courses.service';
import { ProgressService } from '../../core/services/progress.service';
import { Course, Lesson } from '../../core/models/course.model';
import { lessonsOf } from '../../core/utils/course.utils';
import { NotFoundComponent } from '../not-found/not-found.component';
@Component({
  standalone: true,
  imports: [RouterLink, NotFoundComponent],
  templateUrl: './lesson-player.component.html',
  styleUrl: './lesson-player.component.css',
})
export class LessonPlayerComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap);
  readonly catalog = inject(CoursesService);
  readonly store = inject(ProgressService);
  readonly course = computed(() => this.catalog.find(this.params()?.get('courseId') ?? null));
  readonly allLessons = computed(() => (this.course() ? lessonsOf(this.course()!) : []));
  readonly lesson = computed(() =>
    this.allLessons().find((l) => l.id === this.params()?.get('lessonId')),
  );
  readonly index = computed(() => this.allLessons().findIndex((l) => l.id === this.lesson()?.id));
  readonly next = computed(() => this.allLessons()[this.index() + 1]);
  readonly paused = signal(true);
  readonly position = signal(0);
  readonly duration = signal(0);
  readonly broken = signal(false);
  readonly buffering = signal(false);
  readonly message = signal('');
  private lastSaved = '';
  ready(video: HTMLVideoElement, c: Course, l: Lesson) {
    this.broken.set(false);
    this.buffering.set(false);
    this.paused.set(true);
    this.message.set('');
    const duration = Number.isFinite(video.duration) ? video.duration : l.durationSec;
    this.duration.set(duration);
    video.currentTime = Math.min(
      this.store.get(c.id, l.id)?.position ?? 0,
      Math.max(0, duration - 0.1),
    );
    this.position.set(video.currentTime);
  }
  update(video: HTMLVideoElement, c: Course, l: Lesson) {
    this.position.set(video.currentTime);
    const key = `${c.id}/${l.id}/${Math.floor(video.currentTime)}`;
    const crossedThreshold =
      video.duration > 0 &&
      video.currentTime / video.duration >= 0.9 &&
      !this.store.get(c.id, l.id)?.completed;
    if (this.lastSaved !== key || crossedThreshold) {
      this.persist(video, c, l);
      this.lastSaved = key;
    }
  }
  persist(video: HTMLVideoElement, c: Course, l: Lesson) {
    if (video.readyState >= 1 && Number.isFinite(video.duration))
      this.store.save(c.id, l.id, video.currentTime, video.duration);
  }
  async toggle(video: HTMLVideoElement) {
    if (video.paused) {
      try {
        await video.play();
      } catch {
        this.message.set('تعذّر بدء التشغيل. حاول مرة أخرى.');
      }
    } else video.pause();
  }
  seek(event: Event, video: HTMLVideoElement) {
    if (Number.isFinite(video.duration)) {
      video.currentTime = Number((event.target as HTMLInputElement).value);
      this.position.set(video.currentTime);
    }
  }
  async fullscreen(shell: HTMLElement) {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shell.requestFullscreen();
    } catch {
      this.message.set('ملء الشاشة غير متاح في هذا المتصفح.');
    }
  }
  retry(video: HTMLVideoElement) {
    this.broken.set(false);
    video.load();
  }
  keyboard(event: KeyboardEvent, video: HTMLVideoElement) {
    if ((event.target as HTMLElement).matches('input,button')) return;
    if (event.code === 'Space') {
      event.preventDefault();
      void this.toggle(video);
    }
    if (['ArrowLeft', 'ArrowRight'].includes(event.code) && Number.isFinite(video.duration)) {
      event.preventDefault();
      video.currentTime = Math.max(
        0,
        Math.min(video.duration, video.currentTime + (event.code === 'ArrowRight' ? 5 : -5)),
      );
    }
  }
  time(sec: number) {
    const safe = Number.isFinite(sec) ? Math.floor(sec) : 0;
    return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
  }
}
