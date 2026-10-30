import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const cssFiles = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === 'coverage') continue;
    const path = resolve(directory, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (extname(path) === '.css') cssFiles.push(path);
  }
};
walk(root);
const failures = [];
for (const cssFile of cssFiles) {
  const content = readFileSync(cssFile, 'utf8');
  for (const match of content.matchAll(
    /@import\s+['"]([^'"]+)['"]|url\(\s*['"]?([^'")]+)['"]?\s*\)/g,
  )) {
    const request = match[1] ?? match[2];
    if (/^(data:|https?:|#)/.test(request)) continue;
    let target =
      request.startsWith('.') || request.startsWith('/')
        ? resolve(dirname(cssFile), request)
        : resolve(root, 'node_modules', request);
    if (!existsSync(target)) failures.push(`${cssFile}: missing ${request}`);
  }
  for (const source of ['src/main.ts', 'src/ui/App.ts']) {
    const content = readFileSync(resolve(root, source), 'utf8');
    for (const match of content.matchAll(
      /from\s+['"]([^.'"/][^'"]*)['"]|import\s+['"]([^.'"/][^'"]*)['"]/g,
    )) {
      const request = match[1] ?? match[2];
      const packageName = request.startsWith('@')
        ? request.split('/').slice(0, 2).join('/')
        : request.split('/')[0];
      if (
        !(packageName in packageJson.dependencies) &&
        !(packageName in packageJson.devDependencies)
      ) {
        failures.push(`${source}: undeclared package ${packageName}`);
      }
    }
  }
}
if (!existsSync(resolve(root, 'package-lock.json'))) failures.push('package-lock.json is missing');
try {
  execFileSync('npm', ['ci', '--ignore-scripts', '--dry-run'], { cwd: root, stdio: 'ignore' });
} catch {
  failures.push('npm ci --dry-run failed: package.json and lockfile are out of sync');
}
try {
  execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
} catch {
  failures.push('vite build failed');
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Verified ${cssFiles.length} CSS files and a production build.`);
