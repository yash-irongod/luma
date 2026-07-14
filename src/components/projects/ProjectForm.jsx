import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { PROJECT_COLORS, PROJECT_EMOJIS } from '../../utils/constants';
import Button from '../common/Button';
import './ProjectForm.css';

export default function ProjectForm({ project, onClose }) {
  const addProject = useProjectStore(s => s.addProject);
  const updateProject = useProjectStore(s => s.updateProject);
  const isEdit = Boolean(project);

  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [emoji, setEmoji] = useState(project?.emoji || '📁');
  const [color, setColor] = useState(project?.color || '#6C6BF0');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isEdit) {
      updateProject(project.id, { name: name.trim(), description: description.trim(), emoji, color });
    } else {
      addProject({ name: name.trim(), description: description.trim(), emoji, color });
    }
    onClose();
  };

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <div className="project-form-field">
        <label className="project-form-label">Name</label>
        <input
          className="project-form-input"
          placeholder="Project name"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="project-form-field">
        <label className="project-form-label">Description</label>
        <input
          className="project-form-input"
          placeholder="What's this project about?"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div className="project-form-field">
        <label className="project-form-label">Emoji</label>
        <div className="project-form-emojis">
          {PROJECT_EMOJIS.map(e => (
            <button
              key={e}
              type="button"
              className={`project-form-emoji ${emoji === e ? 'active' : ''}`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="project-form-field">
        <label className="project-form-label">Color</label>
        <div className="project-form-colors">
          {PROJECT_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`project-form-color ${color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      <div className="project-form-actions">
        <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
        <Button variant="primary" type="submit">{isEdit ? 'Save' : 'Create Project'}</Button>
      </div>
    </form>
  );
}
