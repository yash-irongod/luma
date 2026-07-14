import { useMemo } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { useTaskStore } from '../stores/taskStore';
import { useProjectStore } from '../stores/projectStore';
import { searchItems } from '../utils/search';

export function useSearch(query) {
  const allNotes = useNoteStore(s => s.notes);
  const allTasks = useTaskStore(s => s.tasks);
  const allProjects = useProjectStore(s => s.projects);

  const notes = useMemo(() => allNotes.filter(n => !n.trashedAt), [allNotes]);
  const tasks = useMemo(() => allTasks.filter(t => !t.trashedAt), [allTasks]);
  const projects = useMemo(() => allProjects.filter(p => !p.trashedAt), [allProjects]);

  const results = useMemo(() => {
    if (!query || query.trim().length < 2) return { notes: [], tasks: [], projects: [] };
    return searchItems(query.trim(), notes, tasks, projects);
  }, [query, notes, tasks, projects]);

  const totalResults = results.notes.length + results.tasks.length + results.projects.length;

  return { results, totalResults };
}
