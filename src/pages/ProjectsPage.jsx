import { useMemo, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import TopBar from '../components/layout/TopBar';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectForm from '../components/projects/ProjectForm';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import { useProjectStore } from '../stores/projectStore';
import { FolderOpen, Plus } from 'lucide-react';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const [showForm, setShowForm] = useState(false);
  const allProjects = useProjectStore(s => s.projects);
  const projects = useMemo(() => allProjects.filter(p => !p.trashedAt), [allProjects]);

  return (
    <>
      <TopBar title="Projects">
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowForm(true)}>
          New Project
        </Button>
      </TopBar>
      <PageContainer>
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            heading="Organize your work"
            body="Group notes and tasks into projects for clarity."
            action="Create project"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="projects-grid">
            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </PageContainer>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Project">
        <ProjectForm onClose={() => setShowForm(false)} />
      </Modal>
    </>
  );
}
