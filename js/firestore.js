// Firestore CRUD operations
// All database read/write operations for the clinic management app
// Attached to window object for cross-file access

// ============================================================
// Problem Submissions
// ============================================================

/**
 * Creates a new problem submission.
 * @param {string} patientId - Patient UID
 * @param {string} title - Problem title
 * @param {string} description - Problem description
 * @param {string} [type='initial'] - 'initial' or 'follow-up'
 * @param {string} [originalAppointmentId=null] - For follow-ups
 * @param {Object} [extras=null] - Additional fields (primaryConcern, bodyArea, painLevel, urgency)
 * @returns {Promise<string>} Submission ID
 */
function createProblemSubmission(patientId, title, description, type, originalAppointmentId, extras) {
  return db.collection('users').doc(patientId).get().then(function (userDoc) {
    var patientName = userDoc.exists ? userDoc.data().name : 'Unknown';
    var docData = {
      patientId: patientId,
      patientName: patientName,
      title: title,
      description: description,
      status: 'pending',
      type: type || 'initial',
      originalAppointmentId: originalAppointmentId || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    // Merge extra fields if provided
    if (extras) {
      for (var key in extras) {
        if (extras.hasOwnProperty(key)) {
          docData[key] = extras[key];
        }
      }
    }
    return db.collection('problemSubmissions').add(docData);
  }).then(function (docRef) {
    return docRef.id;
  });
}

/**
 * Gets all pending problem submissions (for admin).
 * @returns {Promise<Array>}
 */
function getPendingSubmissions() {
  return db.collection('problemSubmissions')
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .get()
    .then(function (snapshot) {
      var results = [];
      snapshot.forEach(function (doc) {
        results.push(Object.assign({ id: doc.id }, doc.data()));
      });
      return results;
    });
}

/**
 * Gets problem submissions by patient.
 * @param {string} patientId - Patient UID
 * @returns {Promise<Array>}
 */
function getSubmissionsByPatient(patientId) {
  return db.collection('problemSubmissions')
    .where('patientId', '==', patientId)
    .orderBy('createdAt', 'desc')
    .get()
    .then(function (snapshot) {
      var results = [];
      snapshot.forEach(function (doc) {
        results.push(Object.assign({ id: doc.id }, doc.data()));
      });
      return results;
    });
}

/**
 * Updates a problem submission's status.
 * @param {string} submissionId - Submission ID
 * @param {string} status - New status ('pending' or 'assigned')
 * @returns {Promise<void>}
 */
function updateSubmissionStatus(submissionId, status) {
  return db.collection('problemSubmissions').doc(submissionId).update({ status: status });
}

// ============================================================
// Appointments
// ============================================================

/**
 * Creates a new appointment.
 * @returns {Promise<string>} Appointment ID
 */
function createAppointment(patientId, doctorId, submissionId, date, time) {
  return Promise.all([
    db.collection('users').doc(patientId).get(),
    db.collection('users').doc(doctorId).get(),
    db.collection('problemSubmissions').doc(submissionId).get()
  ]).then(function (docs) {
    var patientName = docs[0].exists ? docs[0].data().name : 'Unknown';
    var doctorName = docs[1].exists ? docs[1].data().name : 'Unknown';
    var submission = docs[2].exists ? docs[2].data() : {};
    return db.collection('appointments').add({
      patientId: patientId,
      patientName: patientName,
      doctorId: doctorId,
      doctorName: doctorName,
      submissionId: submissionId,
      problemTitle: submission.title || '',
      problemDescription: submission.description || '',
      scheduledDate: date,
      scheduledTime: time,
      status: 'assigned',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).then(function (docRef) {
    return docRef.id;
  });
}

/**
 * Gets appointments by patient.
 * @param {string} patientId - Patient UID
 * @returns {Promise<Array>}
 */
function getAppointmentsByPatient(patientId) {
  return db.collection('appointments')
    .where('patientId', '==', patientId)
    .orderBy('scheduledDate', 'desc')
    .get()
    .then(function (snapshot) {
      var results = [];
      snapshot.forEach(function (doc) {
        results.push(Object.assign({ id: doc.id }, doc.data()));
      });
      return results;
    });
}

/**
 * Gets appointments by doctor.
 * @param {string} doctorId - Doctor UID
 * @returns {Promise<Array>}
 */
function getAppointmentsByDoctor(doctorId) {
  return db.collection('appointments')
    .where('doctorId', '==', doctorId)
    .orderBy('scheduledDate', 'desc')
    .get()
    .then(function (snapshot) {
      var results = [];
      snapshot.forEach(function (doc) {
        results.push(Object.assign({ id: doc.id }, doc.data()));
      });
      return results;
    });
}

/**
 * Gets all appointments (for admin).
 * @returns {Promise<Array>}
 */
function getAllAppointments() {
  return db.collection('appointments')
    .orderBy('scheduledDate', 'desc')
    .get()
    .then(function (snapshot) {
      var results = [];
      snapshot.forEach(function (doc) {
        results.push(Object.assign({ id: doc.id }, doc.data()));
      });
      return results;
    });
}

/**
 * Updates an appointment's status.
 * @param {string} appointmentId - Appointment ID
 * @param {string} status - New status
 * @returns {Promise<void>}
 */
function updateAppointmentStatus(appointmentId, status) {
  return db.collection('appointments').doc(appointmentId).update({ status: status });
}

/**
 * Checks if a doctor has a conflicting appointment at the given date/time.
 * @param {string} doctorId - Doctor UID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM format
 * @returns {Promise<boolean>} True if conflict exists
 */
function checkDoctorConflict(doctorId, date, time) {
  return db.collection('appointments')
    .where('doctorId', '==', doctorId)
    .where('scheduledDate', '==', date)
    .where('scheduledTime', '==', time)
    .where('status', 'in', ['assigned', 'prescribed'])
    .get()
    .then(function (snapshot) {
      return !snapshot.empty;
    });
}

// ============================================================
// Prescriptions
// ============================================================

/**
 * Creates a new prescription (immutable once created).
 * @param {string} appointmentId - Appointment ID
 * @param {string} patientId - Patient UID
 * @param {string} doctorId - Doctor UID
 * @param {Array} medicines - Array of {name, dosage, frequency}
 * @param {string} notes - Doctor notes
 * @returns {Promise<string>} Prescription ID
 */
function createPrescription(appointmentId, patientId, doctorId, medicines, notes) {
  return Promise.all([
    db.collection('users').doc(doctorId).get(),
    db.collection('users').doc(patientId).get()
  ]).then(function (docs) {
    var doctorName = docs[0].exists ? docs[0].data().name : 'Unknown';
    var patientName = docs[1].exists ? docs[1].data().name : 'Unknown';
    return db.collection('prescriptions').add({
      appointmentId: appointmentId,
      patientId: patientId,
      patientName: patientName,
      doctorId: doctorId,
      doctorName: doctorName,
      medicines: medicines,
      notes: notes || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).then(function (docRef) {
    return docRef.id;
  });
}

/**
 * Gets prescriptions by patient.
 * @param {string} patientId - Patient UID
 * @returns {Promise<Array>}
 */
function getPrescriptionsByPatient(patientId) {
  return db.collection('prescriptions')
    .where('patientId', '==', patientId)
    .orderBy('createdAt', 'desc')
    .get()
    .then(function (snapshot) {
      var results = [];
      snapshot.forEach(function (doc) {
        results.push(Object.assign({ id: doc.id }, doc.data()));
      });
      return results;
    });
}

/**
 * Gets prescriptions by appointment.
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Array>}
 */
function getPrescriptionsByAppointment(appointmentId) {
  return db.collection('prescriptions')
    .where('appointmentId', '==', appointmentId)
    .get()
    .then(function (snapshot) {
      var results = [];
      snapshot.forEach(function (doc) {
        results.push(Object.assign({ id: doc.id }, doc.data()));
      });
      return results;
    });
}

// ============================================================
// Users and Patient History
// ============================================================

/**
 * Gets list of all doctors.
 * @returns {Promise<Array>}
 */
function getDoctorList() {
  return db.collection('users')
    .where('role', '==', 'doctor')
    .get()
    .then(function (snapshot) {
      var results = [];
      snapshot.forEach(function (doc) {
        results.push(Object.assign({ id: doc.id }, doc.data()));
      });
      return results;
    });
}

/**
 * Gets a user's profile.
 * @param {string} uid - User UID
 * @returns {Promise<Object>}
 */
function getUserProfile(uid) {
  return db.collection('users').doc(uid).get().then(function (doc) {
    if (!doc.exists) return null;
    return Object.assign({ id: doc.id }, doc.data());
  });
}

/**
 * Updates a patient's profile.
 * @param {string} uid - Patient UID
 * @param {Object} data - Fields to update (name, phone, address)
 * @returns {Promise<void>}
 */
function updatePatientProfile(uid, data) {
  return db.collection('users').doc(uid).update(data);
}

/**
 * Gets a patient's full history (appointments + prescriptions).
 * @param {string} patientId - Patient UID
 * @returns {Promise<{appointments: Array, prescriptions: Array}>}
 */
function getPatientHistory(patientId) {
  return Promise.all([
    getAppointmentsByPatient(patientId),
    getPrescriptionsByPatient(patientId)
  ]).then(function (results) {
    return { appointments: results[0], prescriptions: results[1] };
  });
}

// ============================================================
// Real-time Listeners
// ============================================================

/**
 * Listens for changes to pending submissions (admin).
 * @param {Function} callback - Called with array of submissions
 * @returns {Function} Unsubscribe function
 */
function onSubmissionsChange(callback) {
  return db.collection('problemSubmissions')
    .where('status', '==', 'pending')
    .onSnapshot(function (snapshot) {
      var results = [];
      snapshot.forEach(function (doc) {
        results.push(Object.assign({ id: doc.id }, doc.data()));
      });
      // Sort in JS to avoid index requirement
      results.sort(function (a, b) {
        var t1 = (a.createdAt && a.createdAt.seconds) ? a.createdAt.seconds : 0;
        var t2 = (b.createdAt && b.createdAt.seconds) ? b.createdAt.seconds : 0;
        return t2 - t1;
      });
      callback(results);
    }, function (err) {
      console.error("Submissions listener error:", err);
      callback([]);
    });
}

/**
 * Listens for changes to appointments.
 * @param {string} userId - User UID
 * @param {string} role - 'patient', 'doctor', or 'admin'
 * @param {Function} callback - Called with array of appointments
 * @returns {Function} Unsubscribe function
 */
function onAppointmentsChange(userId, role, callback) {
  var query;
  if (role === 'admin') {
    query = db.collection('appointments');
  } else if (role === 'doctor') {
    query = db.collection('appointments').where('doctorId', '==', userId);
  } else {
    query = db.collection('appointments').where('patientId', '==', userId);
  }
  return query.onSnapshot(function (snapshot) {
    var results = [];
    snapshot.forEach(function (doc) {
      results.push(Object.assign({ id: doc.id }, doc.data()));
    });
    // Sort in JS
    results.sort(function (a, b) {
      var d1 = a.scheduledDate || '';
      var d2 = b.scheduledDate || '';
      if (d1 !== d2) return d2.localeCompare(d1);
      return (b.scheduledTime || '').localeCompare(a.scheduledTime || '');
    });
    callback(results);
  }, function (err) {
    console.error("Appointments listener error:", err);
    callback([]);
  });
}

/**
 * Listens for stats changes for dashboard summary cards.
 * @param {string} role - 'patient', 'doctor', or 'admin'
 * @param {string} userId - User UID
 * @param {Function} callback - Called with stats object
 * @returns {Function} Unsubscribe function
 */
function onStatsChange(role, userId, callback) {
  var unsubscribers = [];

  if (role === 'admin') {
    unsubscribers.push(
      db.collection('problemSubmissions').where('status', '==', 'pending')
        .onSnapshot(function (snap) { callback({ pendingCount: snap.size }); })
    );
    unsubscribers.push(
      db.collection('appointments').where('status', '==', 'assigned')
        .onSnapshot(function (snap) { callback({ assignedCount: snap.size }); })
    );
    unsubscribers.push(
      db.collection('users').where('role', '==', 'doctor')
        .onSnapshot(function (snap) { callback({ doctorCount: snap.size }); })
    );
  } else if (role === 'doctor') {
    var today = new Date().toISOString().split('T')[0];
    unsubscribers.push(
      db.collection('appointments').where('doctorId', '==', userId).where('scheduledDate', '==', today)
        .onSnapshot(function (snap) { callback({ todayCount: snap.size }); })
    );
    unsubscribers.push(
      db.collection('appointments').where('doctorId', '==', userId).where('status', '==', 'assigned')
        .onSnapshot(function (snap) { callback({ assignedCount: snap.size }); })
    );
  } else {
    unsubscribers.push(
      db.collection('appointments').where('patientId', '==', userId).where('status', 'in', ['assigned', 'prescribed'])
        .onSnapshot(function (snap) { callback({ upcomingCount: snap.size }); })
    );
    unsubscribers.push(
      db.collection('prescriptions').where('patientId', '==', userId)
        .onSnapshot(function (snap) { callback({ prescriptionCount: snap.size }); })
    );
  }

  return function () {
    unsubscribers.forEach(function (unsub) { unsub(); });
  };
}

// ============================================================
// User Approval (Admin)
// ============================================================

/**
 * Gets all users with pending approval status.
 * @returns {Promise<Array>}
 */
function getPendingUsers() {
  return db.collection('users')
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .get()
    .then(function (snapshot) {
      var results = [];
      snapshot.forEach(function (doc) {
        results.push(Object.assign({ id: doc.id }, doc.data()));
      });
      return results;
    });
}

/**
 * Approves a pending user account.
 * @param {string} uid - User UID
 * @returns {Promise<void>}
 */
function approveUser(uid) {
  return db.collection('users').doc(uid).update({ status: 'active' }).then(function () {
    return db.collection('notifications').add({
      userId: uid,
      message: 'Your account has been approved! You can now sign in.',
      type: 'approval_result',
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
}

/**
 * Rejects a pending user account.
 * @param {string} uid - User UID
 * @returns {Promise<void>}
 */
function rejectUser(uid) {
  return db.collection('users').doc(uid).update({ status: 'rejected' }).then(function () {
    return db.collection('notifications').add({
      userId: uid,
      message: 'Your registration request was not approved. Please contact the administrator for details.',
      type: 'approval_result',
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
}

/**
 * Listens for pending user registrations (admin).
 * @param {Function} callback - Called with array of pending users
 * @returns {Function} Unsubscribe function
 */
function onPendingUsersChange(callback) {
  return db.collection('users')
    .where('status', '==', 'pending')
    .onSnapshot(function (snapshot) {
      var results = [];
      snapshot.forEach(function (doc) {
        results.push(Object.assign({ id: doc.id }, doc.data()));
      });
      // Sort in JS
      results.sort(function (a, b) {
        var t1 = (a.createdAt && a.createdAt.seconds) ? a.createdAt.seconds : 0;
        var t2 = (b.createdAt && b.createdAt.seconds) ? b.createdAt.seconds : 0;
        return t2 - t1;
      });
      callback(results);
    }, function (err) {
      console.error("Pending users listener error:", err);
      callback([]);
    });
}

// Export to window for cross-file access
window.createProblemSubmission = createProblemSubmission;
window.getPendingSubmissions = getPendingSubmissions;
window.getSubmissionsByPatient = getSubmissionsByPatient;
window.updateSubmissionStatus = updateSubmissionStatus;
window.createAppointment = createAppointment;
window.getAppointmentsByPatient = getAppointmentsByPatient;
window.getAppointmentsByDoctor = getAppointmentsByDoctor;
window.getAllAppointments = getAllAppointments;
window.updateAppointmentStatus = updateAppointmentStatus;
window.checkDoctorConflict = checkDoctorConflict;
window.createPrescription = createPrescription;
window.getPrescriptionsByPatient = getPrescriptionsByPatient;
window.getPrescriptionsByAppointment = getPrescriptionsByAppointment;
window.getDoctorList = getDoctorList;
window.getUserProfile = getUserProfile;
window.updatePatientProfile = updatePatientProfile;
window.getPatientHistory = getPatientHistory;
window.onSubmissionsChange = onSubmissionsChange;
window.onAppointmentsChange = onAppointmentsChange;
window.onStatsChange = onStatsChange;
window.getPendingUsers = getPendingUsers;
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.onPendingUsersChange = onPendingUsersChange;
