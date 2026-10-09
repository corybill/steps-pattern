/**
 * Teaching fixture (temporary silence). The rule matches the substring
 * "[Maddox] Scenario mock surface" anywhere in the
 * entry-point source. Place it under @technical-debt on the controller /
 * service / module / route / step — not on the spec.
 *
 * Live canonical: sync/src/modules/partner.js
 *
 * @technical-debt
 * - [ ] [Maddox] Scenario mock surface (≥7 mocks or ≥8 shouldBeCalledWith): extract a Module so the caller spec mocks fewer targets.
 */
export const MOCK_SURFACE_DEBT_LINE =
  "- [ ] [Maddox] Scenario mock surface (≥7 mocks or ≥8 shouldBeCalledWith): extract a Module so the caller spec mocks fewer targets.";
