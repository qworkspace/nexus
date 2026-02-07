# Memory Viewer

## Overview
Browse and search Q's memory files with a nice UI.

## Features

### 1. Memory File Browser
- Tree view of memory/ folder
- MEMORY.md as primary
- Daily files (YYYY-MM-DD.md)

### 2. File Viewer
- Markdown rendering
- Syntax highlighting for code
- Search within file

### 3. Memory Search
- Full-text search across all memory
- Highlight matches
- Jump to result

### 4. Memory Stats
- Total files
- Total size
- Last updated
- Word count

### 5. Quick Edit (Future)
- Edit memory from UI
- Save back to file

## Technical

- Location: `src/app/memory/page.tsx`
- Components: `MemoryTree.tsx`, `MemoryViewer.tsx`, `MemorySearch.tsx`
- Use react-markdown for rendering
- API route to read files (or mock for now)

## File Structure

```
memory/
├── MEMORY.md (main long-term)
├── 2026-02-07.md
├── 2026-02-06.md
├── 2026-02-05.md
└── ...
```

## Acceptance Criteria
- [ ] File tree displays
- [ ] Can select and view files
- [ ] Markdown renders correctly
- [ ] Search works
- [ ] Build passes: `npm run build`
