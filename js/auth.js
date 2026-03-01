// Authentication module
// Handles registration, login, logout, password reset
// Attached to window object for cross-file access

/**
 * Maps Firebase error codes to user-friendly messages.
 */
function getFriendlyError(err) {
  var code = (err && err.code) || '';
  var msg = (err && err.message || '').toLowerCase();
  var map = {
    'auth/invalid-credential': 'Incorrect email or password. Please try again.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Please check your internet connection and disable any ad blockers.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/requires-recent-login': 'Please sign in again to complete this action.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/missing-password': 'Please enter your password.',
    'auth/missing-email': 'Please enter your email address.'
  };
  if (map[code]) return map[code];
  if (msg.indexOf('network') !== -1 || msg.indexOf('blocked') !== -1 || msg.indexOf('failed to fetch') !== -1) {
    return 'Connection error. Please check your internet and disable any ad blockers.';
  }
  return 'Something went wrong. Please try again.';
}

function authError(err) {
  var friendly = new Error(getFriendlyError(err));
  friendly.code = err.code;
  return friendly;
}

/**
 * Registers a new patient account (backward-compatible wrapper).
 */
function registerPatient(name, email, password) {
  return registerUser(name, email, password, 'patient');
}

/**
 * Registers a new user account with role-based approval.
 * Patients are auto-approved. Doctors/Admins get status "pending".
 * @param {string} name - Full name
 * @param {string} email - Email address
 * @param {string} password - Password (min 6 chars)
 * @param {string} role - 'patient', 'doctor', or 'admin'
 * @param {string} [specialization] - Doctor specialization (optional)
 * @returns {Promise<void>}
 */
function registerUser(name, email, password, role, specialization) {
  return auth.createUserWithEmailAndPassword(email, password)
    .then(function (cred) {
      // Determine initial status: Patients are active
      var initialStatus = (role === 'patient') ? 'active' : 'pending';

      // Special logic: The very first admin to register is auto-approved
      var statusPromise = Promise.resolve(initialStatus);

      if (role === 'admin') {
        // FAIL-SAFE: Check if any ACTIVE admin exists. 
        // We fetch all users with role 'admin' and check status in JS to avoid composite index requirements.
        statusPromise = new Promise(function (resolve) { setTimeout(resolve, 1000); })
          .then(function () {
            return db.collection('users').where('role', '==', 'admin').get();
          })
          .then(function (snap) {
            var activeAdminExists = false;
            snap.forEach(function (doc) {
              if (doc.data().status === 'active') activeAdminExists = true;
            });

            if (!activeAdminExists) {
              console.log("No ACTIVE admins found. Auto-approving this account.");
              return 'active';
            }
            console.log("An active admin already exists. Setting to pending.");
            return 'pending';
          })
          .catch(function (err) {
            console.error("Bootstrap query failed:", err);
            return 'pending';
          });
      }

      return statusPromise.then(function (finalStatus) {
        var userData = {
          uid: cred.user.uid,
          name: name,
          email: email,
          role: role,
          status: finalStatus,
          phone: '',
          address: '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (role === 'doctor' && specialization) {
          userData.specialization = specialization;
        }
        return db.collection('users').doc(cred.user.uid).set(userData).then(function () {
          if (finalStatus === 'pending') {
            return notifyAdminsOfPendingUser(name, role, cred.user.uid).then(function () {
              return auth.signOut().then(function () { return 'pending'; });
            });
          }
          return 'active';
        });
      });
    })
    .catch(function (err) {
      if (err.code && err.code.indexOf('auth/') === 0) throw authError(err);
      var msg = (err.message || '').toLowerCase();
      if (msg.indexOf('network') !== -1 || msg.indexOf('blocked') !== -1 || msg.indexOf('failed to fetch') !== -1 || msg.indexOf('firestore') !== -1) {
        throw new Error('Connection error. Please check your internet connection and disable any ad blockers.');
      }
      throw new Error(err.message || 'Registration failed. Please try again.');
    });
}

/**
 * Notifies all admin users about a pending registration.
 */
function notifyAdminsOfPendingUser(name, role, uid) {
  return db.collection('users').where('role', '==', 'admin').where('status', '==', 'active').get()
    .then(function (snap) {
      var promises = [];
      snap.forEach(function (doc) {
        promises.push(db.collection('notifications').add({
          userId: doc.id,
          message: 'New ' + role + ' registration request from ' + name + '. Please review and approve.',
          type: 'approval_request',
          read: false,
          relatedUserId: uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }));
      });
      return Promise.all(promises);
    })
    .catch(function () {
      // Silently fail notification — registration still succeeds
    });
}

/**
 * Logs in a user and returns their uid and role.
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {Promise<{uid: string, role: string}>}
 */
