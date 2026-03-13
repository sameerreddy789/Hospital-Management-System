// Utility functions: date formatting, time formatting, DOM helpers
// Attached to window object for cross-file access

/**
 * Formats a date string (YYYY-MM-DD) to a readable format (e.g., "Jan 15, 2025").
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  var parts = dateStr.split('-');
  var date = new Date(parts[0], parts[1] - 1, parts[2]);
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

/**
 * Formats a 24-hour time string (HH:MM) to 12-hour format (e.g., "2:30 PM").
 * @param {string} timeStr - Time in HH:MM format
 * @returns {string} Formatted time string
 */
function formatTime(timeStr) {
  if (!timeStr) return '';
  var parts = timeStr.split(':');
  var hours = parseInt(parts[0], 10);
  var minutes = parts[1];
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return hours + ':' + minutes + ' ' + ampm;
}

/**
 * Shorthand for document.querySelector.
 * @param {string} selector - CSS selector
 * @param {HTMLElement} [parent=document] - Parent element to search within
 * @returns {HTMLElement|null}
 */
function qs(selector, parent) {
  return (parent || document).querySelector(selector);
}

/**
 * Shorthand for document.querySelectorAll.
 * @param {string} selector - CSS selector
 * @param {HTMLElement} [parent=document] - Parent element to search within
 * @returns {NodeList}
 */
function qsa(selector, parent) {
  return (parent || document).querySelectorAll(selector);
}

/**
 * Creates an HTML element with optional attributes and text content.
 * @param {string} tag - HTML tag name
 * @param {Object} [attrs] - Attributes to set
 * @param {string} [text] - Text content
 * @returns {HTMLElement}
 */
function createElement(tag, attrs, text) {
  var el = document.createElement(tag);
  if (attrs) {
    for (var key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        if (key === 'className') {
          el.className = attrs[key];
        } else {
          el.setAttribute(key, attrs[key]);
        }
      }
    }
  }
  if (text) el.textContent = text;
  return el;
}

/**
 * Shows a status message (success/error) in a container element.
 * @param {HTMLElement} container - The element to show the message in
 * @param {string} message - The message text
 * @param {string} [type='success'] - 'success' or 'error'
 */
function showMessage(container, message, type) {
  type = type || 'success';
  container.textContent = message;
  container.className = 'message message-' + type;
  container.style.display = 'block';
}

/**
 * Hides a status message container.
 * @param {HTMLElement} container - The element to hide
 */
function hideMessage(container) {
  container.style.display = 'none';
  container.textContent = '';
}

/**
 * Returns a Firestore-compatible timestamp for the current time.
 * @returns {firebase.firestore.FieldValue}
 */
function serverTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - The string to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Shows a toast notification that auto-dismisses.
 * @param {string} message - The message text
 * @param {string} [type='success'] - 'success', 'error', or 'info'
 * @param {number} [duration=3000] - Duration in ms
 */
function showToast(message, type, duration) {
  type = type || 'success';
  duration = duration || 3000;
  var container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function() { toast.classList.add('toast-fade'); }, duration - 300);
  setTimeout(function() { toast.remove(); }, duration);
}

// Export to window for cross-file access
window.formatDate = formatDate;
window.formatTime = formatTime;
window.qs = qs;
window.qsa = qsa;
window.createElement = createElement;
window.showMessage = showMessage;
window.hideMessage = hideMessage;
window.serverTimestamp = serverTimestamp;
window.escapeHtml = escapeHtml;
window.showToast = showToast;
