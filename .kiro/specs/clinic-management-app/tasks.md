# Implementation Plan: Clinic Management App

## Overview

Incremental implementation of a multi-role clinic management web app using vanilla HTML/CSS/JavaScript with Firebase (Auth, Firestore, Hosting). Tasks are ordered: foundation (Firebase config, utilities, auth) → core modules (patient, admin, doctor) → cross-cutting features (notifications, search/filter, PDF export, responsive layout) → security rules and testing. Each task builds on previous steps.

## Tasks

- [x] 1. Project setup and shared utilities
  - [x] 1.1 Create `firebase.json` hosting config and `js/firebase-config.js`
    - Initialize Firebase app, export `app`, `auth`, and `db` instances
    - _Requirements: 2.2, 4.2_

  - [x] 1.2 Create `js/validation.js` with form validation utilities
    - Implement `validateRequired`, `validateEmail`, `validatePassword`, `showFieldError`, `clearFieldErrors`, `validateForm`
    - _Requirements: 2.4, 5.3, 11.5, 13.5, 19.3, 22.6_

  - [ ]* 1.3 Write property tests for validation (`tests/property/validation.property.test.js`)
    - **Property 2: Form validation rejects empty/whitespace required fields**
    - **Validates: Requirements 2.4, 5.3, 11.5**

  - [x] 1.4 Create `js/utils.js` with date formatting and DOM helpers
    - Date formatting, time formatting, DOM query helpers
    - _Requirements: 7.3, 8.2, 10.2_

- [x] 2. Authentication module
  - [x] 2.1 Create `js/auth.js` with auth functions
    - Implement `registerPatient`, `loginUser`, `logoutUser`, `sendPasswordReset`, `getCurrentUser`
    - `registerPatient` creates Firebase Auth user and writes Firestore user doc with role `"patient"`
    - `loginUser` authenticates and fetches role from Firestore, returns `{uid, role}`
    - _Requirements: 2.1, 2.2, 2.5, 3.3, 4.1, 4.2, 4.4, 4.5, 22.3_

  - [ ]* 2.2 Write property test for patient registration (`tests/property/registration.property.test.js`)
    - **Property 1: Patient registration always assigns patient role with correct fields**
    - **Validates: Requirements 2.2, 3.3**

  - [x] 2.3 Create `js/auth-guard.js` with route protection
    - Implement `requireAuth(allowedRole)` — redirects to login if unauthenticated, redirects to role dashboard if wrong role
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ]* 2.4 Write property tests for auth guard (`tests/property/routing.property.test.js`)
    - **Property 3: Role-based redirect after login**
    - **Validates: Requirements 4.2**
    - **Property 16: Unauthenticated access redirects to login**
    - **Validates: Requirements 15.1**
    - **Property 17: Role-based access control prevents cross-role access**
    - **Validates: Requirements 15.2, 15.3, 15.4, 15.5**

- [x] 3. Auth pages (HTML + wiring)
  - [x] 3.1 Create `login.html` with login form
    - Email and password fields, submit handler calling `loginUser`, error display, "Forgot Password" link
    - _Requirements: 4.1, 4.2, 4.3, 22.1_

  - [x] 3.2 Create `register.html` with patient registration form
    - Full name, email, password fields, submit handler calling `registerPatient`, validation errors, redirect to login on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.3 Create `reset-password.html` with password reset form
    - Email field, submit handler calling `sendPasswordReset`, success/error messages
    - _Requirements: 22.2, 22.3, 22.4, 22.5, 22.6_

- [x] 4. Landing page
  - [x] 4.1 Create `index.html` with About, Services, and Contact sections
    - Navigation with login and registration buttons linking to `login.html` and `register.html`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5. Checkpoint
  - Ensure auth flow works end-to-end (register, login, logout, password reset, auth guard redirects). Ask the user if questions arise.

- [x] 6. Firestore operations module
  - [x] 6.1 Create `js/firestore.js` — Problem Submissions CRUD
    - Implement `createProblemSubmission`, `getPendingSubmissions`, `getSubmissionsByPatient`, `updateSubmissionStatus`
    - _Requirements: 5.2, 6.1, 6.2, 7.4_

  - [x] 6.2 Create `js/firestore.js` — Appointments CRUD
    - Implement `createAppointment`, `getAppointmentsByPatient`, `getAppointmentsByDoctor`, `getAllAppointments`, `updateAppointmentStatus`, `checkDoctorConflict`
    - _Requirements: 7.3, 8.1, 9.1, 17.3, 17.5, 18.1_

  - [ ]* 6.3 Write property test for conflict check (`tests/property/conflict-check.property.test.js`)
    - **Property 8: Doctor conflict check correctness**
    - **Validates: Requirements 18.1, 18.3, 18.4**

  - [x] 6.4 Create `js/firestore.js` — Prescriptions CRUD
    - Implement `createPrescription`, `getPrescriptionsByPatient`, `getPrescriptionsByAppointment`
    - _Requirements: 11.3, 12.1_

  - [x] 6.5 Create `js/firestore.js` — Users and Patient History
    - Implement `getDoctorList`, `getUserProfile`, `updatePatientProfile`, `getPatientHistory`
    - _Requirements: 7.1, 10.1, 19.1, 19.2_

  - [x] 6.6 Create `js/firestore.js` — Real-time listeners
    - Implement `onSubmissionsChange`, `onAppointmentsChange`, `onStatsChange`
    - _Requirements: 21.4_

  - [ ]* 6.7 Write property tests for data filtering and status transitions
    - **Property 5: Owner-based data filtering returns only the owner's records** (`tests/property/data-filtering.property.test.js`)
    - **Validates: Requirements 8.1, 9.1, 12.1**
    - **Property 6: Pending submissions filter returns only pending items** (`tests/property/data-filtering.property.test.js`)
    - **Validates: Requirements 6.1, 13.4**
    - **Property 9: Appointment status transitions are valid** (`tests/property/status-transitions.property.test.js`)
    - **Validates: Requirements 7.4, 11.4, 17.1, 17.3, 17.5**
    - **Property 11: Prescription supports multiple medicines** (`tests/property/status-transitions.property.test.js`)
    - **Validates: Requirements 11.2**

