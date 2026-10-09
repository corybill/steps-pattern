import fs from "fs";
import path from "path";
import { normalizePath } from "./maddox-before-each-shared.js";

const schemaPathCache = new Map();
const allowedReposCache = new Map();

function toKebabCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function getAllowedRepositoryNames(schemaPath) {
  if (allowedReposCache.has(schemaPath)) return allowedReposCache.get(schemaPath);

  const schemaContent = fs.readFileSync(schemaPath, "utf-8");
  const modelNames = [...schemaContent.matchAll(/^\s*model\s+([A-Za-z][A-Za-z0-9_]*)\s*\{/gm)].map((match) => match[1]);
  const allowedNames = new Set(modelNames.map((modelName) => `${toKebabCase(modelName)}-repo`));
  allowedReposCache.set(schemaPath, allowedNames);
  return allowedNames;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure repository filenames map directly to Prisma model names as <kebab-model-name>-repo.{js,ts}.",
      url: "steps-pattern/docs/llm/rules/enforce-repository-model-mapping.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          prismaSchemaCandidates: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    const isRepositoryFile = /\/(src|app\/server)\/repositories\/[^/]+\.[cm]?(ts|js)$/.test(filename);
    if (!isRepositoryFile) return {};

    const options = context.options[0] || {};
    const prismaSchemaCandidates = options.prismaSchemaCandidates || [
      "prisma/schema.prisma",
    ];

    function findSiblingProductDbSchema(currentDir) {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory() || !entry.name.endsWith("-db")) continue;
          const sibling = path.join(currentDir, entry.name, "prisma", "schema.prisma");
          if (fs.existsSync(sibling)) return sibling;
        }
      } catch {
        return null;
      }
      return null;
    }

    function findSchemaPath(filename) {
      if (schemaPathCache.has(filename)) return schemaPathCache.get(filename);

      let currentDir = path.dirname(filename);
      const rootDir = path.parse(currentDir).root;

      while (currentDir !== rootDir) {
        const candidatePaths = prismaSchemaCandidates.map(candidate => path.join(currentDir, candidate));
        const found = candidatePaths.find((candidatePath) => fs.existsSync(candidatePath))
          || findSiblingProductDbSchema(currentDir);
        if (found) {
          schemaPathCache.set(filename, found);
          return found;
        }
        currentDir = path.dirname(currentDir);
      }

      schemaPathCache.set(filename, null);
      return null;
    }

    return {
      Program(node) {
        const schemaPath = findSchemaPath(filename);
        if (!schemaPath) {
          context.report({
            node,
            message: `Architectural Violation: Could not find Prisma schema to validate repository naming.\n\nIntent: Ensure repository filenames map directly to Prisma model names as <kebab-model-name>-repo.{js,ts}.\nLink: steps-pattern/docs/llm/rules/enforce-repository-model-mapping.md`,
          });
          return;
        }


        const allowedRepositoryNames = getAllowedRepositoryNames(schemaPath);
        const repositoryFileBase = path.basename(filename).replace(/\.[cm]?(ts|js)$/, "");

        if (!repositoryFileBase.endsWith("-repo")) {
          context.report({
            node,
            message: `Architectural Violation: Repository file '${path.basename(filename)}' must use '<kebab-prisma-model-name>-repo.{js|ts}' naming.\n\nIntent: Ensure repository filenames map directly to Prisma model names as <kebab-model-name>-repo.{js,ts}.\nLink: steps-pattern/docs/llm/rules/enforce-repository-model-mapping.md`,
          });
          return;
        }

        if (!allowedRepositoryNames.has(repositoryFileBase)) {
          const examples = [...allowedRepositoryNames].sort().slice(0, 8).join(", ");
          context.report({
            node,
            message: `Architectural Violation: Repository '${repositoryFileBase}' does not map to a Prisma model in '${schemaPath}'. Allowed examples: ${examples}${allowedRepositoryNames.size > 8 ? ", ..." : ""}.\n\nIntent: Ensure repository filenames map directly to Prisma model names as <kebab-model-name>-repo.{js,ts}.\nLink: steps-pattern/docs/llm/rules/enforce-repository-model-mapping.md`,
          });
        }
      },
    };
  },
};
