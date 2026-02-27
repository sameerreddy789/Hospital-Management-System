// Auth guard - route protection based on authentication and role
// Attached to window object for cross-file access

/**
 * Role-to-dashboard mapping.
 */
var roleDashboards = {
  patient: '/patient/dashboard.html',
  doctor: '/doctor/dashboard.html',
  admin: '/admin/dashboard.html'
};

/**
 * Protects a page by requiring authentication and a specific role.
 * Redirects to login if not authenticated.
 * Redirects to the user's role dashboard if role doesn't match.
 * @param {string} allowedRole - The role allowed to access this page ('patient', 'doctor', 'admin')
 * @returns {Promise<{uid: string, role: string, name: string}>}
 */
function requireAuth(allowedRole) {
  return new Promise(function(resolve, reject) {
    auth.onAuthStateChanged(function(user) {
      if (!user) {
        window.location.href = '/login.html';
        reject(new Error('Not authenticated'));
        return;
      }

      db.collection('users').doc(user.uid).get()
        .then(function(doc) {
          if (!doc.exists) {
            window.location.href = '/login.html';
            reject(new Error('User profile not found'));
            return;
          }

          var data = doc.data();
          if (data.role !== allowedRole) {
            // Redirect to the user's own dashboard
            window.location.href = roleDashboards[data.role] || '/login.html';
            reject(new Error('Unauthorized role'));
            return;
          }

          resolve({
            uid: user.uid,
            role: data.role,
            name: data.name
          });
        })
        .catch(function(err) {
          window.location.href = '/login.html';
          reject(err);
        });
    });
  });
}

// Export to window for cross-file access
window.requireAuth = requireAuth;
window.roleDashboards = roleDashboards;
