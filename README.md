# Luma

**A premium productivity workspace for calm, clear thinking.**

Luma combines notes, tasks, and projects into a single beautiful dark-mode interface — inspired by the best of Notion, Todoist, and Linear.

> No sign-ups. No subscriptions. Just open and start working.

---

## ✨ Features

### 📝 Notes
- **Rich text editor** powered by TipTap (ProseMirror) — headings, bold, italic, lists, checklists, code blocks, links, highlights
- **Slash commands** (`/`) for quick formatting
- **Bubble menu** for inline formatting on selection
- **Auto-save** with debounce (500ms)
- **Word & character count** in editor footer
- **Pin** important notes to the top
- **Search, sort, & filter** — by last edited, created, or alphabetical
- **Grid / List view** toggle
- **Export** individual notes as Markdown

### ✅ Tasks
- **Multiple task lists** — Tasks, Work, Personal (+ create your own)
- **Smart views** — My Day, All Tasks, By Priority, By Date
- **4 sort modes** — Priority, Due date, Alphabetical, Created
- **Subtasks** — add, check off, and remove within any task
- **Custom DatePicker** — quick options (Today, Tomorrow, Next Week) + full calendar grid
- **Priority levels** — Urgent, High, Medium, Low, None (color-coded)
- **Recurring tasks** — Daily, Weekly, Monthly with auto-creation on completion
- **My Day** — focus flag to plan what you'll work on today
- **Drag-and-drop reordering** via @dnd-kit
- **Move tasks between lists** from the action menu
- **Show/hide completed** toggle

### 📁 Projects
- Group notes and tasks under projects
- Custom emoji + color per project
- Project detail page with notes grid + task list

### 🔍 Search & Navigation
- **Global search** across notes, tasks, and projects with highlighted matches
- **Command palette** (`Ctrl+K` / `⌘K`) for quick navigation
- **Collapsible sidebar** with lists, projects, and quick links

### 💾 Data & Export
- **Instant access** — no accounts, no sign-ups, no waiting
- **Local storage** — your data is saved in your browser automatically
- **Full JSON backup** — export/import everything
- **Notes as Markdown** — bulk export all notes
- **Tasks as CSV** — open in Excel, Google Sheets, etc.
- **Storage meter** — see how much space you're using

### 🎨 Design
- **Premium dark theme** with custom design tokens
- **Frosted glass** sticky top bar with backdrop blur
- **Smooth animations** via Motion (Framer Motion)
- **Custom scrollbars**, focus rings, and selection colors
- **Inter font** from Google Fonts
- **Responsive** — works on desktop and tablet

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + Vite 8 |
| **State** | Zustand 5 with `persist` middleware |
| **Editor** | TipTap 3 (ProseMirror) |
| **Routing** | React Router 7 |
| **Animations** | Motion 12 (Framer Motion) |
| **Icons** | Lucide React |
| **Drag & Drop** | @dnd-kit |
| **Dates** | date-fns 4 |
| **IDs** | nanoid |
| **Command Palette** | cmdk |
| **Hosting** | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **npm** 9+

### Install & Run Locally

```bash
# Clone
git clone <repo-url>
cd Luma

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

### Deploy to Vercel

The project includes a `vercel.json` with SPA routing, asset caching, and security headers pre-configured. Just push to GitHub and import in Vercel — zero config needed.

---

## 📂 Project Structure

```
src/
├── components/
│   ├── command/       # Command palette (Ctrl+K)
│   ├── common/        # Button, Modal, DatePicker, Toast, Dropdown, etc.
│   ├── home/          # Dashboard widgets
│   ├── layout/        # Sidebar, TopBar, PageContainer
│   ├── notes/         # NoteEditor, NoteCard, BubbleMenu, SlashCommands
│   ├── projects/      # ProjectCard, ProjectForm
│   └── tasks/         # TaskItem, TaskInput, TaskGroup (with DnD)
├── hooks/             # useAutoSave, useKeyboardShortcuts, useSearch
├── pages/             # HomePage, NotesPage, TasksPage, SettingsPage, etc.
├── stores/            # Zustand stores (tasks, notes, projects, lists, tags, ui)
├── styles/            # Design tokens, reset, animations, editor styles
└── utils/             # Constants, date helpers, ID generator, search
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `⌘K` | Open command palette |
| `Ctrl+N` / `⌘N` | New note |
| `/` (in editor) | Slash commands |
| `Double-click` task | Inline edit title |

---

## 📋 Data & Privacy

Luma stores data in your browser's `localStorage`. No accounts required — your workspace is ready the moment you open the app.

- ✅ No sign-ups, no passwords, no emails
- ✅ Data persists across browser sessions
- ✅ Export everything as JSON, Markdown, or CSV anytime
- ⚠️ Clearing browser data erases your workspace — keep backups!

---

## 📄 License

MIT — see [LICENSE](./LICENSE)

---

<p align="center">
  Built with React, Zustand, TipTap, and ♥
</p>
