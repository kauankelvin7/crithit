import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const THEME_SRC = 'C:\\Users\\kelvi\\Local Sites\\teoriageek\\app\\public\\wp-content\\themes\\teoriageek';
const WORKSPACE_ROOT = 'c:\\Users\\kelvi\\Desktop\\crithit';
const DIST_DIR = path.join(WORKSPACE_ROOT, 'dist');
const ZIP_PATH = path.join(DIST_DIR, 'teoriageek-theme.zip');
const STAGING_ROOT = path.join(DIST_DIR, '_staging_zip');
const STAGING_THEME = path.join(STAGING_ROOT, 'teoriageek');

const EXCLUDED_NAMES = new Set([
  'node_modules',
  '.git',
  '.DS_Store',
  'Thumbs.db',
  'PROGRESSO.md',
  'MIGRATION_AUDIT.md',
  'package.json',
  'package-lock.json',
  'tailwind.config.cjs',
  'playwright.config.mjs',
]);

function copyCleanDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (EXCLUDED_NAMES.has(entry.name)) continue;
    if (entry.name.endsWith('.sql') || entry.name.endsWith('.log') || entry.name.endsWith('.spec.mjs')) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyCleanDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

fs.rmSync(STAGING_ROOT, { recursive: true, force: true });
fs.mkdirSync(DIST_DIR, { recursive: true });
if (fs.existsSync(ZIP_PATH)) {
  fs.unlinkSync(ZIP_PATH);
}

copyCleanDir(THEME_SRC, STAGING_THEME);

// Use Python zipfile with forward slashes so Linux/Apache on Locaweb extracts cleanly!
const pyScript = `
import os, zipfile
staging = r'''${STAGING_ROOT}'''
out_zip = r'''${ZIP_PATH}'''
with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for root, dirs, files in os.walk(staging):
        dirs.sort()
        files.sort()
        for f in files:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, staging).replace('\\\\', '/')
            zf.write(full, rel)
with zipfile.ZipFile(out_zip, 'r') as zf:
    names = zf.namelist()
    print('Total files in ZIP:', len(names))
    assert 'teoriageek/style.css' in names, 'Missing teoriageek/style.css at root!'
    for n in names:
        assert n.startswith('teoriageek/'), f'Invalid root entry: {n}'
    for sample in names[:12]:
        print(' -', sample)
`;

try {
  const out = execFileSync('python', ['-c', pyScript], { encoding: 'utf8' });
  console.log(out.trim());
} finally {
  fs.rmSync(STAGING_ROOT, { recursive: true, force: true });
}

const stat = fs.statSync(ZIP_PATH);
console.log(`Packaged ${ZIP_PATH} (${stat.size} bytes)`);
