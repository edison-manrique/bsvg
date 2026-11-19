const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 1. Build playground
console.log('Building playground...');
const rootDir = __dirname;
const playgroundDir = path.join(rootDir, 'playground');
execSync('bun run build', { cwd: playgroundDir, stdio: 'inherit' });

const distDir = path.join(playgroundDir, 'dist');
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));

// 2. Prepare temp repo
const tempDir = path.join(os.tmpdir(), 'bsvg-deploy-' + Date.now());
fs.mkdirSync(tempDir, { recursive: true });

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    if (item === '__pycache__' || item.endsWith('.pyc')) continue;
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

console.log('Copying files from', distDir, 'to', tempDir);
copyDir(distDir, tempDir);

const opts = { cwd: tempDir, stdio: 'inherit' };
execSync('git init', opts);
execSync('git config user.name "Edison Manrique Chocce"', opts);
execSync('git config user.email "edison.manrique.chocce@gmail.com"', opts);
execSync('git remote add origin git@github.com:edison-manrique/bsvg.git', opts);
execSync('git checkout -b gh-pages', opts);
execSync('git add -A', opts);
execSync('git commit -m "deploy: initial playground for bsvg suite"', opts);
console.log('Pushing to origin gh-pages...');
execSync('git push -f origin gh-pages', opts);

fs.rmSync(tempDir, { recursive: true, force: true });
console.log('Playground deployed successfully to gh-pages!');
