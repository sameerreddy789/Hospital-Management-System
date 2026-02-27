// Search and filter module
// Client-side search and filter for dashboard lists
// Attached to window object for cross-file access

/**
 * Filters items where fieldName contains searchText (case-insensitive).
 * @param {Array} items - Array of objects
 * @param {string} searchText - Text to search for
 * @param {string} fieldName - Field to search in
 * @returns {Array} Filtered items
 */
function filterByText(items, searchText, fieldName) {
  if (!searchText || !searchText.trim()) return items;
  var lower = searchText.toLowerCase();
  return items.filter(function(item) {
    var val = item[fieldName];
    return val && val.toLowerCase().indexOf(lower) !== -1;
  });
}

/**
 * Filters items by status field value.
 * @param {Array} items - Array of objects
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered items
 */
function filterByStatus(items, status) {
  if (!status || status === 'all') return items;
  return items.filter(function(item) {
    return item.status === status;
  });
}

/**
 * Combines text search and status filter.
 * @param {Array} items - Array of objects
 * @param {string} searchText - Text to search for
 * @param {string} searchField - Field to search in
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered items
 */
function applyFilters(items, searchText, searchField, status) {
  var result = filterByText(items, searchText, searchField);
  return filterByStatus(result, status);
}

/**
 * Wires up search input and status dropdown to re-render a list.
 * @param {string} searchInputId - ID of search input
 * @param {string} statusSelectId - ID of status dropdown
 * @param {Function} renderFn - Function to call with filtered items
 * @param {Function} getItems - Function that returns current items array
 * @param {string} searchField - Field name to search in
 */
function setupSearchFilter(searchInputId, statusSelectId, renderFn, getItems, searchField) {
  var searchInput = document.getElementById(searchInputId);
  var statusSelect = document.getElementById(statusSelectId);

  function doFilter() {
    var text = searchInput ? searchInput.value : '';
    var status = statusSelect ? statusSelect.value : 'all';
    var filtered = applyFilters(getItems(), text, searchField, status);
    renderFn(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', doFilter);
  if (statusSelect) statusSelect.addEventListener('change', doFilter);
}

// Export to window
window.filterByText = filterByText;
window.filterByStatus = filterByStatus;
window.applyFilters = applyFilters;
window.setupSearchFilter = setupSearchFilter;
