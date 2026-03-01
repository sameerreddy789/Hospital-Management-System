// Notifications module
// Handles notification creation, real-time listening, and badge updates
// Attached to window object for cross-file access

/**
 * Creates a notification for a user.
 * @param {string} userId - Target user ID
 * @param {string} message - Notification message
 * @param {string} type - 'assignment'|'prescription'|'request'|'cancellation'|'completion'
 * @returns {Promise<void>}
 */
function createNotification(userId, message, type) {
  return db.collection('notifications').add({
    userId: userId,
    message: message,
    type: type,
    read: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Listens for notification changes for a user.
 * @param {string} userId - User ID
 * @param {Function} callback - Called with array of notifications
 * @param {Function} [onError] - Called on error
 * @returns {Function} Unsubscribe function
 */
function onNotificationsChange(userId, callback, onError) {
  return db.collection('notifications')
    .where('userId', '==', userId)
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
      console.error("Notifications listener error:", err);
      if (onError) onError(err);
      else callback([]); // Default to empty if no error handler provided
    });
}

/**
 * Marks a notification as read.
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
function markAsRead(notificationId) {
  return db.collection('notifications').doc(notificationId).update({ read: true });
}

/**
 * Gets unread notification count for a user.
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
function getUnreadCount(userId) {
  return db.collection('notifications')
    .where('userId', '==', userId)
    .where('read', '==', false)
    .get()
    .then(function (snapshot) {
      return snapshot.size;
    });
}

/**
 * Sets up a real-time notification badge in the nav.
 * @param {string} userId - User ID
 */
function setupNotificationBadge(userId) {
  var badge = document.getElementById('notifBadge');
  if (!badge) return;

  db.collection('notifications')
    .where('userId', '==', userId)
    .where('read', '==', false)
    .onSnapshot(function (snapshot) {
      var count = snapshot.size;
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline';
      } else {
        badge.style.display = 'none';
      }
    });
}

// Export to window for cross-file access
window.createNotification = createNotification;
window.onNotificationsChange = onNotificationsChange;
window.markAsRead = markAsRead;
window.getUnreadCount = getUnreadCount;
window.setupNotificationBadge = setupNotificationBadge;