- [x] 7. Checkpoint
  - Ensure all Firestore operations work correctly. Ask the user if questions arise.

- [x] 8. Patient module pages
  - [x] 8.1 Create `patient/dashboard.html` with summary cards and appointment list
    - Display upcoming appointments count and prescriptions count via real-time listeners
    - _Requirements: 21.3, 21.4_

  - [x] 8.2 Create `patient/submit-problem.html` with problem submission form
    - Title and description fields, validation, calls `createProblemSubmission`, confirmation message
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 8.3 Create `patient/appointments.html` with appointment list
    - Display all patient appointments with doctor name, date, time, status
    - "Cancel Appointment" button for assigned + future appointments, "Request Follow-Up" button for prescribed appointments
    - _Requirements: 8.1, 8.2, 8.3, 13.1, 13.2, 13.3, 17.2, 17.3_

  - [ ]* 8.4 Write property test for status-driven button visibility (`tests/property/button-visibility.property.test.js`)
    - **Property 19: Status-driven action button visibility**
    - **Validates: Requirements 13.1, 17.2, 17.4**

  - [x] 8.5 Create `patient/prescriptions.html` with prescription list and detail view
    - Display all prescriptions with doctor name, date, medicines, notes
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 8.6 Create `patient/profile.html` with editable profile form
    - Display and edit name, email (read-only), phone, address; save to Firestore
    - _Requirements: 19.1, 19.2, 19.3_

  - [ ]* 8.7 Write property test for profile round-trip (`tests/property/profile-roundtrip.property.test.js`)
    - **Property 22: Patient profile update round-trip**
    - **Validates: Requirements 19.2**

- [x] 9. Admin module pages
  - [x] 9.1 Create `admin/dashboard.html` with summary cards and pending requests list
    - Display pending submissions count, assigned appointments count, doctors count via real-time listeners
    - List all problem submissions with patient name, title, description, date
    - _Requirements: 6.1, 6.2, 6.3, 21.1, 21.4_

  - [x] 9.2 Create `admin/assign.html` with assignment page
    - Doctor list, date/time pickers, conflict check before confirming, updates submission status to "assigned"
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 18.1, 18.2, 18.3, 18.4_

  - [ ]* 9.3 Write property test for assignment and conflict check
    - **Property 7: Assignment creates appointment with correct references and updates submission status** (`tests/property/conflict-check.property.test.js`)
    - **Validates: Requirements 7.3, 7.4**

- [ ] 10. Doctor module pages
  - [ ] 10.1 Create `doctor/dashboard.html` with summary cards and assigned patients list
    - Display today's appointments count and assigned patients count via real-time listeners
    - List all assigned appointments with patient name, problem title, date, time
    - _Requirements: 9.1, 9.2, 9.3, 21.2, 21.4_

  - [ ] 10.2 Create `doctor/patient-details.html` with patient details, history, and prescription form
    - Display patient profile (read-only), patient history (past appointments + prescriptions, descending date order)
    - Prescription form: medicine name, dosage, frequency fields with add/remove rows, notes field
    - On submit: create prescription, update appointment status to "prescribed", prescription is immutable
    - "Mark as Completed" button for prescribed appointments
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 17.4, 17.5, 19.4_

  - [ ]* 10.3 Write property test for patient history ordering (`tests/property/ordering.property.test.js`)
    - **Property 21: Patient history ordered by date descending**
    - **Validates: Requirements 10.4**

- [ ] 11. Checkpoint
  - Ensure all three role modules render correctly, CRUD operations work, and role-based access is enforced. Ask the user if questions arise.

