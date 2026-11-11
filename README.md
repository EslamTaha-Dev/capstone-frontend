# Task 2: AI-Assisted Workflow Drill (FE-04)

A controlled experiment: build the same small feature twice with the same AI coding agent, once with a one-sentence prompt and once with a structured prompt, then compare the results on correctness, accessibility, edge cases and review effort.

The written comparison lives in [`WORKFLOW.md`](./WORKFLOW.md). This README documents what was built, how to run it, and what was observed.

## The feature

A profile settings form with validation.

| Field | Rule |
|---|---|
| Display name | Required, 2-50 characters, letters, spaces, hyphens and apostrophes only |
| Email | Required, valid format |
| Website | Optional, must start with `https://` |
| Bio | Optional, max 250 characters, live character counter |

## Setup

| | Round 1 (vague) | Round 2 (precise) |
|---|---|---|
| Branch | `workflow-vague` | `workflow-precise` |
| Location | `Task 2/` | `Task 2/Round 2/` |
| Tool | Gemini 3.8 Flash in Antigravity | Gemini 3.8 Flash in Antigravity (new session) |
| Prompt | `make a settings form with validation` | Scoped prompt with stack, field rules, example behaviours, constraints and a verification loop |
| Agent time | ~9 min | ~2 min plan + ~2.5 min build |
| Human input | Denied access to Task 1 files to keep the round context-free | Approved the plan, allowed Task 1 conventions to be read, approved an `npm install` with an nvm PATH |

Task 1 (project setup files) lives on `main`. Each round started from `main` so Round 2 could not see Round 1's code.

## Round 1: vague prompt

The agent produced an unrequested small product: four tabs, live preview card, password strength meter, 2FA options, avatar upload, theme switching, JSON export, toasts, confirmation modals and an in-browser test page. About 4,026 lines across six files (`index.html`, `styles.css`, `js/validator.js`, `js/app.js`, `tests.html`, `README.md`), vanilla HTML/CSS/JS with no build step.

Run it: open `Task 2/index.html` in a browser. Open `Task 2/tests.html` for its test page.

### Observations

- `tests.html` displays `22 / 25 Passed (100%)`. The percentage is a literal string; three tests fail: accepting "René O'Connor-Smith" (the name regex is ASCII-only), and two file-validation tests whose fixtures are plain objects that the validator's `instanceof File` check skips.
- The tests redefine the validation rules inside the page instead of importing the schema used by the app, so breaking the app's rules would not fail them.
- Node lookups failed in the agent's shell, so it chose a zero-dependency stack and documented "no Node.js required", although Node v24.18.0 is installed.
- Tabs use `role="tab"` but have no arrow-key navigation. The README claims WCAG AA compliance without an audit.
- Scope far exceeded the request, which makes the output expensive to review.

## Round 2: precise prompt

Stack: Vite, React 18, TypeScript, react-hook-form with zod (`@hookform/resolvers`), Vitest and React Testing Library. Tailwind CSS was added by the agent (not requested).

The agent explored the project, wrote a plan (files, schema, dependencies, test cases), stopped for approval, then implemented, tested and built.

### Structure

```
Task 2/Round 2/
├── src/
│   ├── schemas/profileSchema.ts            # zod schema, single source of truth
│   ├── components/ProfileSettingsForm.tsx  # form, validation mode, a11y wiring
│   ├── App.tsx, main.tsx, index.css
│   └── test/
│       ├── profileSchema.test.ts           # 15 schema tests
│       ├── ProfileSettingsForm.test.tsx    # 7 component tests
│       └── setup.ts
├── index.html, package.json, tsconfig.json, vite.config.ts
└── tailwind.config.js, postcss.config.js
```

### Run it

```bash
cd "Task 2/Round 2"
npm install
npm run dev     # start the app
npm test        # 22 tests
npm run build   # tsc + vite build
```

### Behaviour

- Validation uses `mode: 'onTouched'`: first on blur, then on every change once the field is touched.
- Each input has a visible label, `aria-invalid`, and `aria-describedby` pointing to an error element with `role="alert"` when invalid.
- Bio shows a live `n / 250` counter.
- A valid submit logs the values to the console and shows a success message (`role="status"`).

### Verification

- `npm test`: 2 files, 22 tests passed.
- `npm run build`: succeeded (42 modules, JS 239 kB, CSS 9.8 kB).
- Both were re-run independently from a clean `npm ci` with identical results.
- Mutation checks: allowing digits in the name regex fails 2 tests (the tests guard the schema). Changing the validation mode to `onChange`, `onBlur` or `onSubmit` fails tests, but `all` passes all 22, so the "blur first" constraint is not fully guarded.

## Known issues in Round 2

Found during review and intentionally left unfixed, to document what the precise prompt still missed:

1. **Stale success message.** After a valid submit, breaking a field and submitting again shows "Profile updated successfully!" next to the validation error. The approved plan said the message would clear.
2. **Untested constraint.** No test types before the first blur and asserts that no error appears. One test (`toBeDefined`) asserts nothing about behaviour.
3. **Name rule edge cases.** Whitespace-only names (`"   "`) and `"--"` pass. Accented and Arabic names ("José", "محمد") are rejected by the ASCII-only regex.
4. **Website rule.** `https://` alone passes; `HTTPS://X.COM` is rejected.
5. **Accessibility gaps.** No required-field marker or `aria-required` (Round 1 had them), no `autocomplete` attributes, and the bio counter uses `aria-live="polite"`, so it is announced on every keystroke.
6. **Dependencies.** Chosen from the model's memory and about one major version behind current releases (React 18, zod 3, Vite 6, Vitest 3, Tailwind 3).
7. **Unrequested Tailwind.** Three dev dependencies and two config files.

## Lessons for the next prompt

- Specify "Unicode letters" and "trim before validating" for name fields.
- Name the allowed form API instead of "no uncontrolled inputs": react-hook-form's `register` is itself uncontrolled.
- Require a negative test for every behavioural constraint, such as no error before the first blur.
- Ask for required-field markers and `autocomplete` explicitly.
- Never trust a test summary the agent wrote: check that the numbers are computed, and re-run tests and build yourself.
