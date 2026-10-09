# Project-shape ESLint presets

Package `eslint.config.js` files must call a **shape preset** only. No per-file or per-package rule offs.

## In scope (Steps trunk)

| Workspace | Shape | Preset |
| :--- | :--- | :--- |
| `sync` | Lambda (`lambda.js` → Controller) | `lambdaBackend()` |
| `lambda-worker` | Lambda | `lambdaBackend()` |
| `document-processor` | Lambda | `lambdaBackend()` |
| `ui` | Remix (Route loader/action) | `remixApp()` |
| `public` | Remix | `remixApp()` |
| `browser-extension` | ShareableModule + webextensions | `shareableModule({ runtime: "webextensions" })` |
| `agent-runtime` | ShareableModule | `shareableModule()` |
| `agent-tools` | ShareableModule | `shareableModule()` |

Shared trunk: Controller or Route → Service → Steps / Module.

Allowed knobs: `srcRoot`, `runtime`, `typescriptConfigs`, `extraIgnores` (generated/build paths only).

## Out of scope (no Steps structure)

| Workspace | Config |
| :--- | :--- |
| `models` | `thinLibrary()` |
| `db` | `thinLibrary()` |
| `landing` | own / none |
| `e2e` | own / none |
| `steps-pattern` | plugin package |
| `log-forwarder` | infra |

## Not allowed in package wrappers

- Named file or glob `rules: { "…": "off" }`
- `moduleCoverage: "off"`, `beforeEachSetupOrder: "off"`, Maddox severity softening
- Package-specific `controllerPathMappings` / `modulePathMappings`
