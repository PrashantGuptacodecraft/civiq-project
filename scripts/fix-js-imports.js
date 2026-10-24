const fs = require('fs');
const path = require('path');

const root = process.argv[2] || process.cwd();

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);
  let changed = false;

  // 1. Fix relative imports/exports without extensions:
  // e.g., from './something' or from '../something'
  content = content.replace(/(from\s+['"])(\.[^'"]+)(['"])/g, (match, prefix, relPath, suffix) => {
    // If it already ends with .js, .json, .css, leave it
    if (/\.(js|jsx|json|css|mjs|cjs)$/.test(relPath)) {
      return match;
    }

    const absPath = path.resolve(dir, relPath);
    // Check if adding .js matches a file
    if (fs.existsSync(absPath + '.js')) {
      changed = true;
      return `${prefix}${relPath}.js${suffix}`;
    }
    // Check if adding .jsx matches a file
    if (fs.existsSync(absPath + '.jsx')) {
      changed = true;
      return `${prefix}${relPath}.jsx${suffix}`;
    }
    // Check if it's a directory with index.js
    if (fs.existsSync(path.join(absPath, 'index.js'))) {
      changed = true;
      return `${prefix}${relPath}/index.js${suffix}`;
    }
    // Fallback: append .js
    changed = true;
    return `${prefix}${relPath}.js${suffix}`;
  });

  // 2. Fix dynamic imports: import('./something')
  content = content.replace(/(import\s*\(\s*['"])(\.[^'"]+)(['"]\s*\))/g, (match, prefix, relPath, suffix) => {
    if (/\.(js|jsx|json|css|mjs|cjs)$/.test(relPath)) {
      return match;
    }
    const absPath = path.resolve(dir, relPath);
    if (fs.existsSync(absPath + '.js')) {
      changed = true;
      return `${prefix}${relPath}.js${suffix}`;
    }
    if (fs.existsSync(path.join(absPath, 'index.js'))) {
      changed = true;
      return `${prefix}${relPath}/index.js${suffix}`;
    }
    changed = true;
    return `${prefix}${relPath}.js${suffix}`;
  });

  // 3. Fix leftover 'type' keyword in imports:
  // import { CIVIC_ISSUE_TAXONOMY_V1, type IssueCategory } -> import { CIVIC_ISSUE_TAXONOMY_V1 }
  content = content.replace(/import\s*\{([^}]+)\}\s*from/g, (match, inner) => {
    const parts = inner.split(',').map(p => p.trim());
    const filtered = parts.filter(p => !p.startsWith('type '));
    if (filtered.length !== parts.length) {
      changed = true;
      if (filtered.length === 0) {
        return 'import {} from';
      }
      return `import { ${filtered.join(', ')} } from`;
    }
    return match;
  });

  // 4. Fix vitest mocks that still reference old @civiq/ names:
  // vi.mock('@civiq/db' -> vi.mock('@civiq/shared-db'
  // vi.mock('@civiq/auth' -> vi.mock('@civiq/shared-auth'
  // vi.mock('@civiq/contracts' -> vi.mock('@civiq/shared-contracts'
  // vi.mock('@civiq/observability' -> vi.mock('@civiq/shared-observability'
  const oldMocks = [
    ["vi.mock('@civiq/db'", "vi.mock('@civiq/shared-db'"],
    ['vi.mock("@civiq/db"', 'vi.mock("@civiq/shared-db"'],
    ["vi.mock('@civiq/auth'", "vi.mock('@civiq/shared-auth'"],
    ['vi.mock("@civiq/auth"', 'vi.mock("@civiq/shared-auth"'],
    ["vi.mock('@civiq/contracts'", "vi.mock('@civiq/shared-contracts'"],
    ['vi.mock("@civiq/contracts"', 'vi.mock("@civiq/shared-contracts"'],
    ["vi.mock('@civiq/observability'", "vi.mock('@civiq/shared-observability'"],
    ['vi.mock("@civiq/observability"', 'vi.mock("@civiq/shared-observability"'],
  ];
  for (const [oldM, newM] of oldMocks) {
    if (content.includes(oldM)) {
      content = content.replaceAll(oldM, newM);
      changed = true;
    }
  }

  // 5. Clean up any empty import statements: import {} from '...';
  content = content.replace(/^\s*import\s*\{\s*\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed imports in:', path.relative(root, filePath));
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (['node_modules', '.git', '.next', 'dist', 'generated'].includes(item.name)) continue;
      walk(full);
    } else if (item.name.endsWith('.js') || item.name.endsWith('.jsx')) {
      fixImportsInFile(full);
    }
  }
}

const targetDirs = ['shared', 'backend', 'frontend'];
for (const d of targetDirs) {
  walk(path.join(root, d));
}
console.log('Import fixing complete.');
