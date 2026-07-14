import { useState, useRef, useMemo } from 'react';
import PageContainer from '../components/layout/PageContainer';
import TopBar from '../components/layout/TopBar';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { toast } from '../components/common/Toast';
import { useUIStore } from '../stores/uiStore';
import { useNoteStore } from '../stores/noteStore';
import { useTaskStore } from '../stores/taskStore';
import { useProjectStore } from '../stores/projectStore';
import { useTagStore } from '../stores/tagStore';
import { useListStore } from '../stores/listStore';
import { Download, Upload, Trash2, FileText, Table, HardDrive, Shield } from 'lucide-react';
import './SettingsPage.css';

function estimateStorageSize() {
  let total = 0;
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('luma-')) {
      total += localStorage.getItem(key)?.length || 0;
    }
  }
  return (total * 2 / 1024 / 1024).toFixed(2); // UTF-16 chars = 2 bytes each
}

export default function SettingsPage() {
  const userName = useUIStore(s => s.userName);
  const setUserName = useUIStore(s => s.setUserName);
  const [clearConfirm, setClearConfirm] = useState(false);
  const fileRef = useRef(null);
  const storageMB = useMemo(() => estimateStorageSize(), []);

  // ── Export: Full JSON ──
  const handleExportJSON = () => {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      notes: useNoteStore.getState().notes,
      tasks: useTaskStore.getState().tasks,
      projects: useProjectStore.getState().projects,
      tags: useTagStore.getState().tags,
      lists: useListStore.getState().lists,
      ui: { userName: useUIStore.getState().userName },
    };
    downloadFile(
      JSON.stringify(data, null, 2),
      `luma-backup-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
    toast.success('Full backup exported');
  };

  // ── Export: Notes as Markdown ──
  const handleExportMarkdown = () => {
    const notes = useNoteStore.getState().notes.filter(n => !n.trashedAt);
    if (notes.length === 0) { toast.info('No notes to export'); return; }

    let md = '';
    notes.forEach(note => {
      md += `# ${note.title || 'Untitled'}\n\n`;
      md += `> Created: ${new Date(note.createdAt).toLocaleDateString()} | Updated: ${new Date(note.updatedAt).toLocaleDateString()}\n\n`;
      if (note.excerpt) md += `${note.excerpt}\n\n`;
      md += `---\n\n`;
    });

    downloadFile(md, `luma-notes-${new Date().toISOString().slice(0, 10)}.md`, 'text/markdown');
    toast.success(`${notes.length} notes exported as Markdown`);
  };

  // ── Export: Tasks as CSV ──
  const handleExportCSV = () => {
    const tasks = useTaskStore.getState().tasks.filter(t => !t.trashedAt);
    const lists = useListStore.getState().lists;
    if (tasks.length === 0) { toast.info('No tasks to export'); return; }

    const headers = ['Title', 'Status', 'Priority', 'Due Date', 'List', 'Subtasks', 'Recurring', 'Created'];
    const rows = tasks.map(t => [
      csvEscape(t.title || 'Untitled'),
      t.completed ? 'Done' : 'To Do',
      t.priority || 'none',
      t.dueDate || '',
      lists.find(l => l.id === t.listId)?.name || 'Tasks',
      (t.subtasks || []).map(st => `${st.completed ? '✓' : '○'} ${st.title}`).join('; '),
      t.recurring || '',
      new Date(t.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    downloadFile(csv, `luma-tasks-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    toast.success(`${tasks.length} tasks exported as CSV`);
  };

  // ── Import ──
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.notes) useNoteStore.setState({ notes: data.notes });
        if (data.tasks) useTaskStore.setState({ tasks: data.tasks });
        if (data.projects) useProjectStore.setState({ projects: data.projects });
        if (data.tags) useTagStore.setState({ tags: data.tags });
        if (data.lists) useListStore.setState({ lists: data.lists });
        if (data.ui?.userName) useUIStore.getState().setUserName(data.ui.userName);
        toast.success('Data imported successfully');
      } catch {
        toast.error('Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    useNoteStore.setState({ notes: [] });
    useTaskStore.setState({ tasks: [] });
    useProjectStore.setState({ projects: [] });
    useTagStore.setState({ tags: [] });
    useUIStore.setState({ userName: '' });
    toast.info('All data cleared');
  };

  return (
    <>
      <TopBar title="Settings" />
      <PageContainer>
        <div className="settings-page">
          {/* Data Safety */}
          <section className="settings-section">
            <h2 className="settings-section-title">
              <Shield size={16} /> Your Data
            </h2>
            <div className="settings-data-info">
              <p>Your notes, tasks, and projects are stored <strong>locally in your browser</strong> (localStorage). Nothing is sent to any server — your data stays on this device only.</p>
              <ul>
                <li>✓ Data persists across browser restarts</li>
                <li>✓ Export a backup regularly (JSON includes everything)</li>
                <li>⚠ Clearing browser data will erase Luma data — export first!</li>
              </ul>
              <div className="settings-storage-bar">
                <HardDrive size={14} />
                <span>Storage used: <strong>{storageMB} MB</strong> of ~5 MB</span>
              </div>
            </div>
          </section>

          {/* Profile */}
          <section className="settings-section">
            <h2 className="settings-section-title">Profile</h2>
            <div className="settings-field">
              <label className="settings-label">Your name</label>
              <p className="settings-hint">Used in the home screen greeting.</p>
              <input
                className="settings-input"
                placeholder="Enter your name"
                value={userName}
                onChange={e => setUserName(e.target.value)}
              />
            </div>
          </section>

          {/* Export / Import */}
          <section className="settings-section">
            <h2 className="settings-section-title">Export & Backup</h2>

            <div className="settings-export-grid">
              <div className="settings-export-card" onClick={handleExportJSON}>
                <Download size={20} />
                <div>
                  <span className="settings-export-title">Full Backup (JSON)</span>
                  <span className="settings-export-desc">All notes, tasks, projects, lists, and tags</span>
                </div>
              </div>

              <div className="settings-export-card" onClick={handleExportMarkdown}>
                <FileText size={20} />
                <div>
                  <span className="settings-export-title">Notes as Markdown</span>
                  <span className="settings-export-desc">Export all notes as a .md file</span>
                </div>
              </div>

              <div className="settings-export-card" onClick={handleExportCSV}>
                <Table size={20} />
                <div>
                  <span className="settings-export-title">Tasks as CSV</span>
                  <span className="settings-export-desc">Open in Excel, Google Sheets, etc.</span>
                </div>
              </div>
            </div>

            <div className="settings-field" style={{ marginTop: 'var(--luma-space-4)' }}>
              <label className="settings-label">Import data</label>
              <p className="settings-hint">Restore from a JSON backup file.</p>
              <input type="file" accept=".json" ref={fileRef} onChange={handleImport} style={{ display: 'none' }} />
              <Button variant="secondary" size="sm" icon={Upload} onClick={() => fileRef.current?.click()}>
                Import JSON
              </Button>
            </div>
          </section>

          {/* Danger zone */}
          <section className="settings-section settings-danger-zone">
            <h2 className="settings-section-title">Danger Zone</h2>
            <div className="settings-field">
              <label className="settings-label">Clear all data</label>
              <p className="settings-hint">Permanently delete everything. This cannot be undone.</p>
              <Button variant="danger" size="sm" icon={Trash2} onClick={() => setClearConfirm(true)}>
                Clear All Data
              </Button>
            </div>
          </section>

          {/* About */}
          <section className="settings-section">
            <h2 className="settings-section-title">About</h2>
            <p className="settings-about">
              <strong>Luma</strong> — A premium productivity app for calm, clear thinking.<br />
              Built with React, Zustand, TipTap, and ♥.
            </p>
          </section>
        </div>
      </PageContainer>

      <ConfirmDialog
        isOpen={clearConfirm}
        onClose={() => setClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Clear All Data"
        message="This will permanently delete all notes, tasks, projects, and tags. This action cannot be undone."
        confirmLabel="Clear Everything"
      />
    </>
  );
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(str) {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
