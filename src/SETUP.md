# Career Gateway Lesotho - Setup Guide

## Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named "career-gateway-lesotho"
3. Enable **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
4. Create **Firestore Database**:
   - Go to Firestore Database
   - Create database (start in test mode)
5. Enable **Storage**:
   - Go to Storage
   - Get started
6. Get your Firebase config:
   - Project Settings → General → Your apps → Add web app
   - Copy the config object

### 2. Add Firebase Credentials

Update `/lib/firebase.ts` with your Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 3. Create Admin Account

**Option 1: Register via UI (Development Only)**
1. Click "Register" on the landing page
2. Select "Admin" as account type
3. Fill in the form:
   - Email: admin@careergateway.ls
   - Password: Admin123! (or your choice)
   - Name: System Administrator
   - Phone: +266 XXXX XXXX
   - Address: Maseru, Lesotho
4. Click "Register"
5. You can now login immediately (admin accounts skip email verification)

**Option 2: Manual Creation in Firebase Console**
1. Register any account first (student, institute, or company)
2. Go to Firebase Console → Firestore Database
3. Find the `users` collection
4. Click on your user document
5. Edit the `role` field to `"admin"`
6. Save

**⚠️ IMPORTANT FOR PRODUCTION:**
Remove the admin option from the registration form before deploying to production.
Admins should only be created manually in the database for security.

### 4. Test User Accounts

For testing, create these accounts:

**Admin:**
- Email: admin@careergateway.ls
- Password: Admin123!
- Can manage everything

**Institution:**
- Email: nul@university.ls
- Password: Test123!
- Requires admin approval

**Student:**
- Email: student@test.ls
- Password: Test123!
- Can browse and apply immediately

**Company:**
- Email: company@business.ls
- Password: Test123!
- Requires admin approval

### 5. Firestore Security Rules

In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == userId || 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Institutions
    match /institutions/{institutionId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'institute';
    }
    
    // Courses
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Applications
    match /applications/{applicationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    // Jobs
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Job Applications
    match /jobApplications/{applicationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

### 6. Run Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

### 7. Deploy

**Vercel (Recommended):**
```bash
npm i -g vercel
vercel
```

**Firebase Hosting:**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

**Netlify:**
- Connect GitHub repository
- Build command: `npm run build`
- Publish directory: `dist`

## Workflow Testing

### Test Full Student Journey:
1. Register as student
2. Browse institutions and courses
3. Apply to 2 courses at one institution
4. Wait for admin to approve institution
5. Wait for institution to review application
6. If admitted to multiple places, select one
7. Upload transcript and certificates
8. Apply for jobs

### Test Institution Workflow:
1. Register as institution (pending approval)
2. Admin approves institution
3. Login and add faculties
4. Add courses under faculties
5. Review student applications
6. Admit/reject/waitlist students
7. Manage admitted students

### Test Company Workflow:
1. Register as company (pending approval)
2. Admin approves company
3. Login and post job opportunities
4. View filtered applicants
5. Review candidate profiles
6. Contact qualified candidates

### Test Admin Workflow:
1. Login as admin
2. Add institutions directly
3. Approve pending institutions and companies
4. Manage all system entities
5. View comprehensive reports

## Troubleshooting

**Can't login as admin:**
- Make sure you selected "Admin" during registration
- Or manually change role in Firestore to "admin"

**Email verification not received:**
- Check spam folder
- Admin accounts skip email verification
- Check Firebase Console → Authentication for user status

**Pending approval message:**
- Institutions and companies require admin approval
- Login as admin to approve them

**Firebase errors:**
- Verify Firebase credentials in `/lib/firebase.ts`
- Check Firestore rules are published
- Ensure Authentication is enabled

## Production Checklist

Before deploying to production:

- [ ] Remove admin option from registration form
- [ ] Update Firestore security rules (stricter permissions)
- [ ] Enable Firebase App Check
- [ ] Set up proper email templates
- [ ] Configure custom domain
- [ ] Add environment variables for sensitive config
- [ ] Enable Firebase Analytics
- [ ] Set up monitoring and alerts
- [ ] Add terms of service and privacy policy
- [ ] Test all user workflows
- [ ] Perform security audit

## Support

For issues or questions:
- Check Firebase Console for errors
- Review browser console for client-side errors
- Check Firestore logs for database issues
