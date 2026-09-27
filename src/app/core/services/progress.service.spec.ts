import '@angular/compiler';
import { Injector } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { Course } from '../models/course.model';
import { ProgressMap } from '../models/progress.model';
import { PERSISTENCE, ProgressService } from './progress.service';
const course: Course = {
  id: 'c',
  title: 'Test',
  instructor: 'Teacher',
  thumbnail: '',
  category: '',
  description: '',
  sections: [
    { id: 's1', title: 'One', lessons: [{ id: 'a', title: 'A', durationSec: 100, video: '' }] },
    { id: 's2', title: 'Two', lessons: [{ id: 'b', title: 'B', durationSec: 100, video: '' }] },
  ],
};
function setup(initial: ProgressMap = {}) {
  let stored = initial;
  const injector = Injector.create({
    providers: [
      ProgressService,
      {
        provide: PERSISTENCE,
        useValue: {
          read: () => stored,
          write: (value: ProgressMap) => {
            stored = value;
          },
        },
      },
    ],
  });
  return { store: injector.get(ProgressService), persisted: () => stored };
}
describe('ProgressService', () => {
  it('shows seconds for short lessons instead of discarding sub-minute progress', () => {
    const { store } = setup();
    expect(store.watchedTime()).toEqual({ minutes: 0, seconds: 0 });
    store.save('c', 'a', 24, 24);
    expect(store.watchedTime()).toEqual({ minutes: 0, seconds: 24 });
  });
  it('sums lesson positions before splitting into minutes and seconds', () => {
    const { store } = setup();
    store.save('c', 'a', 24, 24);
    store.save('c', 'b', 24, 24);
    store.save('c', 'c', 12, 24);
    expect(store.watchedTime()).toEqual({ minutes: 1, seconds: 0 });
    store.save('c', 'c', 24, 24);
    expect(store.watchedTime()).toEqual({ minutes: 1, seconds: 12 });
  });
  it('restores the watch-time summary from persisted progress', () => {
    const original = setup();
    original.store.save('c', 'a', 75, 100);
    const restored = setup(original.persisted()).store;
    expect(restored.watchedTime()).toEqual({ minutes: 1, seconds: 15 });
  });
  it('completes at exactly 90%, but not before', () => {
    const { store } = setup();
    store.save('c', 'a', 89.99, 100);
    expect(store.get('c', 'a')?.completed).toBe(false);
    store.save('c', 'a', 90, 100);
    expect(store.get('c', 'a')?.completed).toBe(true);
  });
  it('keeps completion when seeking back', () => {
    const { store } = setup();
    store.save('c', 'a', 90, 100);
    store.save('c', 'a', 10, 100);
    expect(store.get('c', 'a')?.completed).toBe(true);
  });
  it('unlocks sequentially across sections and rejects unknown lessons', () => {
    const { store } = setup();
    expect(store.unlocked(course, 'a')).toBe(true);
    expect(store.unlocked(course, 'b')).toBe(false);
    expect(store.unlocked(course, 'missing')).toBe(false);
    store.save('c', 'a', 90, 100);
    expect(store.unlocked(course, 'b')).toBe(true);
  });
  it('calculates completion percentage by lessons, not playback position', () => {
    const { store } = setup();
    expect(store.percent(course)).toBe(0);
    store.save('c', 'a', 50, 100);
    expect(store.percent(course)).toBe(0);
    store.save('c', 'a', 90, 100);
    expect(store.percent(course)).toBe(50);
    store.save('c', 'b', 100, 100);
    expect(store.percent(course)).toBe(100);
  });
  it('returns zero for an empty course', () => {
    expect(setup().store.percent({ ...course, sections: [] })).toBe(0);
  });
  it('persists and restores position and completion', () => {
    const original = setup();
    original.store.save('c', 'a', 94, 100);
    const restored = setup(original.persisted()).store;
    expect(restored.get('c', 'a')?.position).toBe(94);
    expect(restored.unlocked(course, 'b')).toBe(true);
  });
  it('does not complete on invalid duration and clamps invalid positions', () => {
    const { store } = setup();
    store.save('c', 'a', 100, 0);
    expect(store.get('c', 'a')?.completed).toBe(false);
    store.save('c', 'a', Number.NaN, 100);
    expect(store.get('c', 'a')?.position).toBe(0);
  });
  it('keeps courses with the same lesson IDs isolated', () => {
    const { store } = setup();
    store.save('other', 'a', 100, 100);
    expect(store.unlocked(course, 'b')).toBe(false);
    expect(store.percent(course)).toBe(0);
  });
  it('retains in-memory progress if storage fails', () => {
    const injector = Injector.create({
      providers: [
        ProgressService,
        {
          provide: PERSISTENCE,
          useValue: {
            read: () => ({}),
            write: () => {
              throw new Error('quota');
            },
          },
        },
      ],
    });
    const store = injector.get(ProgressService);
    store.save('c', 'a', 90, 100);
    expect(store.get('c', 'a')?.completed).toBe(true);
    expect(store.warning()).not.toBe('');
  });
});
