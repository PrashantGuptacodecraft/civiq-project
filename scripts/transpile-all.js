const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/.pnpm/typescript@5.9.3/node_modules/typescript'));

function safeWrite(destPath, content) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      fs.writeFileSync(destPath, content, 'utf8');
      return;
    } catch(e) {
      if (attempt === 4) throw e;
      const start = Date.now();
      while (Date.now() - start < 100) {}
    }
  }
}

function transpileFile(srcCode, isJsx = false) {
  const result = ts.transpileModule(srcCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: isJsx ? ts.JsxEmit.Preserve : ts.JsxEmit.None,
      removeComments: false,
      esModuleInterop: true,
      importHelpers: false,
    }
  });
  return result.outputText;
}

function fixRelativeImports(code, filePath, targetDir) {
  const fileDir = path.dirname(filePath);
  return code.replace(/(from\s+['"])(\.[^'"]+)(['"])/g, (match, prefix, relPath, suffix) => {
    if (/\.(js|jsx|json|css|mjs|cjs)$/.test(relPath)) {
      return match;
    }
    const absPath = path.resolve(fileDir, relPath);
    if (fs.existsSync(absPath + '.ts') || fs.existsSync(absPath + '.js')) {
      return `${prefix}${relPath}.js${suffix}`;
    }
    if (fs.existsSync(absPath + '.tsx') || fs.existsSync(absPath + '.jsx')) {
      return `${prefix}${relPath}.jsx${suffix}`;
    }
    if (fs.existsSync(path.join(absPath, 'index.ts')) || fs.existsSync(path.join(absPath, 'index.js'))) {
      return `${prefix}${relPath}/index.js${suffix}`;
    }
    return `${prefix}${relPath}.js${suffix}`;
  });
}

function processDirectory(sourceDir, destDir) {
  if (!fs.existsSync(sourceDir)) return;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', 'dist'].includes(entry.name)) continue;

    const srcPath = path.join(sourceDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'generated') {
        // Copy generated directly
        fs.cpSync(srcPath, path.join(destDir, entry.name), { recursive: true });
        continue;
      }
      processDirectory(srcPath, path.join(destDir, entry.name));
    } else {
      let destName = entry.name;
      const isTs = entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts');
      const isTsx = entry.name.endsWith('.tsx');

      if (entry.name.endsWith('.d.ts')) {
        // Skip .d.ts type declaration files
        continue;
      } else if (isTs) {
        destName = entry.name.replace(/\.ts$/, '.js');
        const raw = fs.readFileSync(srcPath, 'utf8');
        let js = transpileFile(raw, false);
        js = fixRelativeImports(js, srcPath, destDir);
        safeWrite(path.join(destDir, destName), js);
      } else if (isTsx) {
        destName = entry.name.replace(/\.tsx$/, '.jsx');
        const raw = fs.readFileSync(srcPath, 'utf8');
        let jsx = transpileFile(raw, true);
        jsx = fixRelativeImports(jsx, srcPath, destDir);
        safeWrite(path.join(destDir, destName), jsx);
      } else {
        // Copy other files (.css, .json, .prisma, etc.)
        fs.copyFileSync(srcPath, path.join(destDir, destName));
      }
    }
  }
}

console.log('=== 1. Transpiling packages/contracts -> shared/contracts ===');
processDirectory(path.join(root, 'packages/contracts/src'), path.join(root, 'shared/contracts'));

console.log('=== 2. Transpiling packages/auth -> shared/auth ===');
processDirectory(path.join(root, 'packages/auth/src'), path.join(root, 'shared/auth'));

console.log('=== 3. Transpiling packages/db -> shared/db ===');
processDirectory(path.join(root, 'packages/db/src'), path.join(root, 'shared/db/src'));
processDirectory(path.join(root, 'packages/db/seed'), path.join(root, 'shared/db/seed'));
fs.mkdirSync(path.join(root, 'shared/db/prisma'), { recursive: true });
fs.copyFileSync(path.join(root, 'packages/db/prisma/schema.prisma'), path.join(root, 'shared/db/prisma/schema.prisma'));
if (fs.existsSync(path.join(root, 'packages/db/.env'))) {
  fs.copyFileSync(path.join(root, 'packages/db/.env'), path.join(root, 'shared/db/.env'));
}

console.log('=== 4. Transpiling packages/observability -> shared/observability ===');
processDirectory(path.join(root, 'packages/observability/src'), path.join(root, 'shared/observability'));

console.log('=== 5. Transpiling apps/api -> backend ===');
processDirectory(path.join(root, 'apps/api/src'), path.join(root, 'backend/src'));
processDirectory(path.join(root, 'apps/api/tests'), path.join(root, 'backend/tests'));

console.log('=== 6. Transpiling apps/worker -> backend/src/jobs ===');
processDirectory(path.join(root, 'apps/worker/src/jobs'), path.join(root, 'backend/src/jobs'));

console.log('=== 7. Transpiling apps/web -> frontend ===');
processDirectory(path.join(root, 'apps/web/app'), path.join(root, 'frontend/app'));
processDirectory(path.join(root, 'apps/web/features'), path.join(root, 'frontend/features'));
processDirectory(path.join(root, 'apps/web/components'), path.join(root, 'frontend/components'));
processDirectory(path.join(root, 'apps/web/hooks'), path.join(root, 'frontend/hooks'));
processDirectory(path.join(root, 'apps/web/lib'), path.join(root, 'frontend/lib'));
processDirectory(path.join(root, 'apps/web/styles'), path.join(root, 'frontend/styles'));
processDirectory(path.join(root, 'apps/web/tests'), path.join(root, 'frontend/tests'));
if (fs.existsSync(path.join(root, 'apps/web/public'))) {
  processDirectory(path.join(root, 'apps/web/public'), path.join(root, 'frontend/public'));
}

// Config files for frontend
['next.config.js', 'postcss.config.js'].forEach(cfg => {
  const p = path.join(root, 'apps/web', cfg);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(root, 'frontend', cfg));
});
if (fs.existsSync(path.join(root, 'apps/web/tailwind.config.ts'))) {
  const twRaw = fs.readFileSync(path.join(root, 'apps/web/tailwind.config.ts'), 'utf8');
  const twJs = transpileFile(twRaw, false);
  safeWrite(path.join(root, 'frontend/tailwind.config.js'), twJs);
}

console.log('Transpilation complete!');
