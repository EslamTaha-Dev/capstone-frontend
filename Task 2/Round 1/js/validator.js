/**
 * FormValidator - Lightweight, schema-driven validation engine
 * Supports sync & async rules, cross-field validation, and custom error messaging.
 */
class FormValidator {
  constructor(schema = {}) {
    this.schema = schema;
    this.errors = {};
    this.touched = {};
  }

  /**
   * Set or update validation rules for fields
   * @param {Object} schema 
   */
  setSchema(schema) {
    this.schema = schema;
  }

  /**
   * Mark a field as touched
   * @param {string} fieldName 
   */
  markTouched(fieldName) {
    this.touched[fieldName] = true;
  }

  /**
   * Mark all fields as touched
   * @param {Array<string>} fieldNames 
   */
  touchAll(fieldNames) {
    fieldNames.forEach((name) => {
      this.touched[name] = true;
    });
  }

  /**
   * Reset touched states and errors
   */
  reset() {
    this.errors = {};
    this.touched = {};
  }

  /**
   * Clear error for a specific field
   * @param {string} fieldName 
   */
  clearError(fieldName) {
    delete this.errors[fieldName];
  }

  /**
   * Validate a single field against its schema rules
   * @param {string} fieldName 
   * @param {any} value 
   * @param {Object} allValues 
   * @returns {string|null} Error message or null
   */
  validateField(fieldName, value, allValues = {}) {
    const rules = this.schema[fieldName];
    if (!rules) return null;

    for (const rule of rules) {
      // 1. Required Rule
      if (rule.required) {
        const isEmpty =
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0) ||
          (value instanceof FileList && value.length === 0);

        if (isEmpty) {
          const msg = rule.message || `${fieldName} is required.`;
          this.errors[fieldName] = msg;
          return msg;
        }
      }

      // If empty and not required, skip remaining rules unless conditional
      const hasValue =
        value !== undefined &&
        value !== null &&
        (typeof value !== 'string' || value.trim() !== '');

      if (!hasValue && !rule.validateIfEmpty) {
        continue;
      }

      // 2. Minimum Length
      if (rule.minLength !== undefined && typeof value === 'string') {
        if (value.trim().length < rule.minLength) {
          const msg =
            rule.message ||
            `Must be at least ${rule.minLength} characters.`;
          this.errors[fieldName] = msg;
          return msg;
        }
      }

      // 3. Maximum Length
      if (rule.maxLength !== undefined && typeof value === 'string') {
        if (value.trim().length > rule.maxLength) {
          const msg =
            rule.message ||
            `Must not exceed ${rule.maxLength} characters.`;
          this.errors[fieldName] = msg;
          return msg;
        }
      }

      // 4. Pattern / Regex
      if (rule.pattern) {
        const regex =
          rule.pattern instanceof RegExp
            ? rule.pattern
            : new RegExp(rule.pattern);
        if (!regex.test(String(value).trim())) {
          const msg = rule.message || 'Invalid format.';
          this.errors[fieldName] = msg;
          return msg;
        }
      }

      // 5. Match Another Field (e.g. Password Confirmation)
      if (rule.matchesField) {
        const targetValue = allValues[rule.matchesField];
        if (value !== targetValue) {
          const msg = rule.message || `Must match ${rule.matchesField}.`;
          this.errors[fieldName] = msg;
          return msg;
        }
      }

      // 6. Must NOT Match Another Field
      if (rule.differsFromField) {
        const targetValue = allValues[rule.differsFromField];
        if (value && targetValue && value === targetValue) {
          const msg =
            rule.message || `Cannot be identical to ${rule.differsFromField}.`;
          this.errors[fieldName] = msg;
          return msg;
        }
      }

      // 7. Custom Validation Function
      if (typeof rule.custom === 'function') {
        const customResult = rule.custom(value, allValues);
        if (customResult !== true) {
          const msg =
            typeof customResult === 'string'
              ? customResult
              : rule.message || 'Validation failed.';
          this.errors[fieldName] = msg;
          return msg;
        }
      }

      // 8. File Validation
      if (rule.file) {
        const file =
          value instanceof File
            ? value
            : value && value[0] instanceof File
            ? value[0]
            : null;

        if (file) {
          if (rule.file.maxSizeBytes && file.size > rule.file.maxSizeBytes) {
            const maxMB = (rule.file.maxSizeBytes / (1024 * 1024)).toFixed(1);
            const msg =
              rule.file.sizeMessage ||
              `File size cannot exceed ${maxMB} MB. (Selected: ${(
                file.size /
                (1024 * 1024)
              ).toFixed(1)} MB)`;
            this.errors[fieldName] = msg;
            return msg;
          }

          if (rule.file.allowedTypes && Array.isArray(rule.file.allowedTypes)) {
            const isAllowed = rule.file.allowedTypes.some((type) => {
              if (type.endsWith('/*')) {
                const prefix = type.split('/')[0];
                return file.type.startsWith(`${prefix}/`);
              }
              return file.type === type;
            });

            if (!isAllowed) {
              const msg =
                rule.file.typeMessage ||
                `Invalid file format. Allowed formats: ${rule.file.allowedTypes.join(
                  ', '
                )}`;
              this.errors[fieldName] = msg;
              return msg;
            }
          }
        }
      }
    }

    // Passed all rules for this field
    delete this.errors[fieldName];
    return null;
  }

  /**
   * Validate full dataset against all schema rules
   * @param {Object} data 
   * @returns {{ isValid: boolean, errors: Object }}
   */
  validateAll(data) {
    this.errors = {};
    for (const fieldName of Object.keys(this.schema)) {
      this.validateField(fieldName, data[fieldName], data);
    }

    return {
      isValid: Object.keys(this.errors).length === 0,
      errors: { ...this.errors }
    };
  }

  /**
   * Calculate password strength metrics
   * @param {string} password 
   * @returns {{ score: number, label: string, checks: Object }}
   */
  static evaluatePasswordStrength(password = '') {
    const checks = {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
      strongLength: password.length >= 12
    };

    let passedCount = 0;
    if (checks.minLength) passedCount++;
    if (checks.hasUpper) passedCount++;
    if (checks.hasLower) passedCount++;
    if (checks.hasNumber) passedCount++;
    if (checks.hasSpecial) passedCount++;
    if (checks.strongLength) passedCount++;

    let score = 0;
    let label = 'Very Weak';
    let color = 'var(--color-danger)';

    if (!password) {
      score = 0;
      label = 'Empty';
      color = 'var(--color-border)';
    } else if (passedCount <= 2) {
      score = 20;
      label = 'Weak';
      color = 'var(--color-danger)';
    } else if (passedCount === 3 || passedCount === 4) {
      score = 50;
      label = 'Fair';
      color = 'var(--color-warning)';
    } else if (passedCount === 5) {
      score = 80;
      label = 'Good';
      color = 'var(--color-info)';
    } else {
      score = 100;
      label = 'Strong';
      color = 'var(--color-success)';
    }

    return {
      score,
      label,
      color,
      checks
    };
  }
}

// Export for module/script usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormValidator;
}

