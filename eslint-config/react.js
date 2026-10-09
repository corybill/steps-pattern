/**
 * @agent-dossier
 * @purpose React / Remix ESLint plugins and Remix-specific JSX restrictions.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 */

/**
 * Build React flat-config blocks. Plugins are passed in so steps-pattern does not
 * hard-depend on react ESLint packages (only Remix apps install them).
 *
 * @param {object} plugins
 * @param {import('eslint').ESLint.Plugin} plugins.reactPlugin
 * @param {import('eslint').ESLint.Plugin} plugins.reactHooks
 * @param {object} plugins.jsxA11y
 * @returns {import('eslint').Linter.Config[]}
 */
export function react({ reactPlugin, reactHooks, jsxA11y }) {
  return [
    {
      plugins: {
        "react-hooks": reactHooks,
      },
    },
    reactPlugin.configs.flat.recommended,
    jsxA11y.flatConfigs.recommended,
    reactPlugin.configs.flat["jsx-runtime"],
    {
      files: ["**/*.{js,mjs,cjs,jsx}"],
      rules: {
        "react/prop-types": "off",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
        "no-restricted-syntax": [
          "error",
          {
            selector: "JSXOpeningElement[name.name='form']",
            message:
              "Use <Form> from 'react-router' instead of <form> to enable client-side submissions and prevent full page reloads.",
          },
          {
            selector:
              "JSXOpeningElement[name.name='a'] JSXAttribute[name.name='href'] > Literal[value=/^\\//]",
            message:
              "Use <Link> from 'react-router' instead of <a> for internal navigation to prevent full page reloads.",
          },
        ],
      },
    },
  ];
}
