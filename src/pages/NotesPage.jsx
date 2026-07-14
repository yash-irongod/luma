import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import TopBar from '../components/layout/TopBar';
import NoteCard from '../components/notes/NoteCard';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import { useNoteStore } from '../stores/noteStore';
import { FileText, Plus, Search, Grid3X3, List, ArrowUpDown } from 'lucide-react';
import './NotesPage.css';

const SORT_OPTIONS = [
  { id: 'updated', label: 'Last edited' },
  { id: 'created', label: 'Created' },
  { id: 'alpha', label: 'Alphabetical' },
];

export default function NotesPage() {
  const navigate = useNavigate();
  const allNotes = useNoteStore(s => s.notes);
  const addNote = useNoteStore(s => s.addNote);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [viewMode, setViewMode] = useState('grid');

  const activeNotes = useMemo(() => allNotes.filter(n => !n.trashedAt), [allNotes]);

  const filteredNotes = useMemo(() => {
    let notes = activeNotes;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      notes = notes.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.excerpt || '').toLowerCase().includes(q)
      );
    }
    return notes;
  }, [activeNotes, searchQuery]);

  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      switch (sortBy) {
        case 'created': return b.createdAt - a.createdAt;
        case 'alpha': return (a.title || '').localeCompare(b.title || '');
        case 'updated':
        default: return b.updatedAt - a.updatedAt;
      }
    });
  }, [filteredNotes, sortBy]);

  const pinnedNotes = useMemo(() => sortedNotes.filter(n => n.isPinned), [sortedNotes]);
  const otherNotes = useMemo(() => sortedNotes.filter(n => !n.isPinned), [sortedNotes]);

  const handleNewNote = () => {
    const note = addNote();
    navigate(`/notes/${note.id}`);
  };

  return (
    <>
      <TopBar title="Notes">
        <Button variant="primary" size="sm" icon={Plus} onClick={handleNewNote}>
          New Note
        </Button>
      </TopBar>
      <PageContainer>
        {activeNotes.length === 0 ? (
          <EmptyState
            icon={FileText}
            heading="Your ideas live here"
            body="Start writing — every great project begins with a note."
            action="New note"
            onAction={handleNewNote}
          />
        ) : (
          <div className="notes-page">
            {/* Toolbar */}
            <div className="notes-toolbar">
              <div className="notes-search">
                <Search size={14} className="notes-search-icon" />
                <input
                  className="notes-search-input"
                  placeholder="Filter notes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="notes-toolbar-right">
                <div className="notes-sort">
                  <ArrowUpDown size={13} />
                  <select
                    className="notes-sort-select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="notes-view-toggle">
                  <button
                    className={`notes-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <Grid3X3 size={14} />
                  </button>
                  <button
                    className={`notes-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {sortedNotes.length === 0 ? (
              <p className="notes-no-results">No notes match "{searchQuery}"</p>
            ) : (
              <>
                {pinnedNotes.length > 0 && (
                  <section>
                    <h2 className="notes-section-title">Pinned</h2>
                    <div className={viewMode === 'grid' ? 'notes-grid' : 'notes-list'}>
                      {pinnedNotes.map(note => <NoteCard key={note.id} note={note} compact={viewMode === 'list'} />)}
                    </div>
                  </section>
                )}
                <section>
                  {pinnedNotes.length > 0 && <h2 className="notes-section-title">All Notes</h2>}
                  <div className={viewMode === 'grid' ? 'notes-grid' : 'notes-list'}>
                    {otherNotes.map(note => <NoteCard key={note.id} note={note} compact={viewMode === 'list'} />)}
                  </div>
                </section>
              </>
            )}

            <p className="notes-count">{activeNotes.length} note{activeNotes.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </PageContainer>
    </>
  );
}
