// Authentication module
// Handles registration, login, logout, password reset
// Attached to window object for cross-file access

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
    });
}

/**
 * Logs in a user and returns their uid and role.
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {Promise<{uid: string, role: string}>}
 */
function loginUser(email, password) {
  return auth.signInWithEmailAndPassword(email, password)
    .then(function(cred) {
      return db.collection('users').doc(cred.user.uid).get();
    })
    .then(function(doc) {
      if (!doc.exists) {
        throw new Error('User profile not found');
      }
      var data = doc.data();
      return { uid: data.uid, role: data.role };
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
  return auth.sendPasswordResetEmail(email);
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
