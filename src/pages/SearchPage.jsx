import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import TopBar from '../components/layout/TopBar';
import { useSearch } from '../hooks/useSearch';
import { highlightMatch } from '../utils/search';
import { Search as SearchIcon, FileText, CheckSquare, FolderOpen, SearchX } from 'lucide-react';
import './SearchPage.css';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { results, totalResults } = useSearch(query);
  const navigate = useNavigate();

  return (
    <>
      <TopBar title="Search" />
      <PageContainer>
        <div className="search-page">
          <div className="search-input-wrapper">
            <SearchIcon size={18} className="search-input-icon" />
            <input
              className="search-input"
              placeholder="Search notes, tasks, and projects..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {query.trim().length >= 2 && totalResults === 0 && (
            <div className="search-empty">
              <SearchX size={40} strokeWidth={1.2} />
              <h3>No results</h3>
              <p>Nothing matched "{query}". Try a different search.</p>
            </div>
          )}

          {results.notes.length > 0 && (
            <section className="search-group">
              <h2 className="search-group-title">Notes</h2>
              {results.notes.map(note => (
                <button key={note.id} className="search-result" onClick={() => navigate(`/notes/${note.id}`)}>
                  <FileText size={16} />
                  <div className="search-result-content">
                    <span className="search-result-title">
                      {highlightMatch(note.title || 'Untitled', query).map((seg, i) =>
                        seg.highlight ? <mark key={i}>{seg.text}</mark> : <span key={i}>{seg.text}</span>
                      )}
                    </span>
                    {note.excerpt && <span className="search-result-excerpt">{note.excerpt.slice(0, 80)}</span>}
                  </div>
                </button>
              ))}
            </section>
          )}

          {results.tasks.length > 0 && (
            <section className="search-group">
              <h2 className="search-group-title">Tasks</h2>
              {results.tasks.map(task => (
                <button key={task.id} className="search-result" onClick={() => navigate('/tasks')}>
                  <CheckSquare size={16} />
                  <span className="search-result-title">
                    {highlightMatch(task.title, query).map((seg, i) =>
                      seg.highlight ? <mark key={i}>{seg.text}</mark> : <span key={i}>{seg.text}</span>
                    )}
                  </span>
                </button>
              ))}
            </section>
          )}

          {results.projects.length > 0 && (
            <section className="search-group">
              <h2 className="search-group-title">Projects</h2>
              {results.projects.map(p => (
                <button key={p.id} className="search-result" onClick={() => navigate(`/projects/${p.id}`)}>
                  <FolderOpen size={16} />
                  <span className="search-result-title">
                    {highlightMatch(p.name, query).map((seg, i) =>
                      seg.highlight ? <mark key={i}>{seg.text}</mark> : <span key={i}>{seg.text}</span>
                    )}
                  </span>
                </button>
              ))}
            </section>
          )}
        </div>
      </PageContainer>
    </>
  );
}
