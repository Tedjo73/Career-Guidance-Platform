# Makaota Career & Education Platform

A full-stack career guidance and education platform that connects students, higher education institutions, and companies. The application streamlines admissions, provides course discovery, and facilitates graduate employment opportunities.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Key Workflows](#key-workflows)
- [Deployment](#deployment)
- [Testing & Quality](#testing--quality)
- [Troubleshooting](#troubleshooting)
- [Attributions](#attributions)

---

## Features

### Admin Module
- Manage higher learning institutions (create, edit, delete).
- Manage faculties and courses on behalf of institutions.
- Approve or reject new institution and company registrations.
- Suspend, activate, or remove company accounts.
- Publish admissions in bulk or individually.
- Access system analytics (application counts, admission rates, job stats, placement indicators).

### Institution Module
- Register with email verification and admin approval.
- Manage faculties and courses tied to the institution.
- Process student applications (admit, reject, waiting list).
- Publish admission decisions without affecting status changes.
- Maintain detailed institution profiles.

### Student Module
- Register with email verification.
- Browse institutions and courses; apply to up to two courses per institution.
- Track application status and published decisions.
- Upload academic transcripts, additional certificates, and work experience details.
- Discover job opportunities and submit applications.

### Company Module
- Register with email verification and admin approval.
- Post job opportunities with required qualifications and experience.
- Review applicants filtered by match scores derived from student data.
- Manage company profile and account status.

### Cross-cutting
- Role-based dashboards (admin, institution, student, company).
- Firebase Authentication, Firestore, and Storage integration.
- Toast-based notifications for feedback.
- Responsive UI built with React, Tailwind, and Radix UI primitives.

---

## Architecture

| Layer            | Technology                                  |
| ---------------- | ------------------------------------------- |
| Frontend         | React 18, TypeScript, Vite, Tailwind CSS    |
| UI Components    | Radix UI + Custom ShadCN-inspired components|
| Authentication   | Firebase Auth                               |
| Persistence      | Cloud Firestore                             |
| File Storage     | Firebase Storage                            |
| Notifications    | `sonner` toast library                      |
| Icons            | `lucide-react`                              |

---

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9 (or pnpm/yarn)
- Firebase project with Authentication, Firestore, and Storage enabled
- Git (for version control & deployment to Vercel)

---

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Makaota-Career-Education-Platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables** (see [Environment Variables](#environment-variables)).

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. Open the app at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create a `.env` (or `.env.local`) file at the project root. Vite exposes variables prefixed with `VITE_`.

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Ensure the values match the Firebase project used for production.

---

## Available Scripts

| Command            | Description                                   |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Start Vite dev server with hot reloading       |
| `npm run build`    | Create an optimized production build (`dist`) |
| `npm run preview`  | Serve the built app locally                    |
| `npm run lint`*    | (Optional) Run lint checks if configured       |

\* Add ESLint or additional tooling as needed.

---

## Project Structure

```
src/
├── components/          # UI components & dashboards
│   ├── AdminDashboard.tsx
│   ├── InstituteDashboard.tsx
│   ├── StudentDashboard.tsx
│   ├── CompanyDashboard.tsx
│   └── ui/              # Radix-based shared UI primitives
├── contexts/
│   └── AuthContext.tsx  # Global auth/profile handling
├── lib/
│   ├── auth.ts          # Auth helpers (login/register)
│   ├── firebase.ts      # Firebase init (Auth/Firestore/Storage)
│   └── firestore.ts     # Firestore CRUD abstractions
├── styles/
│   └── globals.css
├── App.tsx              # Role routing and layout
└── main.tsx             # Entry point
```

---

## Key Workflows

### Admissions Publishing
- Institutions update application statuses (`admitted`, `waiting`, `rejected`) without affecting publication.
- Publishing an admission sets `isPublished` and `publishedAt` in Firestore.
- Students only see official decisions when `isPublished` is `true`.
- Admins can publish decisions individually or in bulk from their dashboard.

### Student Document Uploads
- Students can upload transcripts and certificates.
- Files are stored via Firebase Storage; metadata is tracked in Firestore under the student profile.
- Company match scoring leverages uploaded documents, skills, and experience.

### Company Applicant Filtering
- Companies view applicants per job posting.
- A match score (currently a placeholder) is displayed to surface interview-ready candidates.
- Admins can suspend/activate or delete company accounts, which cascades related data cleanup via Firestore helpers.

---

## Deployment

### Vercel (recommended)
1. Push your repository to GitHub/GitLab/Bitbucket.
2. Import the project at [vercel.com](https://vercel.com).
3. Confirm build settings:
   - Install: `npm install`
   - Build: `npm run build`
   - Output: `dist`
4. Add environment variables in Vercel (Settings → Environment Variables).
5. Deploy; Vercel will provide preview and production URLs.

### Firebase Hosting (alternative)
1. `npm install -g firebase-tools`
2. `firebase login`
3. `firebase init hosting` (choose project, set public dir to `dist`, enable SPA rewrite)
4. `npm run build`
5. `firebase deploy`

---

## Testing & Quality

- **Manual QA**: Exercise core flows (registration, login, applications, document upload, admissions publishing, job postings).
- **Linting/Formatting**: Configure ESLint/Prettier as desired; run before deployment.
- **Security**: Ensure Firestore security rules align with role-based access. Restrict Storage uploads to authenticated users.
- **Monitoring**: Consider enabling Firebase Analytics, Crashlytics (if native clients), or Vercel Analytics.

---

## Attributions

- UI inspired by [Shadcn UI](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

Maintained with ❤️ to help students, institutions, and companies collaborate on academic and career journeys. Contributions, bug reports, and feature requests are welcome!

