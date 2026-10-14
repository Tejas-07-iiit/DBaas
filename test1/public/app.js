// DOM Elements
const userForm = document.getElementById('user-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('emailId');
const nameError = document.getElementById('name-error');
const emailError = document.getElementById('email-error');
const submitBtn = document.getElementById('submit-btn');
const btnText = submitBtn.querySelector('.btn-text');
const btnSpinner = submitBtn.querySelector('.btn-spinner');
const recordsList = document.getElementById('records-list');
const recordCount = document.getElementById('record-count');
const refreshBtn = document.getElementById('refresh-btn');
const dbStatusDot = document.getElementById('db-status-dot');
const dbStatusText = document.getElementById('db-status-text');
const toastContainer = document.getElementById('toast-container');

// State
let isSubmitting = false;

// Toast Notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `
      <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>`;
  } else if (type === 'error') {
    iconSvg = `
      <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`;
  } else {
    iconSvg = `
      <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div class="toast-message">${escapeHtml(message)}</div>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 300);
  }, 4000);
}

// Utility: HTML Escaping
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

// Utility: Date Formatter
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Database Connection Health Check
async function checkDbHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.database === 'connected') {
      dbStatusDot.className = 'dot dot-connected';
      dbStatusText.textContent = 'MongoDB Connected';
    } else {
      dbStatusDot.className = 'dot dot-disconnected';
      dbStatusText.textContent = 'MongoDB Disconnected';
    }
  } catch (err) {
    dbStatusDot.className = 'dot dot-disconnected';
    dbStatusText.textContent = 'Server Unreachable';
  }
}

// Validate Fields
function validateForm() {
  let isValid = true;

  // Name validation
  const nameVal = nameInput.value.trim();
  if (!nameVal) {
    nameError.textContent = 'Please enter your name.';
    isValid = false;
  } else if (nameVal.length < 2) {
    nameError.textContent = 'Name must be at least 2 characters.';
    isValid = false;
  } else {
    nameError.textContent = '';
  }

  // Email validation
  const emailVal = emailInput.value.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailVal) {
    emailError.textContent = 'Please enter your email.';
    isValid = false;
  } else if (!emailRegex.test(emailVal)) {
    emailError.textContent = 'Please enter a valid email address.';
    isValid = false;
  } else {
    emailError.textContent = '';
  }

  return isValid;
}

// Clear Field Errors on Input
nameInput.addEventListener('input', () => {
  if (nameError.textContent) nameError.textContent = '';
});

emailInput.addEventListener('input', () => {
  if (emailError.textContent) emailError.textContent = '';
});

// Load Users from Backend
async function fetchUsers() {
  try {
    recordsList.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading records...</p>
      </div>
    `;

    const response = await fetch('/api/users');
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Could not fetch records');
    }

    renderUsers(result.data || []);
  } catch (err) {
    console.error('Fetch error:', err);
    recordsList.innerHTML = `
      <div class="empty-state">
        <p style="color: var(--danger)">Failed to load records from MongoDB.</p>
        <p style="font-size: 0.8rem; margin-top: 0.5rem">${escapeHtml(err.message)}</p>
      </div>
    `;
    recordCount.textContent = '0 Records';
  }
}

// Render Users to DOM
function renderUsers(users) {
  recordCount.textContent = `${users.length} ${users.length === 1 ? 'Record' : 'Records'}`;

  if (users.length === 0) {
    recordsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="17" y1="8" x2="23" y2="14"></line>
            <line x1="23" y1="8" x2="17" y2="14"></line>
          </svg>
        </div>
        <h3>No records yet</h3>
        <p>Submit the form to add your first user.</p>
      </div>
    `;
    return;
  }

  recordsList.innerHTML = users.map(user => `
    <div class="record-item" id="user-${user._id}">
      <div class="record-info">
        <div class="record-name">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>${escapeHtml(user.name)}</span>
        </div>
        <a class="record-email" href="mailto:${escapeHtml(user.emailId)}">${escapeHtml(user.emailId)}</a>
        <span class="record-time">Saved on ${formatDate(user.createdAt)}</span>
      </div>
      <button class="delete-btn" title="Delete record" onclick="deleteUser('${user._id}', '${escapeHtml(user.name)}')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `).join('');
}

// Handle Form Submission
userForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (isSubmitting) return;
  if (!validateForm()) return;

  const name = nameInput.value.trim();
  const emailId = emailInput.value.trim();

  // Set loading state
  isSubmitting = true;
  submitBtn.disabled = true;
  btnText.textContent = 'Saving...';
  btnSpinner.hidden = false;

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, emailId })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to save record.');
    }

    // Success
    showToast(`Saved ${data.data.name} to MongoDB!`, 'success');
    userForm.reset();
    fetchUsers();
    checkDbHealth();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    isSubmitting = false;
    submitBtn.disabled = false;
    btnText.textContent = 'Save to MongoDB';
    btnSpinner.hidden = true;
  }
});

// Delete Record
window.deleteUser = async function(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete record.');
    }

    showToast(`Deleted "${name}"`, 'info');
    fetchUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// Refresh button handler
refreshBtn.addEventListener('click', () => {
  fetchUsers();
  checkDbHealth();
  showToast('Refreshed records list', 'info');
});

// Initial startup
checkDbHealth();
fetchUsers();

// Check health every 30 seconds
setInterval(checkDbHealth, 30000);
