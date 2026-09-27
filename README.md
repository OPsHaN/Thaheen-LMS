# Thaheen — Arabic Offline LMS

A small, Arabic-first learning portal built with Angular 20 standalone components. Designed for Windows development, desktop browsers and mobile widths. All course data, fonts, illustrations and MP4 files are bundled; there are no backend calls, external APIs or runtime CDNs.

## Run on Windows

Use Node.js 22.12+ (tested with 22.17) and npm. In PowerShell:


npm install
npx ng serve
```



src/app/
├── core/
│   ├── models/
│   │   ├── course.model.ts
│   │   └── progress.model.ts
│   ├── services/
│   │   ├── courses.service.ts
│   │   ├── progress.service.ts
│   │   └── progress.service.spec.ts
│   ├── guards/
│   │   └── lesson-access.guard.ts
│   └── utils/
│       ├── course.utils.ts
│       └── progress.utils.ts
├── pages/
│   ├── courses/courses.component.{ts,html,css}
│   ├── course-details/course-details.component.{ts,html,css}
│   ├── lesson-player/lesson-player.component.{ts,html,css}
│   └── not-found/not-found.component.{ts,html,css}
├── app.routes.ts
└── app.component.{ts,html,css}
```


