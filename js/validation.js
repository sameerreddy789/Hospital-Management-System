// Form validation utilities
// Attached to window object for cross-file access

/**
 * Validates that a value is not empty or whitespace-only.
 * @param {string} value - The value to validate
 * @param {string} fieldName - The field name for the error message
 * @returns {string|null} Error message if invalid, null if valid
 */
function validateRequired(value, fieldName) {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return fieldName + ' is required';
  }
  return null;
}

/**
 * Validates email format.
 * @param {string} email - The email to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return 'Please enter a valid email address';
  }
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return null;
}

/**
 * Validates password meets minimum length (6 chars for Firebase).
 * @param {string} password - The password to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return 'Password must be at least 6 characters';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

/**
 * Displays an error message next to an input element.
 * @param {HTMLElement} inputElement - The input element
 * @param {string} message - The error message to display
 */
function showFieldError(inputElement, message) {
  clearSingleFieldError(inputElement);
  var errorSpan = document.createElement('span');
  errorSpan.className = 'field-error';
  errorSpan.textContent = message;
  inputElement.classList.add('input-error');
  inputElement.parentNode.insertBefore(errorSpan, inputElement.nextSibling);
}

/**
 * Clears the error message for a single input element.
 * @param {HTMLElement} inputElement - The input element
 */
function clearSingleFieldError(inputElement) {
  inputElement.classList.remove('input-error');
  var next = inputElement.nextElementSibling;
  if (next && next.classList.contains('field-error')) {
    next.remove();
  }
}

/**
 * Removes all error messages from a form.
 * @param {HTMLElement} formElement - The form element
 */
function clearFieldErrors(formElement) {
  var errors = formElement.querySelectorAll('.field-error');
  for (var i = 0; i < errors.length; i++) {
    errors[i].remove();
  }
  var errorInputs = formElement.querySelectorAll('.input-error');
  for (var j = 0; j < errorInputs.length; j++) {
    errorInputs[j].classList.remove('input-error');
  }
}

/**
 * Validates an array of field definitions.
 * @param {Array<{value: string, fieldName: string, validators: Array<Function>}>} fields
 * @returns {{isValid: boolean, errors: Object}} Validation result
 */
function validateForm(fields) {
  var errors = {};
  var isValid = true;

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var validators = field.validators || [];

    for (var j = 0; j < validators.length; j++) {
      var error = validators[j](field.value, field.fieldName);
      if (error) {
        errors[field.fieldName] = error;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  }

  return { isValid: isValid, errors: errors };
}

// Export to window for cross-file access
window.validateRequired = validateRequired;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;
window.showFieldError = showFieldError;
window.clearFieldErrors = clearFieldErrors;
window.validateForm = validateForm;
