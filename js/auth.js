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
  var status = (role === 'patient') ? 'active' : 'pending';
  return auth.createUserWithEmailAndPassword(email, password)
    .then(function(cred) {
      var userData = {
        uid: cred.user.uid,
        name: name,
        email: email,
        role: role,
        status: status,
        phone: '',
        address: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      if (role === 'doctor' && specialization) {
        userData.specialization = specialization;
      }
      return db.collection('users').doc(cred.user.uid).set(userData).then(function() {
        // If pending, notify all admins and sign out immediately
        if (status === 'pending') {
          return notifyAdminsOfPendingUser(name, role, cred.user.uid).then(function() {
            return auth.signOut();
          });
        }
      });
    })
    .catch(function(err) {
      if (err.code && err.code.indexOf('auth/') === 0) throw authError(err);
      var msg = (err.message || '').toLowerCase();
      if (msg.indexOf('network') !== -1 || msg.indexOf('blocked') !== -1 || msg.indexOf('failed to fetch') !== -1 || msg.indexOf('firestore') !== -1) {
        throw new Error('Connection error. Please disable any ad blockers and check your internet connection.');
      }
      throw new Error('Registration failed. Please try again.');
    });
}

/**
 * Notifies all admin users about a pending registration.
 */
function notifyAdminsOfPendingUser(name, role, uid) {
  return db.collection('users').where('role', '==', 'admin').where('status', '==', 'active').get()
    .then(function(snap) {
      var promises = [];
      snap.forEach(function(doc) {
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
    .catch(function() {
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
  return auth.signInWithEmailAndPassword(email, password)
    .then(function(cred) {
      currentCred = cred;
      return db.collection('users').doc(cred.user.uid).get();
    })
    .then(function(doc) {
      if (!doc.exists) {
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
        }).then(function() {
          return { uid: currentCred.user.uid, role: 'patient' };
        });
      }
      var data = doc.data();
      // Block pending accounts
      if (data.status === 'pending') {
        return auth.signOut().then(function() {
          throw new Error('Your account is pending admin approval. You will be notified once approved.');
        });
      }
      if (data.status === 'rejected') {
        return auth.signOut().then(function() {
          throw new Error('Your registration request was not approved. Please contact the administrator.');
        });
      }
      return { uid: data.uid, role: data.role };
    })
    .catch(function(err) {
      if (err.code && err.code.indexOf('auth/') === 0) throw authError(err);
      var msg = (err.message || '').toLowerCase();
      if (msg.indexOf('network') !== -1 || msg.indexOf('failed to fetch') !== -1 || msg.indexOf('blocked') !== -1 || msg.indexOf('firestore') !== -1) {
        throw new Error('Connection error. Please disable any ad blockers and check your internet connection.');
      }
      if (err.message && err.message.indexOf('Please') !== -1) throw err;
      throw new Error('Unable to sign in. Please try again.');
    });
}


/**
 * Logs out the current user and redirects to landing page.
 * @returns {Promise<void>}
 */
function logoutUser() {
  return auth.signOut().then(function() {
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
    .catch(function(err) { throw authError(err); });
}

/**
 * Gets the current authenticated user with Firestore profile data.
 * @returns {Promise<{uid: string, email: string, role: string, name: string}|null>}
 */
function getCurrentUser() {
  return new Promise(function(resolve) {
    auth.onAuthStateChanged(function(user) {
      if (!user) {
        resolve(null);
        return;
      }
      db.collection('users').doc(user.uid).get()
        .then(function(doc) {
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
        .catch(function() {
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
window.sendPasswordReset = sendPasswordReset;
window.getCurrentUser = getCurrentUser;
