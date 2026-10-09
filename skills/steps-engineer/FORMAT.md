# Feedback Format

Provide a structured markdown report with the following sections:

1. ### Summary
   A high-level overview of the review findings.
2. ### Remix Patterns
   Violations of Remix best practices and recommended refactors.
3. ### Design System & Primitives
   Violations of custom primitives and suggestions for replacement.
4. ### Test Coverage & RemixScenario
   Verification of test patterns and scenario coverage.
5. ### Line-by-Line Feedback
   Specific file paths, line numbers, and code suggestions formatted with:
   - 🔴 **Critical**: Must fix before merge (e.g., client-side fetch instead of loader, broken navigation).
   - 🟡 **Suggestion**: Highly recommended (e.g., using standard HTML elements instead of custom primitives).
   - 🟢 **Nice to have**: Optional enhancement.
