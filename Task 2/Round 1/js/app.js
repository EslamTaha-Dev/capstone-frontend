/**
 * Aura Workspace - Settings Form Controller
 * Manages form state, real-time validation, tab navigation, preview updates,
 * password strength analysis, and local persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const form = document.getElementById('settings-form');
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const unsavedBadge = document.getElementById('unsaved-indicator');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const exportBtn = document.getElementById('export-json-btn');
  const resetBtn = document.getElementById('btn-reset-defaults');
  const discardBtn = document.getElementById('btn-discard');
  const submitBtn = document.getElementById('btn-submit');
  const submitSpinner = document.getElementById('submit-spinner');
  const toastContainer = document.getElementById('toast-container');

  // Confirmation Modal
  const modalBackdrop = document.getElementById('confirm-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  // Avatar Elements
  const avatarInput = document.getElementById('avatar');
  const avatarDropZone = document.getElementById('avatar-drop-zone');
  const avatarCurrentImg = document.getElementById('avatar-current-img');
  const previewAvatarImg = document.getElementById('preview-avatar-img');
  const btnBrowseAvatar = document.getElementById('btn-browse-avatar');
  const btnRemoveAvatar = document.getElementById('btn-remove-avatar');

  // Preview Card Elements
  const previewName = document.getElementById('preview-name');
  const previewHandle = document.getElementById('preview-handle');
  const previewMail = document.getElementById('preview-mail');
  const previewBio = document.getElementById('preview-bio-text');
  const previewTagTheme = document.getElementById('preview-tag-theme');
  const previewTag2fa = document.getElementById('preview-tag-2fa');

  // Bio Character Counter
  const bioInput = document.getElementById('bio');
  const bioCounter = document.getElementById('bio-counter');

  // Password Elements
  const newPasswordInput = document.getElementById('newPassword');
  const currentPasswordInput = document.getElementById('currentPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const meterFill = document.getElementById('meter-fill-bar');
  const meterStatusText = document.getElementById('meter-status-text');
  const checkItems = {
    length: document.getElementById('check-length'),
    upper: document.getElementById('check-upper'),
    lower: document.getElementById('check-lower'),
    number: document.getElementById('check-number'),
    special: document.getElementById('check-special')
  };

  // 2FA Elements
  const twoFactorToggle = document.getElementById('twoFactorEnabled');
  const twoFactorOptions = document.getElementById('two-factor-options');

  // Default Avatar placeholder SVG
  const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%236366f1'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='32' fill='white' font-weight='bold'%3EJD%3C/text%3E%3C/svg%3E";

  // Form Field to Tab Mapping for Badge Counts & Tab Navigation
  const fieldTabMap = {
    displayName: 'profile',
    username: 'profile',
    email: 'profile',
    phone: 'profile',
    website: 'profile',
    bio: 'profile',
    avatar: 'profile',
    currentPassword: 'security',
    newPassword: 'security',
    confirmPassword: 'security',
    twoFactorMethod: 'security',
    sessionTimeout: 'security',
    language: 'preferences',
    timezone: 'preferences',
    dateFormat: 'preferences'
  };

  // Storage key
  const STORAGE_KEY = 'aura_workspace_settings';

  // --- Initial Form State Snapshot ---
  let initialFormData = {};
  let currentAvatarData = DEFAULT_AVATAR;
  let hasPendingChanges = false;
  let pendingModalAction = null;

  // --- Validation Schema ---
  const validationSchema = {
    displayName: [
      { required: true, message: 'Display Name is required.' },
      { minLength: 2, message: 'Must be at least 2 characters.' },
      { maxLength: 50, message: 'Must not exceed 50 characters.' },
      {
        pattern: /^[a-zA-Z\s'-]+$/,
        message: 'Name can only contain letters, spaces, hyphens, and apostrophes.'
      }
    ],
    username: [
      { required: true, message: 'Username is required.' },
      { minLength: 3, message: 'Must be at least 3 characters.' },
      { maxLength: 20, message: 'Must not exceed 20 characters.' },
      {
        pattern: /^[a-zA-Z0-9_-]+$/,
        message: 'Only letters, numbers, hyphens, and underscores allowed.'
      },
      {
        custom: (val) => {
          if (/^[-_]|[-_]$/.test(val)) {
            return 'Cannot start or end with a hyphen or underscore.';
          }
          return true;
        }
      }
    ],
    email: [
      { required: true, message: 'Email address is required.' },
      {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        message: 'Please provide a valid email address (e.g. name@domain.com).'
      }
    ],
    phone: [
      {
        custom: (val, all) => {
          if (!val || val.trim() === '') {
            // Check if 2FA via SMS is selected
            if (all.twoFactorEnabled && all.twoFactorMethod === 'sms') {
              return 'Phone number is required when 2FA via SMS is selected.';
            }
            return true;
          }
          // Validate format
          const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
          if (!phoneRegex.test(val.trim())) {
            return 'Please enter a valid international phone format (e.g. +1 555 123 4567).';
          }
          return true;
        }
      }
    ],
    website: [
      {
        custom: (val) => {
          if (!val || val.trim() === '') return true;
          try {
            const url = new URL(val);
            if (url.protocol !== 'https:') {
              return 'Website URL must begin with https://';
            }
            return true;
          } catch {
            return 'Please provide a valid URL (e.g. https://yourdomain.com).';
          }
        }
      }
    ],
    bio: [
      { maxLength: 250, message: 'Bio cannot exceed 250 characters.' }
    ],
    currentPassword: [
      {
        custom: (val, all) => {
          if (all.newPassword && (!val || val.trim() === '')) {
            return 'Current password is required to set a new password.';
          }
          return true;
        }
      }
    ],
    newPassword: [
      {
        custom: (val, all) => {
          if (all.currentPassword && (!val || val.trim() === '')) {
            return 'Please enter your new password.';
          }
          if (val) {
            if (val.length < 8) return 'Password must be at least 8 characters long.';
            if (!/[A-Z]/.test(val)) return 'Password must contain at least one uppercase letter.';
            if (!/[a-z]/.test(val)) return 'Password must contain at least one lowercase letter.';
            if (!/[0-9]/.test(val)) return 'Password must contain at least one number.';
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(val)) {
              return 'Password must contain at least one special character.';
            }
            if (all.currentPassword && val === all.currentPassword) {
              return 'New password cannot be identical to current password.';
            }
          }
          return true;
        }
      }
    ],
    confirmPassword: [
      {
        custom: (val, all) => {
          if (all.newPassword && val !== all.newPassword) {
            return 'Passwords do not match.';
          }
          return true;
        }
      }
    ],
    avatar: [
      {
        file: {
          maxSizeBytes: 2 * 1024 * 1024, // 2MB
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          sizeMessage: 'Avatar image must be smaller than 2 MB.',
          typeMessage: 'Avatar must be a JPG, PNG, WEBP, or GIF image.'
        }
      }
    ],
    sessionTimeout: [
      { required: true, message: 'Session timeout selection is required.' }
    ],
    language: [
      { required: true, message: 'Please select a language.' }
    ],
    timezone: [
      { required: true, message: 'Please select a timezone.' }
    ],
    dateFormat: [
      { required: true, message: 'Please select a date format.' }
    ]
  };

  // Initialize FormValidator instance
  const validator = new FormValidator(validationSchema);

  // --- Helper Functions ---

  /**
   * Extract key-value representation of the form
   */
  function getFormData() {
    const rawData = new FormData(form);
    const data = {};

    // Standard inputs
    for (const [key, value] of rawData.entries()) {
      if (key !== 'avatar') {
        data[key] = typeof value === 'string' ? value.trim() : value;
      }
    }

    // Explicit Booleans for checkboxes
    data.twoFactorEnabled = twoFactorToggle.checked;
    data.notifySecurity = document.getElementById('notifySecurity').checked;
    data.notifyProductUpdates = document.getElementById('notifyProductUpdates').checked;
    data.notifyWeeklyDigest = document.getElementById('notifyWeeklyDigest').checked;
    data.telemetryConsent = document.getElementById('telemetryConsent').checked;

    // Radio fields
    const selectedTheme = document.querySelector('input[name="preferredTheme"]:checked');
    data.preferredTheme = selectedTheme ? selectedTheme.value : 'dark';

    const selected2FaMethod = document.querySelector('input[name="twoFactorMethod"]:checked');
    data.twoFactorMethod = selected2FaMethod ? selected2FaMethod.value : 'authenticator';

    const selectedVisibility = document.querySelector('input[name="profileVisibility"]:checked');
    data.profileVisibility = selectedVisibility ? selectedVisibility.value : 'public';

    // File
    if (avatarInput.files && avatarInput.files[0]) {
      data.avatar = avatarInput.files[0];
    } else {
      data.avatar = null;
    }

    return data;
  }

  /**
   * Set field visual state in DOM
   */
  function setFieldState(fieldName, errorMessage) {
    const group = document.getElementById(`group-${fieldName}`);
    const errorEl = document.getElementById(`${fieldName}-error`);
    const input = document.getElementById(fieldName);

    if (errorEl) {
      if (errorMessage) {
        errorEl.textContent = errorMessage;
        errorEl.style.display = 'block';
        if (input) input.setAttribute('aria-invalid', 'true');
      } else {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
        if (input) input.setAttribute('aria-invalid', 'false');
      }
    }

    if (group) {
      if (errorMessage) {
        group.classList.add('has-error');
        group.classList.remove('has-success');
      } else {
        group.classList.remove('has-error');
        if (input && input.value.trim() !== '') {
          group.classList.add('has-success');
        } else {
          group.classList.remove('has-success');
        }
      }
    }
  }

  /**
   * Update Tab Badges to show errors per tab
   */
  function updateTabBadges() {
    const errorCounts = {
      profile: 0,
      security: 0,
      preferences: 0,
      notifications: 0
    };

    for (const [field, error] of Object.entries(validator.errors)) {
      const tab = fieldTabMap[field];
      if (tab && error && errorCounts[tab] !== undefined) {
        errorCounts[tab]++;
      }
    }

    for (const [tab, count] of Object.entries(errorCounts)) {
      const badge = document.getElementById(`badge-error-${tab}`);
      if (badge) {
        if (count > 0) {
          badge.textContent = count;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    }
  }

  /**
   * Validate a single field and update its DOM elements
   */
  function validateFieldUI(fieldName) {
    const currentData = getFormData();
    const error = validator.validateField(fieldName, currentData[fieldName], currentData);
    setFieldState(fieldName, error);
    updateTabBadges();
    return !error;
  }

  /**
   * Live Profile Preview Sync
   */
  function updateLivePreview() {
    const data = getFormData();

    previewName.textContent = data.displayName || 'Anonymous User';
    previewHandle.textContent = data.username ? `@${data.username}` : '@username';
    previewMail.textContent = data.email || 'no-email-set@example.com';
    previewBio.textContent = data.bio || 'No bio provided.';

    // Tags
    const themeName = data.preferredTheme.charAt(0).toUpperCase() + data.preferredTheme.slice(1);
    previewTagTheme.textContent = `Theme: ${themeName}`;

    previewTag2fa.textContent = data.twoFactorEnabled
      ? `2FA: ${data.twoFactorMethod === 'sms' ? 'SMS' : 'App'}`
      : '2FA: Disabled';
  }

  /**
   * Password Strength UI updates
   */
  function updatePasswordMeter(password) {
    const result = FormValidator.evaluatePasswordStrength(password);

    meterFill.style.width = `${result.score}%`;
    meterFill.style.backgroundColor = result.color;
    meterStatusText.textContent = result.label;
    meterStatusText.style.color = result.color;

    // Update Checklist items
    const checks = result.checks;
    toggleCheck(checkItems.length, checks.minLength);
    toggleCheck(checkItems.upper, checks.hasUpper);
    toggleCheck(checkItems.lower, checks.hasLower);
    toggleCheck(checkItems.number, checks.hasNumber);
    toggleCheck(checkItems.special, checks.hasSpecial);
  }

  function toggleCheck(el, passed) {
    if (!el) return;
    if (passed) {
      el.classList.add('passed');
    } else {
      el.classList.remove('passed');
    }
  }

  /**
   * Check for Unsaved Changes
   */
  function checkForUnsavedChanges() {
    const current = getFormData();
    let isDirty = false;

    for (const key of Object.keys(initialFormData)) {
      if (key === 'avatar') continue;
      if (initialFormData[key] !== current[key]) {
        isDirty = true;
        break;
      }
    }

    if (currentAvatarData !== initialFormData.avatarPreview) {
      isDirty = true;
    }

    hasPendingChanges = isDirty;
    if (isDirty) {
      unsavedBadge.classList.remove('hidden');
    } else {
      unsavedBadge.classList.add('hidden');
    }
  }

  /**
   * Switch Active Tab
   */
  function switchTab(tabId) {
    navTabs.forEach((tab) => {
      const isSelected = tab.getAttribute('data-tab') === tabId;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    tabPanels.forEach((panel) => {
      const matches = panel.id === `panel-${tabId}`;
      panel.classList.toggle('active', matches);
    });
  }

  /**
   * Toast Notification Generator
   */
  function showToast(title, message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="toast-body">
        <h4 class="toast-title">${title}</h4>
        <p class="toast-desc">${message}</p>
      </div>
      <button type="button" class="toast-close-btn" aria-label="Dismiss">&times;</button>
    `;

    toastContainer.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close-btn');
    const dismiss = () => {
      toast.classList.add('toast-closing');
      setTimeout(() => {
        toast.remove();
      }, 200);
    };

    closeBtn.addEventListener('click', dismiss);
    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }

  /**
   * Confirmation Modal Handler
   */
  function openConfirmModal(title, message, onConfirm) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    pendingModalAction = onConfirm;
    modalBackdrop.classList.remove('hidden');
    modalConfirmBtn.focus();
  }

  function closeConfirmModal() {
    modalBackdrop.classList.add('hidden');
    pendingModalAction = null;
  }

  modalCloseBtn.addEventListener('click', closeConfirmModal);
  modalCancelBtn.addEventListener('click', closeConfirmModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeConfirmModal();
  });
  modalConfirmBtn.addEventListener('click', () => {
    if (typeof pendingModalAction === 'function') {
      pendingModalAction();
    }
    closeConfirmModal();
  });

  // --- Theme Management ---
  function applyTheme(theme) {
    const root = document.documentElement;
    let effectiveTheme = theme;

    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    root.setAttribute('data-theme', effectiveTheme);

    // Sync radio buttons
    const themeRadio = document.querySelector(`input[name="preferredTheme"][value="${theme}"]`);
    if (themeRadio) themeRadio.checked = true;

    localStorage.setItem('aura_theme_preference', theme);
    updateLivePreview();
  }

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast('Theme Changed', `Switched to ${nextTheme} mode.`, 'info', 2000);
    checkForUnsavedChanges();
  });

  document.querySelectorAll('input[name="preferredTheme"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      applyTheme(e.target.value);
      checkForUnsavedChanges();
    });
  });

  // --- Avatar Upload & Preview Handling ---
  function handleAvatarFile(file) {
    if (!file) return;

    // Validate avatar field with validator
    const error = validator.validateField('avatar', file);
    setFieldState('avatar', error);

    if (error) {
      showToast('Avatar Error', error, 'error');
      avatarInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      currentAvatarData = dataUrl;
      avatarCurrentImg.src = dataUrl;
      previewAvatarImg.src = dataUrl;
      showToast('Avatar Updated', 'Image loaded successfully.', 'success', 2500);
      checkForUnsavedChanges();
    };
    reader.readAsDataURL(file);
  }

  avatarInput.addEventListener('change', (e) => {
    handleAvatarFile(e.target.files[0]);
  });

  btnBrowseAvatar.addEventListener('click', () => avatarInput.click());

  btnRemoveAvatar.addEventListener('click', () => {
    avatarInput.value = '';
    currentAvatarData = DEFAULT_AVATAR;
    avatarCurrentImg.src = DEFAULT_AVATAR;
    previewAvatarImg.src = DEFAULT_AVATAR;
    validator.clearError('avatar');
    setFieldState('avatar', null);
    showToast('Avatar Reset', 'Reverted to default monogram avatar.', 'info', 2000);
    checkForUnsavedChanges();
  });

  // Avatar Drag & Drop
  ['dragenter', 'dragover'].forEach((eventName) => {
    avatarDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      avatarDropZone.style.borderColor = 'var(--color-primary)';
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    avatarDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      avatarDropZone.style.borderColor = '';
    });
  });

  avatarDropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    handleAvatarFile(file);
  });

  // --- Bio Character Counter ---
  function updateBioCounter() {
    const len = bioInput.value.length;
    bioCounter.textContent = `${len} / 250`;
    if (len >= 240) {
      bioCounter.style.color = 'var(--color-danger)';
    } else {
      bioCounter.style.color = 'var(--color-text-subtle)';
    }
  }

  bioInput.addEventListener('input', () => {
    updateBioCounter();
    updateLivePreview();
    validateFieldUI('bio');
    checkForUnsavedChanges();
  });

  // --- Password Show/Hide Toggle ---
  document.querySelectorAll('.btn-toggle-visibility').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const eyeOpen = btn.querySelector('.eye-open');
      const eyeClosed = btn.querySelector('.eye-closed');

      if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
      } else {
        input.type = 'password';
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
      }
    });
  });

  // --- Password Inputs Real-Time Evaluation ---
  newPasswordInput.addEventListener('input', (e) => {
    updatePasswordMeter(e.target.value);
    validateFieldUI('newPassword');
    if (confirmPasswordInput.value) {
      validateFieldUI('confirmPassword');
    }
    checkForUnsavedChanges();
  });

  currentPasswordInput.addEventListener('input', () => {
    validateFieldUI('currentPassword');
    if (newPasswordInput.value) {
      validateFieldUI('newPassword');
    }
    checkForUnsavedChanges();
  });

  confirmPasswordInput.addEventListener('input', () => {
    validateFieldUI('confirmPassword');
    checkForUnsavedChanges();
  });

  // --- 2FA Toggle Handling ---
  twoFactorToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      twoFactorOptions.classList.remove('hidden');
    } else {
      twoFactorOptions.classList.add('hidden');
    }
    updateLivePreview();
    validateFieldUI('phone');
    checkForUnsavedChanges();
  });

  document.querySelectorAll('input[name="twoFactorMethod"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      updateLivePreview();
      validateFieldUI('phone');
      checkForUnsavedChanges();
    });
  });

  // --- General Form Input Listeners ---
  const interactiveInputs = [
    'displayName',
    'username',
    'email',
    'phone',
    'website',
    'sessionTimeout',
    'language',
    'timezone',
    'dateFormat'
  ];

  interactiveInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    // Validate on blur initially
    el.addEventListener('blur', () => {
      validator.markTouched(id);
      validateFieldUI(id);
    });

    // Validate on input once touched or during editing
    el.addEventListener('input', () => {
      if (validator.touched[id]) {
        validateFieldUI(id);
      }
      updateLivePreview();
      checkForUnsavedChanges();
    });

    // Dropdowns
    if (el.tagName === 'SELECT') {
      el.addEventListener('change', () => {
        validateFieldUI(id);
        checkForUnsavedChanges();
      });
    }
  });

  // Other checkboxes and radios
  document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach((input) => {
    input.addEventListener('change', () => {
      updateLivePreview();
      checkForUnsavedChanges();
    });
  });

  // --- Navigation Tab Switching ---
  navTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      switchTab(target);
    });
  });

  // --- Reset to Factory Defaults ---
  function resetToDefaults() {
    form.reset();
    avatarInput.value = '';
    currentAvatarData = DEFAULT_AVATAR;
    avatarCurrentImg.src = DEFAULT_AVATAR;
    previewAvatarImg.src = DEFAULT_AVATAR;

    validator.reset();

    // Clear all field error UI
    document.querySelectorAll('.form-group').forEach((g) => {
      g.classList.remove('has-error', 'has-success');
    });
    document.querySelectorAll('.field-error').forEach((e) => {
      e.textContent = '';
      e.style.display = 'none';
    });

    // Reset password meter
    updatePasswordMeter('');

    // Reset 2FA container
    twoFactorOptions.classList.add('hidden');

    // Reset bio counter
    updateBioCounter();

    // Re-apply dark theme default
    applyTheme('dark');

    // Update Live Preview & Badges
    updateLivePreview();
    updateTabBadges();

    // Save snapshot
    initialFormData = {
      ...getFormData(),
      avatarPreview: DEFAULT_AVATAR
    };
    localStorage.removeItem(STORAGE_KEY);

    checkForUnsavedChanges();
    showToast('Reset Complete', 'All settings have been restored to initial defaults.', 'info');
  }

  resetBtn.addEventListener('click', () => {
    openConfirmModal(
      'Reset All Settings?',
      'This will erase all custom configurations and restore the factory defaults. This action cannot be undone.',
      resetToDefaults
    );
  });

  // --- Discard Changes ---
  discardBtn.addEventListener('click', () => {
    if (!hasPendingChanges) {
      showToast('No Changes', 'No unsaved modifications to discard.', 'info', 2000);
      return;
    }

    openConfirmModal(
      'Discard Unsaved Changes?',
      'Are you sure you want to discard your unsaved changes and revert to your last saved settings?',
      () => {
        loadSavedSettings();
        showToast('Changes Discarded', 'Reverted back to last saved configuration.', 'info');
      }
    );
  });

  // --- Form Submission with Full Validation ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = getFormData();
    validator.touchAll(Object.keys(validationSchema));

    const { isValid, errors } = validator.validateAll(data);

    // Apply UI state to every field
    for (const fieldName of Object.keys(validationSchema)) {
      setFieldState(fieldName, errors[fieldName] || null);
    }
    updateTabBadges();

    // If invalid, focus first error & switch to its tab
    if (!isValid) {
      const firstErrorField = Object.keys(errors)[0];
      const targetTab = fieldTabMap[firstErrorField] || 'profile';

      switchTab(targetTab);

      const targetInput = document.getElementById(firstErrorField);
      if (targetInput) {
        targetInput.focus();
        targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      showToast(
        'Validation Required',
        `Please resolve the errors highlighted in the form before saving. (${Object.keys(errors).length} issue(s) detected)`,
        'error',
        5000
      );
      return;
    }

    // Submission in progress simulation
    submitSpinner.classList.remove('hidden');
    submitBtn.disabled = true;

    setTimeout(() => {
      submitSpinner.classList.add('hidden');
      submitBtn.disabled = false;

      // Persist to localStorage (excluding File object, storing avatar data URL)
      const serializableData = {
        ...data,
        avatar: null,
        avatarPreview: currentAvatarData,
        savedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableData));
      } catch (err) {
        console.warn('LocalStorage limit exceeded for avatar', err);
      }

      initialFormData = { ...serializableData };
      checkForUnsavedChanges();

      // Clear password fields for security
      currentPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
      updatePasswordMeter('');

      showToast(
        'Settings Saved Successfully',
        'Your account and workspace preferences have been updated.',
        'success',
        4000
      );
    }, 700);
  });

  // --- Export Settings to JSON ---
  exportBtn.addEventListener('click', () => {
    const data = getFormData();
    delete data.avatar;
    data.avatarPreview = currentAvatarData;
    data.exportedAt = new Date().toISOString();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Export Complete', 'Settings exported to JSON file.', 'success', 2500);
  });

  // --- Load Saved or Initial Settings ---
  function loadSavedSettings() {
    let saved = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      console.error('Failed reading saved settings', e);
    }

    if (saved) {
      if (saved.displayName) document.getElementById('displayName').value = saved.displayName;
      if (saved.username) document.getElementById('username').value = saved.username;
      if (saved.email) document.getElementById('email').value = saved.email;
      if (saved.phone) document.getElementById('phone').value = saved.phone;
      if (saved.website) document.getElementById('website').value = saved.website;
      if (saved.bio) document.getElementById('bio').value = saved.bio;

      if (saved.sessionTimeout) document.getElementById('sessionTimeout').value = saved.sessionTimeout;
      if (saved.language) document.getElementById('language').value = saved.language;
      if (saved.timezone) document.getElementById('timezone').value = saved.timezone;
      if (saved.dateFormat) document.getElementById('dateFormat').value = saved.dateFormat;

      // Booleans
      twoFactorToggle.checked = Boolean(saved.twoFactorEnabled);
      if (saved.twoFactorEnabled) {
        twoFactorOptions.classList.remove('hidden');
      } else {
        twoFactorOptions.classList.add('hidden');
      }

      if (saved.twoFactorMethod) {
        const m = document.querySelector(`input[name="twoFactorMethod"][value="${saved.twoFactorMethod}"]`);
        if (m) m.checked = true;
      }

      if (saved.notifySecurity !== undefined) {
        document.getElementById('notifySecurity').checked = saved.notifySecurity;
      }
      if (saved.notifyProductUpdates !== undefined) {
        document.getElementById('notifyProductUpdates').checked = saved.notifyProductUpdates;
      }
      if (saved.notifyWeeklyDigest !== undefined) {
        document.getElementById('notifyWeeklyDigest').checked = saved.notifyWeeklyDigest;
      }
      if (saved.telemetryConsent !== undefined) {
        document.getElementById('telemetryConsent').checked = saved.telemetryConsent;
      }

      if (saved.profileVisibility) {
        const v = document.querySelector(`input[name="profileVisibility"][value="${saved.profileVisibility}"]`);
        if (v) v.checked = true;
      }

      if (saved.preferredTheme) {
        applyTheme(saved.preferredTheme);
      }

      if (saved.avatarPreview) {
        currentAvatarData = saved.avatarPreview;
        avatarCurrentImg.src = saved.avatarPreview;
        previewAvatarImg.src = saved.avatarPreview;
      }
    } else {
      // Check for standalone theme
      const storedTheme = localStorage.getItem('aura_theme_preference') || 'dark';
      applyTheme(storedTheme);
    }

    // Save initial snapshot
    initialFormData = {
      ...getFormData(),
      avatarPreview: currentAvatarData
    };

    updateBioCounter();
    updateLivePreview();
    checkForUnsavedChanges();
  }

  // Initial Boot
  loadSavedSettings();
});

