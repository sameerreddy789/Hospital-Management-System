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
 * Shows a loading overlay while auth state resolves.
 */
function showAuthLoading() {
  if (document.getElementById('authOverlay')) return;
  var overlay = document.createElement('div');
  overlay.id = 'authOverlay';
  overlay.className = 'auth-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);
}

/**
 * Hides the auth loading overlay.
 */
function hideAuthLoading() {
  var overlay = document.getElementById('authOverlay');
  if (overlay) overlay.remove();
}

/**
 * Protects a page by requiring authentication and a specific role.
 * Shows loading overlay until auth state resolves.
 * Redirects to login if not authenticated.
 * Redirects to the user's role dashboard if role doesn't match.
 * @param {string} allowedRole - The role allowed to access this page ('patient', 'doctor', 'admin')
 * @returns {Promise<{uid: string, role: string, name: string}>}
 */
function requireAuth(allowedRole) {
  showAuthLoading();
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
            window.location.href = roleDashboards[data.role] || '/login.html';
            reject(new Error('Unauthorized role'));
            return;
          }

          hideAuthLoading();
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
