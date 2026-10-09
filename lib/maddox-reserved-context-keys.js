/**
 * @agent-dossier
 * @purpose Compiler-owned Maddox context keys and collision-safe dynamic names.
 * @conforms-to steps-pattern
 * @feature generate-maddox-tests
 *
 * @technical-debt
 *
 * @refactoring-goals
 */

/** Remix trigger option objects — not mock-call args, so not arrays. */
export const RESERVED_OBJECT_PARAMS_KEYS = new Set([
  "triggerLoaderParams",
  "triggerActionParams",
]);

/** Setup helpers the composer owns; dynamic `setup${Class}${Method}` cannot reuse these. */
export const RESERVED_SETUP_NAMES = new Set([
  "setupValues",
  "setupInputParams",
  "setupResponse",
]);

/**
 * Compiler-owned `context.*` keys. Dynamic mock names (params/response/error/setup)
 * must not reuse these; {@link disambiguateContextKey} appends `_2` (before a
 * Params/Response/Error suffix when present).
 */
export const RESERVED_CONTEXT_KEYS = new Set([
  "triggerLoaderDescriptor",
  "triggerLoaderParams",
  "triggerActionDescriptor",
  "triggerActionParams",
  "stubAppContext",
  "stubModule",
  "initialEntries",
  "inputParams",
  "expectedResponse",
  "expectedMaddoxErr",
  "expectedSuccess",
  "expectedRedirectStatus",
  "expectedRedirectLocation",
  "expectedHttpStatus",
  "layoutStub",
  ...RESERVED_SETUP_NAMES,
]);

const SUFFIXES = ["Params", "Response", "Error"];

/**
 * Remix trigger context keys for a loader or action suite.
 * @param {"loader" | "action"} kind
 * @returns {{ descriptorKey: string, paramsKey: string }}
 */
export function remixTriggerContextKeys(kind) {
  if (kind === "action") {
    return {
      descriptorKey: "triggerActionDescriptor",
      paramsKey: "triggerActionParams",
    };
  }
  return {
    descriptorKey: "triggerLoaderDescriptor",
    paramsKey: "triggerLoaderParams",
  };
}

/**
 * @param {string} name
 * @param {Set<string>} [used]
 * @returns {boolean}
 */
function isTaken(name, used) {
  return RESERVED_CONTEXT_KEYS.has(name) || (used != null && used.has(name));
}

/**
 * Return `name` when free; otherwise `stem_2Suffix`, `stem_3Suffix`, …
 * (`fooParams` → `foo_2Params`). Names without a Params/Response/Error suffix
 * become `name_2`, `name_3`, ….
 *
 * @param {string} name
 * @param {Set<string>} [used]
 * @returns {string}
 */
export function disambiguateContextKey(name, used) {
  const suffix =
    name.startsWith("setup")
      ? undefined
      : SUFFIXES.find((s) => name.endsWith(s) && name.length > s.length);
  const stem = suffix ? name.slice(0, -suffix.length) : name;
  let n = 1;
  let candidate = name;
  while (isTaken(candidate, used)) {
    n += 1;
    candidate = suffix ? `${stem}_${n}${suffix}` : `${name}_${n}`;
  }
  if (used) used.add(candidate);
  return candidate;
}
