#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

// ── Args ───────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length === 0) {
  process.stderr.write('Usage: node collect-files.js <ext1> [ext2] ...\n');
  process.stderr.write('Example: node collect-files.js ts js tsx scss\n');
  process.exit(1);
}

const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', '.next',
  'coverage', '.cache', '.turbo', 'out',
]);
const extSet = new Set(args.map(e => '.' + e.replace(/^\.+/, '')));
const OUTPUT  = 'chat.md';

// ── Tree building ──────────────────────────────────────────────────────────────

function buildTree(dir, depth = 0) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return null; }

  const children = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel  = path.relative(process.cwd(), full);

    if (entry.isDirectory()) {
      const sub = buildTree(full, depth + 1);
      if (sub && sub.fileCount > 0)
        children.push({
          type: 'dir', name: entry.name, path: rel,
          depth, expanded: true,
          children: sub.children, fileCount: sub.fileCount,
        });
    } else if (entry.isFile() && extSet.has(path.extname(entry.name))) {
      children.push({ type: 'file', name: entry.name, path: rel, depth });
    }
  }

  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const fileCount = children.reduce(
    (s, c) => s + (c.type === 'file' ? 1 : c.fileCount), 0
  );
  return { children, fileCount };
}

function getFilePaths(node) {
  if (node.type === 'file') return [node.path];
  return node.children.flatMap(getFilePaths);
}

function flattenVisible(nodes) {
  const out = [];
  for (const n of nodes) {
    out.push(n);
    if (n.type === 'dir' && n.expanded)
      out.push(...flattenVisible(n.children));
  }
  return out;
}

function setExpanded(nodes, value) {
  for (const n of nodes) {
    if (n.type === 'dir') { n.expanded = value; setExpanded(n.children, value); }
  }
}

// ── Init ───────────────────────────────────────────────────────────────────────

const treeRoot = buildTree(process.cwd());
if (!treeRoot || treeRoot.fileCount === 0) {
  console.log(`No files found for extension(s): ${args.join(', ')}`);
  process.exit(0);
}
const allFiles = treeRoot.children.flatMap(getFilePaths);

const selected = new Set();
let cursor = 0;
let offset = 0;
const visibleRows = () => Math.max(5, (process.stdout.rows || 24) - 8);

// ── ANSI ───────────────────────────────────────────────────────────────────────

const R      = '\x1b[0m';
const B      = '\x1b[1m';
const DIM    = '\x1b[2m';
const GREEN  = '\x1b[32m';
const CYAN   = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BLUE   = '\x1b[34m';
const WHITE  = '\x1b[97m';
const BG_HL  = '\x1b[48;5;238m';
const HIDE_C = '\x1b[?25l';
const SHOW_C = '\x1b[?25h';

// ── Selection helpers ──────────────────────────────────────────────────────────

function dirState(node) {
  const files = getFilePaths(node);
  const n     = files.filter(f => selected.has(f)).length;
  return n === 0 ? 'none' : n === files.length ? 'all' : 'partial';
}

function checkbox(node, active) {
  if (node.type === 'dir') {
    const s = dirState(node);
    if (active) return s === 'none' ? '[ ]' : s === 'all' ? '[✓]' : '[~]';
    return s === 'all'     ? `${GREEN}${B}[✓]${R}`
         : s === 'partial' ? `${YELLOW}[~]${R}`
                           : `${DIM}[ ]${R}`;
  }
  const sel = selected.has(node.path);
  if (active) return sel ? '[✓]' : '[ ]';
  return sel ? `${GREEN}${B}[✓]${R}` : `${DIM}[ ]${R}`;
}

// ── Render ─────────────────────────────────────────────────────────────────────

const HELP =
  '↑↓ move · ←→ collapse/expand · SPACE toggle · A all/none · E expand all · W collapse all · ENTER confirm · Q quit';

function render() {
  const rows    = visibleRows();
  const visible = flattenVisible(treeRoot.children);
  const end     = Math.min(offset + rows, visible.length);
  const lines   = [];

  lines.push(
    `${B}${CYAN}◆ File Collector${R}  ` +
    `${DIM}exts: ${args.join(', ')}  |  files found: ${allFiles.length}${R}`
  );
  lines.push(`${DIM}${HELP}${R}`);
  lines.push(`${YELLOW}Selected: ${B}${selected.size}${R}${YELLOW} / ${allFiles.length}${R}`);
  lines.push('');

  for (let i = offset; i < end; i++) {
    const node   = visible[i];
    const active = i === cursor;
    const pad    = '  '.repeat(node.depth);
    const cb     = checkbox(node, active);

    let row;
    if (node.type === 'dir') {
      const arrow = node.expanded ? '▾' : '▸';
      const fc    = getFilePaths(node).length;
      const count = `(${fc} file${fc !== 1 ? 's' : ''})`;
      if (active) {
        row = `${BG_HL}${WHITE} ${pad}${cb} ${arrow} ${node.name}/  ${count} ${R}`;
      } else {
        row = `  ${pad}${cb} ${BLUE}${B}${arrow} ${node.name}/${R} ${DIM}${count}${R}`;
      }
    } else {
      if (active) {
        row = `${BG_HL}${WHITE} ${pad}${cb} ${node.name} ${R}`;
      } else {
        row = `  ${pad}${cb} ${node.name}`;
      }
    }
    lines.push(row);
  }

  if (visible.length > rows) {
    lines.push('');
    lines.push(`${DIM}rows ${offset + 1}–${end} of ${visible.length}   PgUp/PgDn for pages${R}`);
  }

  process.stdout.write('\x1b[2J\x1b[H' + lines.join('\n'));
}

