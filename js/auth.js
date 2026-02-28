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
 * Registers a new patient account.
 * Creates Firebase Auth user and writes Firestore user doc with role "patient".
 * @param {string} name - Full name
 * @param {string} email - Email address
 * @param {string} password - Password (min 6 chars)
 * @returns {Promise<void>}
 */
function registerPatient(name, email, password) {
  return auth.createUserWithEmailAndPassword(email, password)
    .then(function(cred) {
      return db.collection('users').doc(cred.user.uid).set({
        uid: cred.user.uid,
        name: name,
        email: email,
        role: 'patient',
        phone: '',
        address: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
          phone: '',
          address: '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function() {
          return { uid: currentCred.user.uid, role: 'patient' };
        });
      }
      var data = doc.data();
      return { uid: data.uid, role: data.role };
    })
    .catch(function(err) {
      console.error('Login error:', err.code, err.message, err);
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
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.sendPasswordReset = sendPasswordReset;
window.getCurrentUser = getCurrentUser;