- [ ] 12. Notifications system
  - [ ] 12.1 Create `js/notifications.js` with notification functions
    - Implement `createNotification`, `onNotificationsChange`, `markAsRead`, `getUnreadCount`, `setupNotificationBadge`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [ ] 12.2 Create notification pages (`patient/notifications.html`, `doctor/notifications.html`, `admin/notifications.html`)
    - Display notifications list ordered by date descending, mark as read on view, unread badge in nav
    - _Requirements: 14.5, 14.6, 14.7_

  - [ ] 12.3 Wire notification creation into existing flows
    - Assignment → notify patient + doctor; Prescription → notify patient; Problem submission/follow-up → notify admin; Cancellation → notify doctor + admin; Completion → notify patient
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 17.7, 17.8_

  - [ ]* 12.4 Write property tests for notifications
    - **Property 13: Event-driven notification creation** (`tests/property/notifications.property.test.js`)
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 17.7, 17.8**
    - **Property 14: Notification unread count accuracy** (`tests/property/notifications.property.test.js`)
    - **Validates: Requirements 14.5, 14.7**
    - **Property 15: Notifications ordered by date descending** (`tests/property/notifications.property.test.js`)
    - **Validates: Requirements 14.6**

- [ ] 13. Search and filter
  - [ ] 13.1 Create `js/search-filter.js` with search and filter logic
    - Implement `filterByText`, `filterByStatus`, `applyFilters`, `setupSearchFilter`
    - _Requirements: 16.2, 16.3, 16.4, 16.6, 16.7, 16.8_

  - [ ] 13.2 Wire search/filter into admin and doctor dashboards
    - Add search input and status dropdown above lists on `admin/dashboard.html` and `doctor/dashboard.html`
    - _Requirements: 16.1, 16.5_

  - [ ]* 13.3 Write property test for search and filter (`tests/property/search-filter.property.test.js`)
    - **Property 18: Combined search and status filter**
    - **Validates: Requirements 16.2, 16.3, 16.4, 16.6, 16.7, 16.8**

- [ ] 14. PDF export
  - [ ] 14.1 Create `js/pdf-export.js` with PDF generation and print functions
    - Implement `generatePrescriptionPDF` using jsPDF (CDN), `printPrescription` using browser print dialog
    - Include clinic name, date, doctor/patient names, medicines table, notes
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [ ] 14.2 Wire PDF export into `patient/prescriptions.html`
    - Add "Download PDF" and "Print" buttons to prescription detail view
    - _Requirements: 20.1_

  - [ ] 14.3 Create `css/print.css` for print-friendly prescription layout
    - _Requirements: 20.3_

- [ ] 15. CSS styling and responsive layout
  - [ ] 15.1 Create `css/style.css` with global styles
    - Base styles, navigation (with hamburger menu for mobile), form styles, card components, summary cards, notification badge, list styles
    - _Requirements: 23.1, 23.6_

  - [ ] 15.2 Add responsive media queries
    - Landing page sections stack vertically below 768px, forms usable at 320px, dashboards single-column on mobile, touch-friendly buttons/inputs
    - _Requirements: 23.2, 23.3, 23.4, 23.5, 23.6, 23.7_

- [ ] 16. Firestore security rules
  - [ ] 16.1 Create `firestore.rules` with role-based security rules
    - Users: read own + admin/doctor can read others, patients update own profile only
    - Problem submissions: patients create own, admin reads all, admin updates status
    - Appointments: admin creates, relevant users read, status updates by role
    - Prescriptions: doctors create, relevant users read, no updates (immutable)
    - Notifications: authenticated users create, users read/update own
    - _Requirements: 3.1, 3.2, 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ]* 16.2 Write property tests for security rules
    - **Property 10: Prescription immutability** (`tests/property/status-transitions.property.test.js`)
    - **Validates: Requirements 11.6**
    - **Property 23: Patient profile is read-only for non-patient roles** (`tests/property/profile-roundtrip.property.test.js`)
    - **Validates: Requirements 19.4, 19.5**
    - **Property 20: Admin views all appointments regardless of status** (`tests/property/data-filtering.property.test.js`)
    - **Validates: Requirements 17.6**

- [ ] 17. Dashboard summary stats wiring
  - [ ] 17.1 Wire real-time summary stats into all three dashboards
    - Admin: pending count, assigned count, doctor count; Doctor: today's appointments, assigned patients; Patient: upcoming appointments, prescriptions count
    - Use `onStatsChange` real-time listener for live updates
    - _Requirements: 21.1, 21.2, 21.3, 21.4_

  - [ ]* 17.2 Write property test for summary stats (`tests/property/summary-stats.property.test.js`)
    - **Property 25: Dashboard summary stats match actual data counts**
    - **Validates: Requirements 21.1, 21.2, 21.3**

- [ ] 18. Follow-up request wiring
  - [ ] 18.1 Wire follow-up request flow in `patient/appointments.html`
    - Follow-up form creates new problem submission with type "follow-up" and reference to original appointment
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ]* 18.2 Write property test for follow-up requests (`tests/property/data-filtering.property.test.js`)
    - **Property 12: Follow-up request creates submission with correct type and reference**
    - **Validates: Requirements 13.3**

- [ ] 19. Final checkpoint
  - Ensure all tests pass, all pages render correctly, notifications fire on all events, search/filter works on dashboards, PDF export generates correctly, responsive layout adapts on mobile. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All JS modules use ES module imports; Firebase SDK loaded via CDN
- jsPDF loaded via CDN for PDF generation
