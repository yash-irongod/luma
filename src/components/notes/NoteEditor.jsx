import { useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import EditorBubbleMenu from './EditorBubbleMenu';
import SlashCommandMenu from './SlashCommandMenu';
import { useAutoSave } from '../../hooks/useAutoSave';
import { toast } from '../common/Toast';
import { Download } from 'lucide-react';
import { formatRelativeDate } from '../../utils/dates';
import './NoteEditor.css';

export default function NoteEditor({ note, onUpdate }) {
  const { triggerSave, saveStatus } = useAutoSave((data) => {
    onUpdate(note.id, data);
  }, 500);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Start writing, or press / for commands...',
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { class: 'luma-link' },
      }),
      Highlight.configure({ multicolor: false }),
    ],
    content: note.content,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      triggerSave({
        content: editor.getJSON(),
        excerpt: text.slice(0, 120),
      });
    },
    editorProps: {
      attributes: {
        class: 'luma-editor',
        spellcheck: 'true',
      },
    },
  }, [note.id]);

  const wordCount = useMemo(() => {
    if (!editor) return { words: 0, chars: 0 };
    const text = editor.getText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { words, chars: text.length };
  }, [editor?.getHTML()]);

  const handleExportMd = () => {
    if (!editor) return;
    const text = editor.getText();
    const title = note.title || 'Untitled';
    const md = `# ${title}\n\n${text}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Note exported as Markdown');
  };

  if (!editor) return null;

  return (
    <div className="note-editor-wrapper" style={{ position: 'relative' }}>
      <EditorBubbleMenu editor={editor} />
      <SlashCommandMenu editor={editor} />
      <EditorContent editor={editor} />
      <div className="note-editor-footer">
        <div className="note-editor-footer-left">
          <span className="note-editor-wordcount">
            {wordCount.words} words · {wordCount.chars} chars
          </span>
        </div>
        <div className="note-editor-footer-right">
          <button className="note-editor-export-btn" onClick={handleExportMd} title="Export as Markdown">
            <Download size={13} />
          </button>
          <span className="note-editor-status">
            {saveStatus === 'saving' ? 'Saving...' : formatRelativeDate(note.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
