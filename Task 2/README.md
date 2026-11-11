# Aura Workspace — Settings Form with Full Validation

A production-grade, zero-dependency, responsive **Settings Form with Real-Time Validation** engineered for modern web applications. Built with semantic HTML5, pure CSS3 (custom design system supporting dark & light themes), and modular vanilla JavaScript.

---

## 🌟 Key Highlights & Features

### 1. Multi-Category Tabbed Architecture
The settings interface is divided into 4 logical, accessible tabs:
- **Profile Info**: Avatar upload with live preview, full name, username handle, email, international phone number, portfolio URL, and bio with live character counting.
- **Security & Authentication**: Password update with 5-point strength evaluation, password confirmation, conditional Two-Factor Authentication (2FA) with Authenticator App vs. SMS, and inactivity session timeout.
- **System Preferences**: Theme selection (Dark Mode, Light Mode, System Sync), interface language, timezone selector, and localized date format options.
- **Notifications & Privacy**: Granular notification switches (security alerts, product updates, weekly digest), profile visibility tiers (Public, Team Only, Private), and telemetry data sharing toggle.

### 2. Comprehensive Validation Engine (`validator.js`)
A standalone, schema-driven validation library supporting:
- **Real-Time & Blur Validation**: Fields validate on blur initially to avoid premature error flashing, then validate on input once touched or submitted for instant feedback.
- **Pattern & Format Enforcement**: Strict RFC 5322 regex for emails, E.164 phone number formatting, and HTTPS URL validation.
- **Cross-Field & Conditional Rules**:
  - `confirmPassword` must match `newPassword`.
  - `newPassword` cannot be identical to `currentPassword`.
  - `phone` becomes mandatory if Two-Factor Authentication via SMS is selected.
  - Setting a `newPassword` requires providing `currentPassword`.
- **File Validation**: Enforces avatar image MIME types (JPG, PNG, WEBP, GIF) and limits file size to ≤ 2.0 MB.
- **Tab Error Badges**: Displays a red badge showing the exact number of invalid fields per tab.
- **Smart Submit Focus**: If validation fails on submit, the application automatically switches to the tab containing the first invalid field, smoothly scrolls to it, and sets keyboard focus.

### 3. Password Strength Meter
Evaluates passwords dynamically against 5 security criteria:
- Minimum 8 characters (and 12+ for maximum strength)
- Uppercase letters `[A-Z]`
- Lowercase letters `[a-z]`
- Numeric digits `[0-9]`
- Special characters `[!@#$%^&*...]`
Includes an animated visual meter with colored progress bars (Very Weak → Weak → Fair → Good → Strong) and an interactive requirement checklist.

### 4. Interactive Live Profile Preview Card
A live sidebar widget synchronizes in real time with the form:
- Updates avatar thumbnail, display name, `@username` handle, email, bio, active theme, and 2FA status as you type.

### 5. State Management & Persistence
- **Unsaved Changes Indicator**: A pulsing indicator appears whenever any field is modified from its last saved state.
- **Discard & Reset Modals**: Confirmation dialogs prevent accidental data loss.
- **Local Persistence**: Saves all settings to `localStorage`. Re-opening the page restores the saved configuration.
- **JSON Export**: Power-user feature allowing users to export their current settings as a clean `.json` file.
- **Theme Switching**: Instant toggle between Dark and Light mode, persisting preferences to `localStorage`.

---

## 📋 Validation Rules Specification

| Field | Rules & Constraints | Error Guidance |
| :--- | :--- | :--- |
| **Avatar** | File ≤ 2MB; MIME: `image/jpeg`, `image/png`, `image/webp`, `image/gif` | "Avatar image must be smaller than 2 MB." / "Avatar must be a JPG, PNG, WEBP, or GIF image." |
| **Display Name** | Required; 2–50 chars; letters, spaces, hyphens, apostrophes | "Display Name is required." / "Must be at least 2 characters." / "Name can only contain letters, spaces, hyphens, and apostrophes." |
| **Username** | Required; 3–20 chars; alphanumeric, `-`, `_`; cannot start/end with hyphen or underscore | "Username is required." / "3-20 characters: letters, numbers, hyphens, underscores." / "Cannot start or end with a hyphen or underscore." |
| **Email Address** | Required; valid RFC 5322 format | "Email address is required." / "Please provide a valid email address (e.g. name@domain.com)." |
| **Phone Number** | Optional; valid international format (7–20 digits/symbols); **Required if 2FA via SMS is selected** | "Please enter a valid international phone format." / "Phone number is required when 2FA via SMS is selected." |
| **Website URL** | Optional; must be valid URL starting with `https://` | "Website URL must begin with https://" / "Please provide a valid URL." |
| **Bio** | Optional; max 250 characters; live counter | "Bio cannot exceed 250 characters." |
| **Current Password**| Required if `newPassword` is filled | "Current password is required to set a new password." |
| **New Password** | Min 8 chars; upper, lower, number, special character; must differ from current password | "Password must be at least 8 characters long." / "Password must contain at least one uppercase letter." / "New password cannot be identical to current password." |
| **Confirm Password**| Must match `newPassword` | "Passwords do not match." |
| **Session Timeout**| Required selection | "Session timeout selection is required." |
| **Theme / Language / Timezone / Date Format** | Required selection from validated options | Standard dropdown validation |

---

## 🚀 How to Run the Application

Because this application is built with vanilla web technologies, **no build steps, Node.js installations, or package managers are required**.

### Running the App:
1. Navigate to the `Task 2` folder:
   ```
   e:\Courses\FlyRank\capstone-frontend\Task 2
   ```
2. Double-click `index.html` or open it in any modern web browser (Chrome, Edge, Firefox, Safari).

### Running the Automated Test Suite:
1. In the same folder, open `tests.html` in your browser.
2. The page runs 20+ automated unit test assertions covering all schema rules, edge cases, and password strength scoring, presenting real-time pass/fail statuses.

---

## 📁 File Structure

```
Task 2/
├── index.html         # Semantic, accessible HTML5 structure with tabs, modals & preview card
├── styles.css         # Complete CSS3 design system with CSS custom properties (Dark/Light)
├── js/
│   ├── validator.js   # Reusable, schema-based FormValidator engine class
│   └── app.js         # Main controller managing state, validation, DOM events, and persistence
├── tests.html         # Automated in-browser unit test runner for validation rules
└── README.md          # Project documentation and specifications
```

---

## ♿ Accessibility (a11y) & UX Considerations

- **WCAG Contrast Compliance**: Color palette configured to meet WCAG AA contrast standards in both dark and light themes.
- **ARIA Attributes**: Uses `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-invalid`, `aria-required`, and `aria-describedby` linking errors directly to input IDs for screen readers.
- **Keyboard Navigation**: Full keyboard tab order with visible `:focus-visible` focus rings.
- **Reduced Motion Friendly**: Respects smooth transitions without disruptive layout shifting.

