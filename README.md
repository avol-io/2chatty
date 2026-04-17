```
 ██████╗  ██████╗██╗  ██╗ █████╗ ████████╗████████╗██╗   ██╗
╚════██╗ ██╔════╝██║  ██║██╔══██╗╚══██╔══╝╚══██╔══╝╚██╗ ██╔╝
 █████╔╝ ██║     ███████║███████║   ██║      ██║    ╚████╔╝
██╔═══╝  ██║     ██╔══██║██╔══██║   ██║      ██║     ╚██╔╝
███████╗ ╚██████╗██║  ██║██║  ██║   ██║      ██║      ██║
╚══════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚═╝      ╚═╝      ╚═╝
```

> **Pick your source files. Dump them into markdown. Feed your AI.**

[![npm version](https://img.shields.io/npm/v/@avol-io/2chatty)](https://www.npmjs.com/package/@avol-io/2chatty)
[![license](https://img.shields.io/npm/l/@avol-io/2chatty)](./LICENSE)
[![node](https://img.shields.io/node/v/@avol-io/2chatty)](https://nodejs.org)

---


`2chatty` is a zero-dependency interactive terminal UI that lets you browse your project's source files, cherry-pick exactly what you need, and collect them into a single `chat.md` file — ready to paste into ChatGPT, Claude, Gemini, or any other AI chat.

No config files. No install required. Just run it from your project root.

```
◆ File Collector  exts: ts, tsx  |  files found: 38
↑↓ move · ←→ collapse/expand · SPACE toggle · A all/none · E expand all · W collapse all · ENTER confirm · Q quit
Selected: 5 / 38

  [~] ▾ src/  (31 files)
  [✓] ▾ components/  (8 files)
        [✓] Button.tsx
        [✓] Input.tsx
        [✓] Modal.tsx
  [ ] ▸ hooks/  (6 files)
  [ ] ▸ utils/  (5 files)
  [ ] app.tsx
  [ ] main.ts
```

Each selected file is appended to `chat.md` as a fenced code block:

````md
### `src/components/Button.tsx`

```tsx
// ... file content ...
```
````



## Usage

No installation needed — just use `npx`:

```bash
npx @avol-io/2chatty [ext1] [ext2] [ext3] ...
```

### Examples

```bash
# TypeScript + React project
npx @avol-io/2chatty ts tsx

# Full-stack — grab everything relevant
npx @avol-io/2chatty ts tsx scss

# Plain JavaScript project
npx @avol-io/2chatty js jsx css

# Java project
npx @avol-io/2chatty java

# No filter — collect all files (asks for confirmation)
npx @avol-io/2chatty
```

Run from your **project root**. The tool scans from the current working directory and appends selected file contents to `chat.md` in the same folder.

> **Tip:** `chat.md` is *appended*, not overwritten. Run the tool multiple times to collect files across different sessions. Delete `chat.md` manually to start fresh.

### No-filter mode

If you run `2chatty` without specifying any extension, it will ask for confirmation before scanning all files in the project:





## Keyboard shortcuts

| Key | Action |
|---|---|
| `↑` / `↓` | Move cursor up / down |
| `→` | Expand collapsed folder (or step into first child) |
| `←` | Collapse expanded folder (or jump to parent folder) |
| `Space` | Toggle file — or bulk toggle **all files in a folder** |
| `A` | Select all / deselect all |
| `E` | Expand all folders |
| `W` | Collapse all folders |
| `PgUp` / `PgDn` | Scroll one page up / down |
| `Home` / `End` | Jump to first / last item |
| `Enter` | Confirm selection and write `chat.md` |
| `Q` / `Ctrl+C` | Quit without writing |

### Folder checkbox states

| Symbol | Meaning |
|---|---|
| `[✓]` green | All files in the folder are selected |
| `[~]` yellow | Some files selected (partial) |
| `[ ]` | No files selected |



## Output format

Selected files are appended to `chat.md` in your project root, each wrapped in a fenced markdown code block with the correct language tag:

````md
### `src/components/Button.tsx`

```tsx
import React from 'react';
// ...
```

### `src/styles/main.scss`

```scss
$primary: #01696f;
// ...
```
````

This format is recognised and rendered correctly by all major AI chat interfaces.



## Skipped directories

The following directories are automatically ignored during the file scan:

| Category | Directories |
|---|---|
| VCS | `.git` · `.svn` · `.hg` |
| JS / Node | `node_modules` · `dist` · `build` · `.next` · `coverage` · `.cache` · `.turbo` · `out` · `.nuxt` · `.output` · `.svelte-kit` |
| Java / Maven / Gradle | `target` · `.gradle` · `.mvn` |
| IDE | `.idea` · `.vscode` · `.eclipse` · `.settings` |
| Misc | `__pycache__` · `.pytest_cache` · `.mypy_cache` · `vendor` |

> **Note:** hidden files and folders (e.g. `.storybook`, `.env`, `.eslintrc`) are **included** in the scan — only the directories listed above are excluded. This ensures config files relevant to your project are always visible and selectable.



## Requirements

- **Node.js** ≥ 18
- An **interactive TTY** terminal (standard terminal emulators, iTerm2, Windows Terminal, WSL — all work fine)

---

## License

[MIT](./LICENSE) © [avol.io](https://www.avol.io)