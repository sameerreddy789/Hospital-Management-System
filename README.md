# TumourCare - Tumour Care Management System

A specialized oncology and tumour care management web application built with vanilla HTML/CSS/JS and Firebase.

## Features

### Patient Module
- Self-registration and secure login
- Submit health problems for review
- View appointments with real-time status updates
- Digital prescriptions with PDF download and print
- Request follow-up appointments
- Profile management
- In-app notifications

### Doctor Module
- View assigned patients and appointments
- Write and submit prescriptions (immutable once submitted)
- View complete patient medical history
- Mark appointments as completed
- Real-time notifications for new assignments

### Admin Module
- Dashboard with real-time statistics
- Manage doctor accounts (add with specialization)
- Review and assign patient submissions to doctors
- Schedule appointments with conflict detection
- Notification system for all events

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphic Design), JavaScript (ES5)
- **Backend**: Firebase (Authentication, Firestore, Hosting)
- **PDF Export**: jsPDF
- **Design**: Glassmorphism, responsive, mobile-first

## Design Highlights

- Glassmorphic UI with backdrop blur effects
- Dark-themed auth pages with gradient orbs
- Gradient accent colors (blue to purple)
- Inter font family for modern typography
- Animated stat counters on landing page
- Skeleton loading states
- Toast notifications
- Responsive across all devices

## Project Structure

```
├── index.html              # Landing page
├── login.html              # Login (glassmorphic dark)
├── register.html           # Patient registration
├── reset-password.html     # Password reset
├── 404.html                # Error page
├── admin/
│   ├── dashboard.html      # Admin dashboard
│   ├── assign.html         # Assign patient to doctor
│   ├── manage-doctors.html # Doctor management
│   └── notifications.html  # Admin notifications
├── doctor/
│   ├── dashboard.html      # Doctor dashboard
│   ├── patient-details.html# Patient details + prescriptions
│   └── notifications.html  # Doctor notifications
├── patient/
│   ├── dashboard.html      # Patient dashboard
│   ├── submit-problem.html # Submit health problem
│   ├── appointments.html   # View appointments
│   ├── prescriptions.html  # View/download prescriptions
│   ├── profile.html        # Edit profile
│   └── notifications.html  # Patient notifications
├── css/
│   ├── style.css           # Main glassmorphic stylesheet
│   └── print.css           # Print styles for prescriptions
├── js/
│   ├── firebase-config.js  # Firebase configuration
│   ├── auth.js             # Authentication functions
│   ├── auth-guard.js       # Route protection
│   ├── firestore.js        # Firestore CRUD operations
│   ├── notifications.js    # Notification system
│   ├── validation.js       # Form validation
│   ├── utils.js            # Utility functions
│   ├── search-filter.js    # Search and filter
│   └── pdf-export.js       # PDF generation
├── firebase.json           # Firebase hosting config
└── firestore.rules         # Firestore security rules
```

## Setup

1. Clone the repository
2. Update `js/firebase-config.js` with your Firebase project credentials
3. Deploy Firestore security rules: `firebase deploy --only firestore:rules`
4. Deploy to Firebase Hosting: `firebase deploy --only hosting`

## Security

- Role-based access control (Patient, Doctor, Admin)
- Firestore security rules enforce data access
- XSS prevention with HTML escaping
- Auth guards on all protected pages
- Immutable prescriptions (write-once)

## License

MIT
