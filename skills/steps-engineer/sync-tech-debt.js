import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Directories to skip completely during scan.
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".cursor",
  "build",
  "dist",
  "coverage",
  ".sst",
  "out",
  ".next",
  "temp",
]);

// Helper to check if file should be processed.
function isProcessableFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return [".js", ".jsx", ".ts", ".tsx", ".astro"].includes(ext);
}

// Recursively traverse directory to find target files.
async function findFiles(dir, fileList = []) {
  let files;
  try {
    files = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    // Directory may be inaccessible (symlink loops, perms). Skip silently.
    return fileList;
  }

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      if (!IGNORED_DIRS.has(file.name)) {
        await findFiles(fullPath, fileList);
      }
    } else if (file.isFile()) {
      if (isProcessableFile(file.name)) {
        fileList.push(fullPath);
      }
    }
  }

  return fileList;
}

// Walk upward from startDir until a `.git` directory is found; return that root
// (the holding repo root). If no `.git` is found, fall back to startDir.
async function findHoldingRepoRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    try {
      const stat = await fs.stat(path.join(dir, ".git"));
      if (stat.isDirectory() || stat.isFile()) return dir;
    } catch {
      // not here, keep walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
}

// Parse JSDoc dossier block from file contents.
function parseDossier(content, relativePath) {
  const dossierRegex = /\/\*\*[\s\S]*?@agent-dossier[\s\S]*?\*\//;
  const match = content.match(dossierRegex);

  if (!match) return null;

  const block = match[0];
  const lines = block
    .split("\n")
    .map((line) => {
      // Remove JSDoc comment styling: leading /**, *, or */ and surrounding spaces
      return line
        .replace(/^\s*\/\*\*/, "")
        .replace(/^\s*\*\//, "")
        .replace(/^\s*\*\s?/, "")
        .trim();
    });

  const dossier = {
    file: relativePath,
    purpose: "",
    conformsTo: "",
    technicalDebt: [],
    refactoringGoals: [],
  };

  let currentSection = null;

  for (const line of lines) {
    if (!line) continue;

    if (line.startsWith("@agent-dossier")) {
      currentSection = "dossier";
      continue;
    } else if (line.startsWith("@purpose")) {
      currentSection = "purpose";
      dossier.purpose = line.replace("@purpose", "").trim();
      continue;
    } else if (line.startsWith("@conforms-to")) {
      currentSection = "conforms-to";
      dossier.conformsTo = line.replace("@conforms-to", "").trim();
      continue;
    } else if (line.startsWith("@technical-debt")) {
      currentSection = "technical-debt";
      continue;
    } else if (line.startsWith("@refactoring-goals")) {
      currentSection = "refactoring-goals";
      continue;
    } else if (line.startsWith("@")) {
      currentSection = null;
      continue;
    }

    if (currentSection === "purpose") {
      dossier.purpose += (dossier.purpose ? " " : "") + line;
    } else if (currentSection === "conforms-to") {
      dossier.conformsTo += (dossier.conformsTo ? " " : "") + line;
    } else if (currentSection === "technical-debt") {
      const debtMatch = line.match(/^-\s*\[([ xX])\]\s*(.*)/);
      if (debtMatch) {
        const isCompleted = debtMatch[1].toLowerCase() === "x";
        const description = debtMatch[2].trim();
        if (description.toLowerCase() !== "none") {
          dossier.technicalDebt.push({
            status: isCompleted ? "completed" : "pending",
            description,
          });
        }
      }
    } else if (currentSection === "refactoring-goals") {
      const goalMatch = line.match(/^-\s*(?:\[([ xX])\])?\s*(.*)/);
      if (goalMatch) {
        const isCompleted = goalMatch[1] ? goalMatch[1].toLowerCase() === "x" : false;
        const description = goalMatch[2].trim();
        if (description.toLowerCase() !== "none") {
          dossier.refactoringGoals.push({
            status: isCompleted ? "completed" : "pending",
            description,
          });
        }
      }
    }
  }

  return dossier;
}

// Define technical debt classification categories (product-agnostic).
const CATEGORIES = [
  {
    id: "errr-debug",
    name: "SRE: Errr Debug Context",
    description: "Add `.debug()` context to `Errr.newError` calls to capture runtime variables in error logs.",
    opportunity: "Proactively append `.debug({ ... })` to all newly created `Errr.newError` instances to ensure runtime state is captured during exceptions.",
    match: (desc) => /add \.debug\(\)/i.test(desc) || /add \.debug\(\) to Errr/i.test(desc),
  },
  {
    id: "logger-demote",
    name: "SRE: LoggerProxy Demote to DEBUG",
    description: "Demote noisy or repetitive `LoggerProxy` statements to `DEBUG` or `SILLY` level.",
    opportunity: "Ensure high-frequency steps or normal control-flow logs are logged at `DEBUG` or `SILLY` levels, reserving `INFO` and above for significant lifecycle events.",
    match: (desc) => /demote to DEBUG/i.test(desc),
  },
  {
    id: "logger-static",
    name: "SRE: LoggerProxy Static Messages & Attributes",
    description: "Refactor `LoggerProxy` statements to use static message strings and pass dynamic variables in attributes.",
    opportunity: "Avoid string interpolation in log messages (e.g. `logger.info(\`User ${id} logged in\`)`). Instead, use static strings and pass dynamic variables as structured attributes (e.g. `logger.info(\"User logged in\", { userId: id })\`).",
    match: (desc) => /refactor LoggerProxy.*use static message/i.test(desc) || /refactor Errr.*use static message/i.test(desc),
  },
  {
    id: "errr-append",
    name: "SRE: Errr Append To Error",
    description: "Append original errors using `.appendTo(err)` when wrapping exceptions with `Errr`.",
    opportunity: "When catching and re-throwing errors, always chain `.appendTo(caughtError)` to preserve the original stack trace and error properties.",
    match: (desc) => /add \.appendTo/i.test(desc) || /use Errr.newError with \.appendTo/i.test(desc),
  },
  {
    id: "swallowed-exceptions",
    name: "SRE: Exception Swallowing / Catch Blocks",
    description: "Avoid swallowing exceptions in empty catch blocks.",
    opportunity: "Never leave catch blocks empty. At a minimum, log the warning or wrap and re-throw the error with appropriate context.",
    match: (desc) => /swallowing exception/i.test(desc) || /empty catch block/i.test(desc),
  },
  {
    id: "missing-tests",
    name: "Testing: Missing Unit/Maddox Tests",
    description: "Missing comprehensive unit tests or corresponding Maddox scenario spec files.",
    opportunity: "Ensure every new or modified Step, Model, Module, and Route loader/action has a corresponding Maddox scenario spec file with 100% happy and failure path coverage.",
    match: (desc) => /missing.*tests/i.test(desc) || /missing corresponding Maddox/i.test(desc),
  },
  {
    id: "missing-proptypes",
    name: "UI/React: Component Quality & PropTypes",
    description: "Missing propTypes validation in React components.",
    opportunity: "Always define `propTypes` or TypeScript interfaces for all React components to ensure prop contract safety.",
    match: (desc) => /missing propTypes/i.test(desc),
  },
  {
    id: "architectural-conformance",
    name: "Steps Pattern & Architectural Conformance",
    description: "Steps Pattern and Maddox testing architectural violations.",
    opportunity: "Adhere strictly to the Steps Pattern layers and Maddox testing boundaries. Step classes must never access the database directly, and tests must never mock the Step under test.",
    match: (desc) => /\[Steps\]/i.test(desc) || /\[Maddox\]/i.test(desc) || /conforms-to/i.test(desc),
  },
  {
    id: "other-debt",
    name: "Other Implementation Debt",
    description: "Miscellaneous codebase and implementation improvements.",
    opportunity: "Keep code clean, modular, and aligned with modern JavaScript/TypeScript best practices.",
    match: () => true, // catch-all
  }
];

// Categorize a debt description.
function getCategory(description) {
  for (const cat of CATEGORIES) {
    if (cat.id === "other-debt") continue;
    if (cat.match(description)) {
      return cat;
    }
  }
  return CATEGORIES.find(c => c.id === "other-debt");
}

// Extract a readable scope label from a file path relative to the holding repo
// root. Conventions supported:
//   products/<product>/<workspace>/...      → "<product> / <workspace>"
//   packages/<pkg>/...                      → "packages/<pkg>"
//   tools/<tool>/...                        → "tools/<tool>"
//   work/<product>/<slug>/...               → "work/<product>/<slug>"
//   docs/..., .cursor/..., etc.             → first segment
// Anything else falls back to the first path segment.
function getScope(filePath) {
  const parts = filePath.split("/");
  if (parts[0] === "products" && parts[1] && parts[2]) {
    return `${parts[1]} / ${parts[2]}`;
  }
  if (parts[0] === "packages" && parts[1]) return `packages/${parts[1]}`;
  if (parts[0] === "tools" && parts[1]) return `tools/${parts[1]}`;
  if (parts[0] === "work" && parts[1]) {
    return parts[2] ? `work/${parts[1]}/${parts[2]}` : `work/${parts[1]}`;
  }
  return parts[0] || "root";
}

// Generate the markdown log.
function generateMarkdownReport(dossiers, holdingRepoRoot) {
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "full",
    timeStyle: "short",
  });

  let totalDossiers = dossiers.length;
  let totalPendingDebt = 0;
  let totalCompletedDebt = 0;
  let totalRefactoringGoals = 0;

  const openDebtByCategory = {};
  const resolvedDebtByCategory = {};
  for (const cat of CATEGORIES) {
    openDebtByCategory[cat.id] = {
      category: cat,
      itemsByFile: {},
      totalCount: 0,
    };
    resolvedDebtByCategory[cat.id] = {
      category: cat,
      totalCount: 0,
    };
  }

  const goalsByScope = {};
  const filesByScope = {};
  const filesByConformance = {};

  for (const d of dossiers) {
    const scope = getScope(d.file);
    filesByScope[scope] = (filesByScope[scope] || 0) + 1;

    const rule = d.conformsTo || "Not specified";
    filesByConformance[rule] = (filesByConformance[rule] || 0) + 1;

    const openDebts = d.technicalDebt.filter((t) => t.status === "pending");
    totalPendingDebt += openDebts.length;
    for (const debt of openDebts) {
      const cat = getCategory(debt.description);
      if (!openDebtByCategory[cat.id].itemsByFile[d.file]) {
        openDebtByCategory[cat.id].itemsByFile[d.file] = [];
      }
      openDebtByCategory[cat.id].itemsByFile[d.file].push(debt.description);
      openDebtByCategory[cat.id].totalCount++;
    }

    const resolvedDebts = d.technicalDebt.filter((t) => t.status === "completed");
    totalCompletedDebt += resolvedDebts.length;
    for (const debt of resolvedDebts) {
      const cat = getCategory(debt.description);
      resolvedDebtByCategory[cat.id].totalCount++;
    }

    totalRefactoringGoals += d.refactoringGoals.length;
    if (d.refactoringGoals.length > 0) {
      if (!goalsByScope[scope]) {
        goalsByScope[scope] = [];
      }
      for (const goal of d.refactoringGoals) {
        goalsByScope[scope].push({
          file: d.file,
          description: goal.description,
          status: goal.status,
        });
      }
    }
  }

  let md = `# Technical Debt Ledger

This file is an automated, central registry of all file-level technical debt and refactoring goals tracked across the holding repo via \`@agent-dossier\` blocks. One ledger across every product so the \`steps-engineer\` skill can learn cross-product patterns and update \`DOSSIER.md\` directives from aggregated evidence.

*Last Synchronized: ${timestamp} (EST)*
*Holding repo root: \`${holdingRepoRoot}\`*

---

## 📊 Technical Debt Dashboard

| Metric | Count |
| :--- | :--- |
| **Total Files with Dossiers** | ${totalDossiers} |
| **Open Technical Debt Items** | ${totalPendingDebt} 🔴 |
| **Resolved Technical Debt Items** | ${totalCompletedDebt} 🟢 |
| **Future Refactoring Goals** | ${totalRefactoringGoals} 🔵 |

---

## 🔴 Open Technical Debt Items by Category (${totalPendingDebt})

Below is the list of unresolved architectural and implementation debt, grouped by category to highlight systematic opportunities for improvement.

`;

  let categoryIndex = 1;
  for (const cat of CATEGORIES) {
    const catData = openDebtByCategory[cat.id];
    if (catData.totalCount > 0) {
      md += `### ${categoryIndex++}. ${catData.category.name} (${catData.totalCount} items)\n`;
      md += `* **Description**: ${catData.category.description}\n`;
      md += `* **Actionable Steps-Engineer Opportunity**: ${catData.category.opportunity}\n`;
      md += `* **Affected Files**:\n`;

      for (const [file, descriptions] of Object.entries(catData.itemsByFile)) {
        const combinedDesc = descriptions
          .map((desc) => desc.trim().replace(/\.$/, ""))
          .join("; ");
        md += `  - \`${file}\`: ${combinedDesc}\n`;
      }
      md += `\n`;
    }
  }

  if (totalPendingDebt === 0) {
    md += `*No open technical debt items found! High five! 🎉*\n\n`;
  }

  md += `---

## 🟢 Resolved Technical Debt Summary (${totalCompletedDebt})

Tracking historical fixes prevents regressions and preserves cognitive history of what was fixed and why.

| Category | Resolved Items |
| :--- | :--- |
`;

  for (const cat of CATEGORIES) {
    const count = resolvedDebtByCategory[cat.id].totalCount;
    if (count > 0) {
      md += `| **${cat.name}** | ${count} 🟢 |\n`;
    }
  }

  md += `\n---

## 🔵 Future Refactoring Goals (${totalRefactoringGoals})

Active architectural directions or improvements marked for future passes, grouped by scope (product/workspace).

`;

  const sortedScopes = Object.keys(goalsByScope).sort();
  for (const scope of sortedScopes) {
    md += `### Scope: \`${scope}\`\n`;
    for (const goal of goalsByScope[scope]) {
      const check = goal.status === "completed" ? "[x]" : "[ ]";
      md += `* ${check} \`${goal.file}\`: ${goal.description}\n`;
    }
    md += `\n`;
  }

  if (totalRefactoringGoals === 0) {
    md += `*No future refactoring goals defined.*\n\n`;
  }

  md += `---

## 📂 Detailed Dossier Distribution

To keep the ledger compact, the detailed file-by-file inventory has been consolidated into architectural distributions.

### 1. Dossier Distribution by Scope

| Scope | File Count |
| :--- | :--- |
`;

  const sortedScopeCounts = Object.keys(filesByScope).sort();
  for (const scope of sortedScopeCounts) {
    md += `| \`${scope}\` | ${filesByScope[scope]} |\n`;
  }

  md += `\n### 2. Dossier Distribution by Conformance Rule

| Conformance Rule | File Count |
| :--- | :--- |
`;

  const sortedRules = Object.keys(filesByConformance).sort();
  for (const rule of sortedRules) {
    md += `| \`${rule}\` | ${filesByConformance[rule]} |\n`;
  }

  return md;
}

// Main execution function.
async function main() {
  const invokedFrom = process.cwd();
  const holdingRepoRoot = await findHoldingRepoRoot(invokedFrom);
  console.log(`Scanning holding repo root: ${holdingRepoRoot}`);

  const outputPath = path.join(
    os.homedir(),
    ".cursor",
    "skills",
    "steps-engineer",
    "TECH_DEBT_LOG.md"
  );

  try {
    const allFiles = await findFiles(holdingRepoRoot);
    console.log(`Found ${allFiles.length} source files to scan.`);

    const dossiers = [];

    for (const file of allFiles) {
      const content = await fs.readFile(file, "utf8");
      const relativePath = path.relative(holdingRepoRoot, file);
      const dossier = parseDossier(content, relativePath);

      if (dossier) {
        dossiers.push(dossier);
      }
    }

    console.log(`Extracted @agent-dossier information from ${dossiers.length} files.`);

    dossiers.sort((a, b) => a.file.localeCompare(b.file));

    const report = generateMarkdownReport(dossiers, holdingRepoRoot);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, report, "utf8");
    console.log(`Successfully updated technical debt log at: ${outputPath}`);
  } catch (error) {
    console.error("Failed to sync technical debt ledger:", error);
    process.exit(1);
  }
}

main();
