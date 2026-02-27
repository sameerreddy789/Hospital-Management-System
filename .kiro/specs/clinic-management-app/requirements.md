# Requirements Document

## Introduction

A clinic/hospital management web application with three user modules: Admin, Doctor, and Patient. The application enables patients to self-register and submit health problems, admins to assign patients to doctors with scheduled dates/times, doctors to prescribe medicines (final once submitted), and patients to view prescriptions and request follow-up appointments (routed back through Admin). Doctor and Admin accounts are pre-provisioned. Built with Firebase (authentication, Firestore, hosting) and vanilla HTML/CSS/JavaScript. Includes simple in-app notifications via Firestore real-time listeners.

## Glossary

- **Application**: The clinic management web application
- **Patient_Module**: The interface and functionality available to users with the Patient role
- **Admin_Module**: The interface and functionality available to users with the Admin role
- **Doctor_Module**: The interface and functionality available to users with the Doctor role
- **Auth_System**: The Firebase Authentication-based system handling user login, patient registration, and session management
- **Problem_Submission**: A record created by a patient containing a description of their health issue
- **Doctor_List**: The collection of pre-provisioned doctors visible to the Admin for assignment purposes
- **Assignment**: The act of an Admin linking a Patient's problem submission to a specific Doctor with a scheduled date and time
- **Appointment**: A scheduled interaction between a Doctor and a Patient at a specific date and time, created as a result of an Assignment
- **Prescription**: A final, immutable record of medicines and instructions created by a Doctor for a Patient after an appointment
- **Follow_Up_Request**: A request initiated by a Patient for a review appointment, routed back through the Admin for reassignment
- **Landing_Page**: The public-facing home page of the application with About, Services, and Contact sections
- **Dashboard**: The role-specific home page shown to authenticated users after login
- **Notification_System**: The in-app notification mechanism using Firestore real-time listeners to alert users of relevant events
- **Patient_History**: The collection of a patient's past appointments, problem descriptions, and prescriptions viewable by the assigned Doctor
- **Search_Filter**: The interface component allowing users to search by text input and filter by predefined status values on dashboard lists
- **Appointment_Status**: The lifecycle state of an Appointment, one of "assigned", "prescribed", "completed", or "cancelled"
- **Conflict_Check**: The validation process that verifies a Doctor has no existing Appointment at a requested date and time before allowing a new Assignment
- **Patient_Profile**: The editable record of a patient's basic information including name and contact details
- **Prescription_Export**: The functionality to generate a downloadable or printable document from a Prescription record
- **Summary_Card**: A dashboard UI component displaying an aggregated count or metric relevant to the user's role
- **Password_Reset_Flow**: The process by which a user requests and completes a password reset using Firebase Authentication's sendPasswordResetEmail method
- **Responsive_Layout**: The set of CSS media queries and flexible layout techniques ensuring all Application pages adapt to different screen sizes including mobile devices

## Requirements

### Requirement 1: Landing Page

**User Story:** As a visitor, I want to see a landing page with information about the clinic, so that I can understand the services offered and navigate to login or registration.

#### Acceptance Criteria

1. THE Application SHALL display a Landing_Page with an About section, a Services section, and a Contact section
2. THE Landing_Page SHALL display a login button and a patient registration button in the navigation area
3. WHEN a visitor clicks the login button, THE Application SHALL navigate to the login page
4. WHEN a visitor clicks the registration button, THE Application SHALL navigate to the patient registration page

### Requirement 2: Patient Registration

**User Story:** As a new patient, I want to register an account, so that I can access the Patient_Module and submit health problems.

#### Acceptance Criteria

1. THE Auth_System SHALL provide a registration form requesting full name, email, and password for patient self-registration
2. WHEN a patient submits a valid registration form, THE Auth_System SHALL create a new user account in Firebase Authentication and store the user profile (name, email, role set to "patient") in Firestore
3. IF a patient submits a registration form with an email that already exists, THEN THE Auth_System SHALL display an error message indicating the email is already registered
4. IF a patient submits a registration form with missing or invalid fields, THEN THE Auth_System SHALL display specific validation error messages for each invalid field
5. WHEN registration is successful, THE Auth_System SHALL redirect the patient to the login page

### Requirement 3: Pre-Provisioned Doctor and Admin Accounts

**User Story:** As a clinic administrator, I want Doctor and Admin accounts to be pre-created, so that only authorized personnel can access those roles.

