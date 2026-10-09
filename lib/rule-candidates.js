/**
 * @agent-dossier
 * @purpose Load and validate anti-patterns/rule-candidates/inbox.json for review and later /codify-best-practice.
 * @conforms-to backend-steps.mdc
 * @feature core
 *
 * @technical-debt
 * - [x] None — registry helper for lint-rule candidates, not a Step
 *
 * @refactoring-goals
 * - Keep validation in this module so the CLI and spec share one contract
 */

export const STATUSES = [
  "proposed",
  "extend-existing",
  "accepted",
  "rejected",
  "covered-existing",
  "shipped",
];

export const DISPOSITIONS = ["new-rule", "extend-rule", "already-linted", "not-lintable"];
export const PRIORITIES = ["high", "medium", "low"];
export const LINTABILITIES = ["ast-easy", "ast-noisy", "not-ast"];
export const REVIEWABLE_STATUSES = ["proposed", "accepted", "extend-existing"];

const REQUIRED = [
  "id",
  "status",
  "proposedRuleId",
  "disposition",
  "priority",
  "lintability",
  "layers",
  "intent",
];

/**
 * @param {unknown} inbox
 * @returns {string[]}
 */
export function validateRuleCandidateInbox(inbox) {
  const errors = [];
  if (!inbox || typeof inbox !== "object") {
    return ["inbox must be an object"];
  }
  if (inbox.v !== 1) {
    errors.push("v must be 1");
  }
  if (!Array.isArray(inbox.candidates)) {
    errors.push("candidates must be an array");
    return errors;
  }
  const ids = new Set();
  for (const [i, c] of inbox.candidates.entries()) {
    const at = `candidates[${i}]`;
    if (!c || typeof c !== "object") {
      errors.push(`${at} must be an object`);
      continue;
    }
    for (const key of REQUIRED) {
      if (c[key] === undefined || c[key] === "") {
        errors.push(`${at} missing ${key}`);
      }
    }
    if (c.id) {
      if (ids.has(c.id)) {
        errors.push(`${at} duplicate id ${c.id}`);
      }
      ids.add(c.id);
    }
    if (c.status && !STATUSES.includes(c.status)) {
      errors.push(`${at} invalid status ${c.status}`);
    }
    if (c.disposition && !DISPOSITIONS.includes(c.disposition)) {
      errors.push(`${at} invalid disposition ${c.disposition}`);
    }
    if (c.priority && !PRIORITIES.includes(c.priority)) {
      errors.push(`${at} invalid priority ${c.priority}`);
    }
    if (c.lintability && !LINTABILITIES.includes(c.lintability)) {
      errors.push(`${at} invalid lintability ${c.lintability}`);
    }
    if (c.layers && !Array.isArray(c.layers)) {
      errors.push(`${at} layers must be an array`);
    }
    const needsSnippets = c.status === "proposed" || c.status === "accepted" || c.status === "extend-existing";
    if (needsSnippets && (!c.dontSnippet || !c.doSnippet)) {
      errors.push(`${at} ${c.id} needs dontSnippet and doSnippet`);
    }
    if ((c.status === "rejected" || c.disposition === "not-lintable") && !c.rejectReason) {
      errors.push(`${at} ${c.id} needs rejectReason`);
    }
  }
  return errors;
}

/**
 * @param {{ candidates?: object[] }} inbox
 * @param {string[]} [statuses]
 */
export function listReviewable(inbox, statuses = REVIEWABLE_STATUSES) {
  const wanted = new Set(statuses);
  return (inbox.candidates || []).filter((c) => wanted.has(c.status));
}
