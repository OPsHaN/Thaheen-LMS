export interface Lesson {
  id: string;
  title: string;
  durationSec: number;
  video: string;
}
export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}
export interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  category: string;
  description: string;
  sections: Section[];
}
