import { useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import TopBar from '../components/layout/TopBar';
import Button from '../components/common/Button';
import TagPill from '../components/common/TagPill';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import { useTagStore } from '../stores/tagStore';
import { PROJECT_COLORS } from '../utils/constants';
import { Tag, Plus } from 'lucide-react';
import './TagsPage.css';

export default function TagsPage() {
  const tags = useTagStore(s => s.tags);
  const addTag = useTagStore(s => s.addTag);
  const deleteTag = useTagStore(s => s.deleteTag);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6C6BF0');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addTag({ name: newName.trim(), color: newColor });
    setNewName('');
    setNewColor('#6C6BF0');
    setShowForm(false);
  };

  return (
    <>
      <TopBar title="Tags">
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowForm(true)}>
          New Tag
        </Button>
      </TopBar>
      <PageContainer>
        {tags.length === 0 ? (
          <EmptyState
            icon={Tag}
            heading="No tags yet"
            body="Tags help you categorize notes and tasks across projects."
            action="Create a tag"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="tags-page">
            <div className="tags-list">
              {tags.map(tag => (
                <div key={tag.id} className="tag-row">
                  <TagPill name={tag.name} color={tag.color} />
                  <button className="tag-delete" onClick={() => deleteTag(tag.id)} aria-label={`Delete tag ${tag.name}`}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageContainer>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Tag" size="sm">
        <form className="tag-form" onSubmit={handleCreate}>
          <div className="project-form-field">
            <label className="project-form-label">Name</label>
            <input
              className="project-form-input"
              placeholder="Tag name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="project-form-field">
            <label className="project-form-label">Color</label>
            <div className="project-form-colors">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`project-form-color ${newColor === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setNewColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="project-form-actions">
            <Button variant="ghost" onClick={() => setShowForm(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit">Create Tag</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