// ── Confirm / cleanup ──────────────────────────────────────────────────────────

function confirm() {
  cleanup();
  process.stdout.write('\x1b[2J\x1b[H');
  if (selected.size === 0) { console.log('No files selected — nothing written.'); return; }

  const chosen = allFiles.filter(f => selected.has(f));
  let content  = '';
  for (const file of chosen) {
    const lang = path.extname(file).slice(1);
    let src;
    try { src = fs.readFileSync(file, 'utf8'); }
    catch { src = '[error: could not read file]'; }
    content += `### \`${file}\`\n\n\`\`\`${lang}\n${src}\n\`\`\`\n\n`;
  }
  fs.appendFileSync(OUTPUT, content, 'utf8');
  console.log(`${GREEN}${B}✓ Done!${R}  Appended ${chosen.length} file(s) → ${B}${OUTPUT}${R}\n`);
  chosen.forEach(f => console.log(`  ${DIM}+${R} ${f}`));
}

function cleanup() {
  process.stdout.write(SHOW_C);
  if (process.stdin.isTTY) { process.stdin.setRawMode(false); process.stdin.pause(); }
}

// ── Signals ────────────────────────────────────────────────────────────────────

process.on('exit', () => process.stdout.write(SHOW_C));
process.on('SIGINT', () => {
  cleanup();
  process.stdout.write('\x1b[2J\x1b[H');
  console.log('Cancelled.');
  process.exit(0);
});

if (!process.stdin.isTTY) { console.error('Interactive terminal required.'); process.exit(1); }

process.stdout.write(HIDE_C);
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');
render();

// ── Input loop ─────────────────────────────────────────────────────────────────

process.stdin.on('data', key => {
  const rows = visibleRows();

  if (key === '\u0003' || key === 'q' || key === 'Q') {
    cleanup();
    process.stdout.write('\x1b[2J\x1b[H');
    console.log('Cancelled.');
    process.exit(0);
  }
  if (key === '\r' || key === '\n') { confirm(); process.exit(0); }

  const visible = flattenVisible(treeRoot.children);
  const node    = visible[cursor];
  if (!node) { render(); return; }

  if (key === ' ') {
    if (node.type === 'dir') {
      const files = getFilePaths(node);
      dirState(node) === 'all'
        ? files.forEach(f => selected.delete(f))
        : files.forEach(f => selected.add(f));
    } else {
      selected.has(node.path) ? selected.delete(node.path) : selected.add(node.path);
    }
  }

  if (key === 'a' || key === 'A') {
    selected.size === allFiles.length
      ? selected.clear()
      : allFiles.forEach(f => selected.add(f));
  }

  if (key === 'e' || key === 'E') setExpanded(treeRoot.children, true);

  if (key === 'w' || key === 'W') {
    setExpanded(treeRoot.children, false);
    cursor = 0; offset = 0;
  }

  if (key === '\x1b[C') {
    if (node.type === 'dir') {
      if (!node.expanded) node.expanded = true;
      else cursor++;
    }
  }

  if (key === '\x1b[D') {
    if (node.type === 'dir' && node.expanded) {
      node.expanded = false;
    } else if (node.depth > 0) {
      for (let i = cursor - 1; i >= 0; i--) {
        if (visible[i].type === 'dir' && visible[i].depth < node.depth) {
          cursor = i; break;
        }
      }
    }
  }

  if (key === '\x1b[A') cursor = Math.max(0, cursor - 1);
  if (key === '\x1b[B') cursor++;

  if (key === '\x1b[5~') { cursor = Math.max(0, cursor - rows); offset = Math.max(0, offset - rows); }
  if (key === '\x1b[6~') { cursor += rows; offset += rows; }

  if (key === '\x1b[H' || key === '\x1b[1~') { cursor = 0; offset = 0; }
  if (key === '\x1b[F' || key === '\x1b[4~') { cursor = Infinity; offset = Infinity; }

  const v2  = flattenVisible(treeRoot.children);
  const max = Math.max(0, v2.length - 1);
  cursor    = Math.min(Math.max(0, cursor), max);
  if (cursor < offset) offset = cursor;
  if (cursor >= offset + rows) offset = cursor - rows + 1;
  offset    = Math.min(Math.max(0, offset), Math.max(0, v2.length - rows));

  render();
});