#### Acceptance Criteria

1. THE Auth_System SHALL support pre-provisioned Doctor accounts with credentials stored in Firebase Authentication and profiles (name, email, role set to "doctor") stored in Firestore
2. THE Auth_System SHALL support a single pre-provisioned Admin account with credentials stored in Firebase Authentication and a profile (name, email, role set to "admin") stored in Firestore
3. THE Auth_System SHALL restrict the registration page to patient role only, with no option to register as Doctor or Admin

### Requirement 4: User Login and Session Management

**User Story:** As a registered user, I want to log in with my credentials, so that I can access my role-specific dashboard.

#### Acceptance Criteria

1. THE Auth_System SHALL provide a login form requesting email and password
2. WHEN a user submits valid credentials, THE Auth_System SHALL authenticate the user via Firebase Authentication and redirect to the appropriate Dashboard based on the user role
3. IF a user submits invalid credentials, THEN THE Auth_System SHALL display an error message indicating incorrect email or password
4. WHILE a user is authenticated, THE Auth_System SHALL maintain the session using Firebase Auth state persistence
5. WHEN a user clicks the logout button, THE Auth_System SHALL end the session and redirect to the Landing_Page

### Requirement 5: Patient Problem Submission

**User Story:** As a patient, I want to submit my health problem with a description, so that the admin can review it and assign me to a doctor.

#### Acceptance Criteria

1. WHEN a Patient navigates to the problem submission page, THE Patient_Module SHALL display a form with fields for problem title and detailed description
2. WHEN a Patient submits a valid problem form, THE Patient_Module SHALL create a Problem_Submission record in Firestore with the patient ID, problem title, description, submission timestamp, and a status of "pending"
3. IF a Patient submits a problem form with empty required fields, THEN THE Patient_Module SHALL display validation error messages
4. WHEN a Problem_Submission is created successfully, THE Patient_Module SHALL display a confirmation message and show the submission in the patient's submission history

### Requirement 6: Admin Views Patient Requests

**User Story:** As an admin, I want to see all pending patient problem submissions, so that I can review them and assign patients to doctors.

#### Acceptance Criteria

1. WHEN an Admin navigates to the Admin_Module Dashboard, THE Admin_Module SHALL display a list of all Problem_Submissions with status "pending"
2. THE Admin_Module SHALL display each Problem_Submission with the patient name, problem title, description, and submission date
3. THE Admin_Module SHALL provide a way to view the full details of each Problem_Submission

### Requirement 7: Admin Assigns Patient to Doctor with Scheduled Date and Time

**User Story:** As an admin, I want to see the list of available doctors and assign a patient to a doctor with a specific date and time, so that the patient receives a scheduled appointment.

#### Acceptance Criteria

1. WHEN an Admin selects a Problem_Submission for assignment, THE Admin_Module SHALL display the Doctor_List showing each doctor's name and email
2. WHEN an Admin selects a Doctor from the Doctor_List, THE Admin_Module SHALL display a date picker and time picker for scheduling the appointment
3. WHEN an Admin selects a Doctor, date, and time and confirms the assignment, THE Admin_Module SHALL create an Appointment record in Firestore linking the Patient, Doctor, Problem_Submission, scheduled date, and scheduled time
4. WHEN an Assignment is completed, THE Admin_Module SHALL update the Problem_Submission status from "pending" to "assigned"
5. IF an Admin attempts to confirm an assignment without selecting a date or time, THEN THE Admin_Module SHALL display a validation error message

### Requirement 8: Patient Views Appointment Details

**User Story:** As a patient, I want to view my appointment details, so that I know which doctor I am assigned to and when.

#### Acceptance Criteria

1. WHEN a Patient navigates to the appointments section, THE Patient_Module SHALL display a list of all Appointments associated with the Patient
2. THE Patient_Module SHALL display each Appointment with the doctor name, scheduled date, scheduled time, and current status
3. WHILE an Appointment status is "assigned", THE Patient_Module SHALL indicate that the appointment is upcoming

### Requirement 9: Doctor Views Assigned Patients

**User Story:** As a doctor, I want to see the list of patients assigned to me, so that I can review their problems and provide prescriptions.

#### Acceptance Criteria

1. WHEN a Doctor navigates to the Doctor_Module Dashboard, THE Doctor_Module SHALL display a list of all Appointments assigned to the Doctor
2. THE Doctor_Module SHALL display each Appointment with the patient name, problem title, problem description, scheduled date, and scheduled time
3. THE Doctor_Module SHALL provide a way to view the full details of each assigned patient's Problem_Submission

