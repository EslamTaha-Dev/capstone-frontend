# WORKFLOW.md

**FE-04: AI-Assisted Workflow Drill.** Feature: profile settings form with validation.
**Tool:** Gemini 3.8 Flash in Antigravity, fresh session per round. **Branches:** `workflow-vague`, `workflow-precise`.
Round 2 was reviewed with Claude's help; every finding below was reproduced by running code.

## Rounds

| | Round 1 (vague) | Round 2 (precise) |
|---|---|---|
| Prompt | `make a settings form with validation` | Scope, stack, field rules, example behaviours, constraints, plan → approve → code → test → build |
| Agent time | ~9 min, accepted unedited | ~2 min plan + ~2.5 min build |

## Comparison

**Correctness.** Round 1's `tests.html` prints `22 / 25 Passed (100%)`. The percentage is a string literal, and three tests fail (confirmed in a browser). One exposes a real bug: the name regex rejects "René", which its own test expects to pass. The tests also redefine the rules instead of importing them. Round 2's tests import the real schema. 22/22 pass and `tsc && vite build` succeeds, both re-run by me. Breaking the regex fails two tests, so they do guard it.

**Accessibility.** Round 1 tabs use `role="tab"` with no arrow-key handler, and the README claims WCAG AA without an audit. In Round 2 every input has a label, `aria-invalid`, `aria-describedby` and a `role="alert"` error; tests assert this for name, email and website. One regression: no required-field marker or `aria-required`, which Round 1 had.

**Edge cases.** Both accept whitespace-only names and reject "José" or "محمد" through an ASCII-only regex. Round 2 also accepts `https://` alone as a website.

**Review effort.** Round 2 (Vite + React + TypeScript) left 565 lines of source and tests to read, against 4,026 lines of vanilla JS in six files, and nothing was hidden behind a summary line.

## AI mistakes caught

1. **Environment misread (Round 1).** Node lookups failed in the agent's shell, so it built a zero-dependency vanilla app and wrote "no Node.js installations required" in the README. Node v24.18.0 is installed. Round 2 hit the same PATH failure and recovered once I approved an nvm path.
2. **Hardcoded test summary (Round 1).** It hid three failing tests.
3. **Stale success banner (Round 2).** Submit a valid form, break the email, submit again: "Profile updated successfully!" shows beside the error. The approved plan promised it would clear.
4. **Untested constraint (Round 2).** "Validate on blur first" has no negative test: setting `mode: 'all'` still passes 22/22. One test (`toBeDefined`) asserts nothing about behaviour.
5. **Unrequested Tailwind (Round 2).** Three dev dependencies and two config files I never asked for. I kept them.

## Time

Round 2's agent time was half of Round 1's despite the approval gate and test loop. The gate cost a few minutes of reading and bought a reviewable diff.

## Changes to my next prompt

- Say "Unicode letters" and "trim before validating" for name fields.
- Name the allowed API instead of "no uncontrolled inputs": react-hook-form's `register` is itself uncontrolled.
- Require a negative test for every behavioural constraint, such as no error before the first blur.
- Ask for required-field markers explicitly.
