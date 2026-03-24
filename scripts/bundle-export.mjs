import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'SKYCAST_FULL_EXPORT.md');

function walk(dir, base = '') {
  const names = fs.readdirSync(dir, { withFileTypes: true });
  const acc = [];
  for (const n of names) {
    const rel = path.join(base, n.name);
    const full = path.join(dir, n.name);
    if (n.isDirectory()) acc.push(...walk(full, rel));
    else if (/\.(js|jsx|css|ts|yaml)$/.test(n.name)) acc.push(rel);
  }
  return acc;
}

const rootFiles = [
  'package.json',
  'package-lock.json',
  'vite.config.js',
  'tailwind.config.js',
  'postcss.config.js',
  'index.html',
  '.env.example',
  'README.md',
  'jsconfig.json',
  '.gitignore',
];

const lines = [
  '## SkyCast — full source bundle',
  '',
  'Paths relative to project root.',
  '',
];

const srcDir = path.join(root, 'src');
const srcFiles = fs.existsSync(srcDir) ? walk(srcDir).sort((a, b) => a.localeCompare(b)) : [];
const pubDir = path.join(root, 'public');
const pubFiles = fs.existsSync(pubDir)
  ? fs.readdirSync(pubDir).map((f) => path.join('public', f))
  : [];

for (const rel of [...rootFiles, ...srcFiles, ...pubFiles]) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  const norm = rel.split(path.sep).join('/');
  lines.push('---', '', `### \`${norm}\``, '', '```');
  lines.push(fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n').trimEnd());
  lines.push('```', '');
}

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('Wrote', outPath);