### Requirement 10: Doctor Views Patient History

**User Story:** As a doctor, I want to view a patient's history including past appointments, problem descriptions, and prescriptions, so that I can make informed treatment decisions.

#### Acceptance Criteria

1. WHEN a Doctor views an assigned patient's details, THE Doctor_Module SHALL display the Patient_History section showing all past Appointments for that patient
2. THE Doctor_Module SHALL display each past Appointment with the problem title, problem description, appointment date, and assigned doctor name
3. THE Doctor_Module SHALL display all past Prescriptions for the patient, including medicine names, dosages, frequencies, and notes
4. THE Doctor_Module SHALL order the Patient_History entries by date in descending order (most recent first)

### Requirement 11: Doctor Prescribes Medicines

**User Story:** As a doctor, I want to prescribe medicines for a patient, so that the patient can view the prescription and follow the treatment.

#### Acceptance Criteria

1. WHEN a Doctor selects an Appointment, THE Doctor_Module SHALL display a prescription form with fields for medicine name, dosage, frequency, and additional notes
2. THE Doctor_Module SHALL allow the Doctor to add multiple medicines to a single Prescription
3. WHEN a Doctor submits a valid Prescription, THE Doctor_Module SHALL create a Prescription record in Firestore linked to the Appointment, Patient, and Doctor
4. WHEN a Prescription is created, THE Doctor_Module SHALL update the Appointment status to "prescribed"
5. IF a Doctor submits a Prescription with empty required fields, THEN THE Doctor_Module SHALL display validation error messages
6. WHEN a Prescription is submitted, THE Doctor_Module SHALL make the Prescription immutable, preventing any further edits

### Requirement 12: Patient Views Prescriptions

**User Story:** As a patient, I want to view my prescriptions, so that I can follow the treatment plan prescribed by my doctor.

#### Acceptance Criteria

1. WHEN a Patient navigates to the prescriptions section, THE Patient_Module SHALL display a list of all Prescriptions associated with the Patient
2. THE Patient_Module SHALL display each Prescription with the doctor name, date, list of medicines (name, dosage, frequency), and additional notes
3. THE Patient_Module SHALL allow the Patient to view the full details of each Prescription

### Requirement 13: Patient Requests Follow-Up Appointment

**User Story:** As a patient, I want to request a follow-up appointment after my initial consultation, so that the admin can reassign me to a doctor for further review.

#### Acceptance Criteria

1. WHEN a Patient views a completed Appointment (status "prescribed"), THE Patient_Module SHALL display a "Request Follow-Up" button
2. WHEN a Patient clicks the "Request Follow-Up" button, THE Patient_Module SHALL display a form for follow-up reason and description
3. WHEN a Patient submits a valid Follow_Up_Request, THE Patient_Module SHALL create a new Problem_Submission in Firestore with a status of "pending", a type of "follow-up", and a reference to the original Appointment
4. WHEN a Follow_Up_Request is created, THE Admin_Module SHALL include the follow-up Problem_Submission in the pending requests list for reassignment through the standard assignment flow
5. IF a Patient submits a Follow_Up_Request with empty required fields, THEN THE Patient_Module SHALL display validation error messages

### Requirement 14: In-App Notifications

**User Story:** As a user, I want to receive in-app notifications for relevant events, so that I stay informed about updates to my appointments, assignments, and prescriptions.

#### Acceptance Criteria

1. WHEN an Admin assigns a Patient to a Doctor, THE Notification_System SHALL create a notification for the Patient indicating the appointment details and scheduled date/time
2. WHEN an Admin assigns a Patient to a Doctor, THE Notification_System SHALL create a notification for the Doctor indicating a new patient assignment
3. WHEN a Doctor submits a Prescription, THE Notification_System SHALL create a notification for the Patient indicating a new prescription is available
4. WHEN a Patient submits a Problem_Submission or Follow_Up_Request, THE Notification_System SHALL create a notification for the Admin indicating a new pending request
5. THE Notification_System SHALL display a notification indicator (badge with unread count) in the Dashboard navigation for each user role
6. WHEN a user clicks the notification indicator, THE Notification_System SHALL display a list of notifications ordered by date (most recent first)
7. WHEN a user views a notification, THE Notification_System SHALL mark the notification as read and update the unread count

