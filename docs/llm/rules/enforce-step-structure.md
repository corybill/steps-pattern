# enforce-step-structure

## Rule id

`steps-pattern/enforce-step-structure`

## Intent (from ESLint rule)

Enforce the structure of Step classes, including try/catch with Errr. See `.cursor/rules/steps-pattern.mdc` and `.cursor/rules/backend-steps.mdc`.
Also:
- Enforce that Step class names must not contain the word "Step" (e.g. `GetPlayersStep` is invalid and should be named `GetPlayers`).
- Enforce that Step file names must not contain the word "step" (e.g. `get-players-step.js` is invalid and should be named `get-players.js`).
- Enforce that Step file names must match the kebab-case version of the class name (e.g. class `GetPlayers` must be in a file named `get-players.js`).

## When this rule applies

This rule is enabled only where your ESLint flat config applies `steps-pattern/enforce-step-structure` (see `files` globs in the consumer repo, e.g. `your eslint.config.js`).

## Correct fix (checklist)

1. Read the ESLint message and the reported AST node / line.
2. Ensure that the Step class name does not contain the word "Step" (e.g. rename `GetPlayersStep` to `GetPlayers`).
3. Ensure that the Step file name does not contain the word "step" (e.g. rename `get-players-step.js` to `get-players.js`).
4. Ensure that the Step file name matches the kebab-case version of the class name (e.g. rename `fetch-players.js` to `get-players.js` if the class is `GetPlayers`).
5. Ensure the Step class has a `static async next(state)` method wrapped in a try/catch block using `Errr` to wrap and throw the error.
6. Ensure the Step class does not have other public methods (private methods starting with `_` are okay).
7. Ensure the Step class never returns a value.

## What good looks like

File: `get-players.js`
```javascript
export default class GetPlayers {
  static async next(state) {
    try {
      const players = await PlayersProxy.getPlayers();
      state.setPlayers(players);
    } catch (err) {
      Errr.newError("Could not get players").appendTo(err).throw();
    }
  }
}
```

## Do not

- Do not add `eslint-disable`, `eslint-disable-next-line`, or blanket config overrides to silence this rule without fixing the underlying issue.
- Do not rename files, paths, or identifiers solely to bypass path-based rules (e.g. forbidden path tokens).
- Do not delete or hollow out tests to avoid coverage rules.

## Related docs

Follow `.cursor/rules/` paths mentioned in the rule description when working in app; for other repos, mirror those conventions in your own docs or vendor this package’s `docs/llm/framework/` guides.