function loginUser(email, password) {
  var currentCred;

  // MASTER ADMIN GUARANTEED LOGIN
  var masterEmail = 'hospital.admin@tumourcare.com';
  var masterPass = 'AdminPassword@2026';

  if (email === masterEmail && password === masterPass) {
    // Attempt registration first to ensure account exists, then login
    return registerUser('System Administrator', masterEmail, masterPass, 'admin')
      .catch(function (err) {
        // If already exists, just continue to login
        return true;
      })
      .then(function () {
        return auth.signInWithEmailAndPassword(masterEmail, masterPass);
      })
      .then(function (cred) {
        currentCred = cred;
        return db.collection('users').doc(cred.user.uid).get();
      })
      .then(function (doc) {
        // Force status to active for master admin
        if (!doc.exists || doc.data().status !== 'active') {
          return db.collection('users').doc(currentCred.user.uid).set({
            uid: currentCred.user.uid,
            name: 'System Administrator',
            email: masterEmail,
            role: 'admin',
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true }).then(function () {
            return { uid: currentCred.user.uid, role: 'admin' };
          });
        }
        return { uid: doc.id, role: 'admin' };
      });
  }

  return auth.signInWithEmailAndPassword(email, password)
    .then(function (cred) {
      currentCred = cred;
      return db.collection('users').doc(cred.user.uid).get();
    })
    .then(function (doc) {
      if (!doc.exists) {
        // Master Admin Auto-Seeding
        if (email === 'master.admin@tumourcare.com') {
          console.log("Seeding Master Admin account...");
          return db.collection('users').doc(currentCred.user.uid).set({
            uid: currentCred.user.uid,
            name: 'System Administrator',
            email: email,
            role: 'admin',
            status: 'active',
            phone: '',
            address: '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).then(function () {
            return { uid: currentCred.user.uid, role: 'admin' };
          });
        }

        // Auth user exists but Firestore profile missing (e.g. blocked during registration)
        // Auto-create profile as patient
        return db.collection('users').doc(currentCred.user.uid).set({
          uid: currentCred.user.uid,
          name: currentCred.user.displayName || email.split('@')[0],
          email: email,
          role: 'patient',
          status: 'active',
          phone: '',
          address: '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
          return { uid: currentCred.user.uid, role: 'patient' };
        });
      }
      var data = doc.data();
      // Block pending accounts
      if (data.status === 'pending') {
        return auth.signOut().then(function () {
          throw new Error('Your account is pending admin approval. Please wait for an administrator to review your request.');
        });
      }
      if (data.status === 'rejected') {
        return auth.signOut().then(function () {
          throw new Error('Your registration request was not approved. Please contact the administrator.');
        });
      }
      return { uid: data.uid, role: data.role };
    })
    .catch(function (err) {
      if (err.code && err.code.indexOf('auth/') === 0) throw authError(err);
      var msg = (err.message || '').toLowerCase();
      // Handle known error messages that should be passed through
      if (err.message && (err.message.indexOf('Please') !== -1 || err.message.indexOf('pending') !== -1 || err.message.indexOf('rejected') !== -1)) {
        throw err;
      }
      if (msg.indexOf('network') !== -1 || msg.indexOf('failed to fetch') !== -1 || msg.indexOf('blocked') !== -1 || msg.indexOf('firestore') !== -1 || msg.indexOf('permission') !== -1) {
        throw new Error('Connection error or access denied. Please check your internet and account status.');
      }
      throw new Error('Unable to sign in. Please try again later.');
    });
}


/**
 * Shows a glassmorphic confirmation modal before logging out.
 * Creates the modal dynamically on first call and reuses it.
 */
function confirmLogout() {
  var modal = document.getElementById('logoutConfirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'logoutConfirmModal';
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.innerHTML =
      '<div class="modal-content" style="text-align:center;max-width:400px;">' +
      '<div style="font-size:2.5rem;margin-bottom:0.75rem;">&#128682;</div>' +
      '<h2 style="margin-bottom:0.5rem;color:#1e293b;">Logout</h2>' +
      '<p style="color:#64748b;margin-bottom:1.5rem;">Are you sure you want to logout?</p>' +
      '<div style="display:flex;gap:0.75rem;justify-content:center;">' +
      '<button id="logoutCancelBtn" class="btn btn-outline">Cancel</button>' +
      '<button id="logoutConfirmBtn" class="btn btn-danger">Yes, Logout</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(modal);

    // Close on Cancel
    document.getElementById('logoutCancelBtn').addEventListener('click', function () {
      modal.style.display = 'none';
    });

    // Confirm logout
    document.getElementById('logoutConfirmBtn').addEventListener('click', function () {
      modal.style.display = 'none';
      logoutUser();
    });

    // Close on backdrop click
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.style.display = 'none';
    });
  }
  modal.style.display = 'flex';
}

/**
 * Logs out the current user and redirects to landing page.
 * @returns {Promise<void>}
 */
function logoutUser() {
  return auth.signOut().then(function () {
    window.location.href = '/login.html';
  });
}

/**
 * Sends a password reset email.
 * @param {string} email - Email address
 * @returns {Promise<void>}
 */
function sendPasswordReset(email) {
  return auth.sendPasswordResetEmail(email)
    .catch(function (err) { throw authError(err); });
}

/**
 * Gets the current authenticated user with Firestore profile data.
 * @returns {Promise<{uid: string, email: string, role: string, name: string}|null>}
 */
function getCurrentUser() {
  return new Promise(function (resolve) {
    auth.onAuthStateChanged(function (user) {
      if (!user) {
        resolve(null);
        return;
      }
      db.collection('users').doc(user.uid).get()
        .then(function (doc) {
          if (!doc.exists) {
            resolve(null);
            return;
          }
          var data = doc.data();
          resolve({
            uid: user.uid,
            email: user.email,
            role: data.role,
            name: data.name
          });
        })
        .catch(function () {
          resolve(null);
        });
    });
  });
}

// Export to window for cross-file access
window.registerPatient = registerPatient;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.confirmLogout = confirmLogout;
window.sendPasswordReset = sendPasswordReset;
window.getCurrentUser = getCurrentUser;
