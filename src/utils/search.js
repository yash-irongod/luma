export function searchItems(query, notes, tasks, projects) {
  const q = query.toLowerCase();
  return {
    notes: notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.excerpt.toLowerCase().includes(q)
    ),
    tasks: tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.notes.toLowerCase().includes(q)
    ),
    projects: projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    ),
  };
}

export function highlightMatch(text, query) {
  if (!query || !text) return [{ text, highlight: false }];
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.filter(Boolean).map(part => ({
    text: part,
    highlight: part.toLowerCase() === query.toLowerCase(),
  }));
}