### Requirement 15: Role-Based Access Control

**User Story:** As a system administrator, I want each user to only access their role-specific pages, so that unauthorized access is prevented.

#### Acceptance Criteria

1. WHILE a user is not authenticated, THE Auth_System SHALL redirect any attempt to access a protected page to the login page
2. WHILE a Patient is authenticated, THE Auth_System SHALL restrict access to Patient_Module pages only
3. WHILE a Doctor is authenticated, THE Auth_System SHALL restrict access to Doctor_Module pages only
4. WHILE an Admin is authenticated, THE Auth_System SHALL restrict access to Admin_Module pages only
5. IF an authenticated user attempts to access a page outside their role, THEN THE Auth_System SHALL redirect the user to their role-specific Dashboard


### Requirement 16: Search and Filter on Dashboards

**User Story:** As an admin or doctor, I want to search and filter lists on my dashboard, so that I can quickly find specific patient requests or appointments.

#### Acceptance Criteria

1. THE Admin_Module Dashboard SHALL display a Search_Filter component above the patient requests list
2. WHEN an Admin enters text in the search field, THE Admin_Module SHALL filter the displayed Problem_Submissions to show only entries where the patient name contains the search text
3. WHEN an Admin selects a status filter value (pending, assigned, or prescribed), THE Admin_Module SHALL filter the displayed Problem_Submissions to show only entries matching the selected status
4. WHEN an Admin applies both a search term and a status filter, THE Admin_Module SHALL display only Problem_Submissions matching both criteria
5. THE Doctor_Module Dashboard SHALL display a Search_Filter component above the patient list
6. WHEN a Doctor enters text in the search field, THE Doctor_Module SHALL filter the displayed Appointments to show only entries where the patient name contains the search text
7. WHEN a Doctor selects an Appointment_Status filter value, THE Doctor_Module SHALL filter the displayed Appointments to show only entries matching the selected status
8. WHEN a user clears the search field or resets the filter, THE Dashboard SHALL display the full unfiltered list

### Requirement 17: Appointment Status Tracking

**User Story:** As a user, I want appointments to have completed and cancelled statuses, so that the full lifecycle of an appointment is tracked.

#### Acceptance Criteria

1. THE Application SHALL support the following Appointment_Status values: "assigned", "prescribed", "completed", and "cancelled"
2. WHILE an Appointment has status "assigned" and the scheduled date is in the future, THE Patient_Module SHALL display a "Cancel Appointment" button for that Appointment
3. WHEN a Patient clicks the "Cancel Appointment" button and confirms the cancellation, THE Patient_Module SHALL update the Appointment_Status to "cancelled" in Firestore
4. WHILE an Appointment has status "prescribed", THE Doctor_Module SHALL display a "Mark as Completed" button for that Appointment
5. WHEN a Doctor clicks the "Mark as Completed" button, THE Doctor_Module SHALL update the Appointment_Status to "completed" in Firestore
6. THE Admin_Module SHALL display all Appointments regardless of Appointment_Status, including "completed" and "cancelled"
7. WHEN an Appointment is cancelled, THE Notification_System SHALL create a notification for the assigned Doctor and the Admin indicating the cancellation
8. WHEN an Appointment is marked as completed, THE Notification_System SHALL create a notification for the Patient indicating the appointment is completed

### Requirement 18: Doctor Availability and Conflict Check

**User Story:** As an admin, I want the system to check doctor availability before assigning an appointment, so that double-booking is prevented.

#### Acceptance Criteria

1. WHEN an Admin selects a Doctor, date, and time for an Assignment, THE Admin_Module SHALL perform a Conflict_Check against existing Appointments for the selected Doctor at the specified date and time
2. IF the Conflict_Check detects an existing Appointment for the selected Doctor at the specified date and time, THEN THE Admin_Module SHALL display a warning message indicating the Doctor is already booked at that time slot
3. IF the Conflict_Check detects a conflict, THEN THE Admin_Module SHALL prevent the Assignment from being confirmed until the Admin selects a different date, time, or Doctor
4. WHEN the Conflict_Check finds no existing Appointment for the selected Doctor at the specified date and time, THE Admin_Module SHALL allow the Admin to confirm the Assignment

### Requirement 19: Patient Profile Page

**User Story:** As a patient, I want to view and edit my profile information, so that my contact details are up to date.

#### Acceptance Criteria

