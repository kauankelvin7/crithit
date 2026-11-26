import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..');
const THEME_SRC = path.resolve(__dirname, '..', 'teoriageek');
const DIST_DIR = path.join(WORKSPACE_ROOT, 'dist');
const ZIP_PATH = path.join(DIST_DIR, 'teoriageek-theme.zip');
const ROOT_ZIP_PATH = path.join(WORKSPACE_ROOT, 'teoriageek-theme.zip');
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
if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
if (fs.existsSync(ROOT_ZIP_PATH)) fs.unlinkSync(ROOT_ZIP_PATH);

copyCleanDir(THEME_SRC, STAGING_THEME);

// Gera o ZIP com barras '/' compatíveis com Linux/Apache (Locaweb) e entradas explícitas de diretório
const pyScript = `
import os, time, zipfile

staging = r'''${STAGING_ROOT}'''
out_zip = r'''${ZIP_PATH}'''

with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for root, dirs, files in os.walk(staging):
        dirs.sort()
        files.sort()
        rel_dir = os.path.relpath(root, staging).replace('\\\\', '/')
        if rel_dir != '.':
            dir_entry = rel_dir.rstrip('/') + '/'
            zinfo = zipfile.ZipInfo(dir_entry, time.localtime()[:6])
            zinfo.external_attr = (0o40755 << 16) | 0x10
            zf.writestr(zinfo, b'')
        for f in files:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, staging).replace('\\\\', '/')
            zf.write(full, rel)

with zipfile.ZipFile(out_zip, 'r') as zf:
    bad = zf.testzip()
    assert bad is None, f'Corrupted entry: {bad}'
    names = zf.namelist()
    dir_entries = [n for n in names if n.endswith('/')]
    file_entries = [n for n in names if not n.endswith('/')]
    print(f'Total entries: {len(names)} ({len(dir_entries)} directories, {len(file_entries)} files)')
    assert 'teoriageek/' in dir_entries, 'Missing explicit root directory teoriageek/!'
    assert 'teoriageek/style.css' in file_entries, 'Missing teoriageek/style.css!'
    assert 'teoriageek/functions.php' in file_entries, 'Missing teoriageek/functions.php!'
    for n in names:
        assert n.startswith('teoriageek/'), f'Invalid root entry: {n}'
    print('Explicit directories:', ', '.join(dir_entries))
`;

try {
  const out = execFileSync('python', ['-c', pyScript], { encoding: 'utf8' });
  console.log(out.trim());
} finally {
  fs.rmSync(STAGING_ROOT, { recursive: true, force: true });
}

fs.copyFileSync(ZIP_PATH, ROOT_ZIP_PATH);
const stat = fs.statSync(ZIP_PATH);
console.log(`Packaged ${ZIP_PATH} and ${ROOT_ZIP_PATH} (${stat.size} bytes)`);
