# WORKFLOW.md

## Round 1: Vague Prompt

**Prompt used:** `make a settings form with validation` (one sentence, no context, no file references, no constraints).
**Tool:** Gemini 3.8 Flash in Antigravity. **Branch:** `workflow-vague`. **Agent runtime:** about 9 minutes, output accepted without edits.

The agent tried to read my Task 1 README on its own. I denied the request so Round 1 would stay context-free.

### What the agent produced
A vanilla HTML/CSS/JS app with four tabs, a live profile preview, a password strength meter, JSON export, theme switching, toasts, confirmation modals, and an in-browser test page. The request was for a settings form; the output was a small product. That is scope creep I never asked for and would now have to review.

### Mistakes I caught
1. **Wrong environment conclusion.** Its shell commands for finding Node failed, and it concluded Node was not installed. Node v24.18.0 is installed on my machine. It then chose vanilla JS over my usual stack and wrote "no Node.js required" in the README. A tooling failure was treated as a fact about my project.
2. **Hardcoded test result.** In `tests.html` the summary is built as `` `${passedTests} / ${totalTests} Passed (100%)` ``. The "100%" is a literal, so the page would claim 100% even if tests failed.
3. **Tests that cannot catch regressions.** `tests.html` re-declares its own copies of the validation rules instead of importing the real schema from `app.js`. Breaking validation in the app would not fail a single test.
4. **Unverified claims in the README.** It states WCAG AA contrast compliance and full accessibility with no audit behind either claim.

### Accessibility gaps
- Tabs use `role="tab"`, but there is no arrow-key navigation handler in `app.js`.
- Per-tab error badges are not connected to any ARIA announcement.

### Review effort
Reviewing about 2,000 lines I did not ask for was the real cost. Generation was fast; trusting the output would have meant shipping the mistakes above.

## Round 2: Precise Prompt
_To be completed after Round 2._

## Comparison and Rules Learned
_To be completed after Round 2._