1. WHEN a Patient navigates to the Patient_Profile page, THE Patient_Module SHALL display the patient's name, email, and contact details in an editable form
2. WHEN a Patient updates profile fields and submits the form, THE Patient_Module SHALL save the updated Patient_Profile to Firestore and display a confirmation message
3. IF a Patient submits the profile form with missing or invalid required fields, THEN THE Patient_Module SHALL display specific validation error messages
4. WHEN a Doctor views an assigned patient's details, THE Doctor_Module SHALL display the Patient_Profile information in read-only mode
5. WHEN an Admin views a patient's details, THE Admin_Module SHALL display the Patient_Profile information in read-only mode

### Requirement 20: Prescription Download and Print

**User Story:** As a patient, I want to download or print my prescription, so that I can share it with a pharmacist or keep a physical copy.

#### Acceptance Criteria

1. WHEN a Patient views a Prescription, THE Patient_Module SHALL display a "Download PDF" button and a "Print" button
2. WHEN a Patient clicks the "Download PDF" button, THE Patient_Module SHALL generate a Prescription_Export in PDF format containing the doctor name, patient name, date, list of medicines (name, dosage, frequency), and additional notes
3. WHEN a Patient clicks the "Print" button, THE Patient_Module SHALL open the browser print dialog with a print-friendly view of the Prescription
4. THE Prescription_Export SHALL include the clinic name and date of generation as a header

### Requirement 21: Dashboard Summary Stats

**User Story:** As a user, I want to see summary statistics on my dashboard, so that I can get a quick overview of key metrics relevant to my role.

#### Acceptance Criteria

1. WHEN an Admin navigates to the Admin_Module Dashboard, THE Admin_Module SHALL display Summary_Cards showing the total count of pending Problem_Submissions, the total count of assigned Appointments, and the total count of Doctors in the system
2. WHEN a Doctor navigates to the Doctor_Module Dashboard, THE Doctor_Module SHALL display Summary_Cards showing the count of today's Appointments and the total count of assigned Patients
3. WHEN a Patient navigates to the Patient_Module Dashboard, THE Patient_Module SHALL display Summary_Cards showing the count of upcoming Appointments and the total count of Prescriptions
4. WHEN underlying data changes, THE Dashboard SHALL update the Summary_Card counts in real time using Firestore real-time listeners

### Requirement 22: Password Reset

**User Story:** As a registered user, I want to reset my password via a "Forgot Password" link on the login page, so that I can regain access to my account if I forget my credentials.

#### Acceptance Criteria

1. THE Auth_System SHALL display a "Forgot Password" link on the login page
2. WHEN a user clicks the "Forgot Password" link, THE Auth_System SHALL display a form requesting the user's registered email address
3. WHEN a user submits a valid registered email address, THE Auth_System SHALL invoke Firebase Authentication's sendPasswordResetEmail method to send a password reset email to the provided address
4. WHEN the password reset email is sent successfully, THE Auth_System SHALL display a confirmation message indicating that a reset email has been sent
5. IF a user submits an email address that is not registered, THEN THE Auth_System SHALL display an error message indicating that no account exists for the provided email
6. IF a user submits the password reset form with an empty or invalid email field, THEN THE Auth_System SHALL display a validation error message
7. WHEN a user follows the password reset link in the email and submits a new password, THE Auth_System SHALL update the user's password in Firebase Authentication

### Requirement 23: Responsive and Mobile-Friendly Layout

**User Story:** As a user, I want the application to be responsive and mobile-friendly, so that I can access all features comfortably on any device including smartphones and tablets.

#### Acceptance Criteria

1. THE Application SHALL use CSS media queries and flexible layout techniques to implement a Responsive_Layout across all pages
2. THE Landing_Page SHALL adapt its About, Services, and Contact sections to stack vertically on screen widths below 768 pixels
3. THE Auth_System login and registration forms SHALL scale and remain usable on screen widths down to 320 pixels
4. WHILE a user accesses any Dashboard on a mobile device, THE Application SHALL reorganize Summary_Cards and list views into a single-column layout
5. THE Patient_Module, Doctor_Module, and Admin_Module forms SHALL adjust input field widths and button sizes to remain accessible on touch-based devices
6. THE Application navigation SHALL collapse into a hamburger menu on screen widths below 768 pixels
7. WHILE a Patient accesses the Patient_Module on a mobile device, THE Patient_Module SHALL prioritize readability of Appointment details and Prescription information with appropriately sized text and spacing
