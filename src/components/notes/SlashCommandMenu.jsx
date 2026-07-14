import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Quote, Code, Minus
} from 'lucide-react';
import './SlashCommandMenu.css';

const COMMANDS = [
  { label: 'Heading 1', icon: Heading1, action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: 'Heading 2', icon: Heading2, action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: 'Heading 3', icon: Heading3, action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: 'Bullet List', icon: List, action: (editor) => editor.chain().focus().toggleBulletList().run() },
  { label: 'Numbered List', icon: ListOrdered, action: (editor) => editor.chain().focus().toggleOrderedList().run() },
  { label: 'Checklist', icon: CheckSquare, action: (editor) => editor.chain().focus().toggleTaskList().run() },
  { label: 'Blockquote', icon: Quote, action: (editor) => editor.chain().focus().toggleBlockquote().run() },
  { label: 'Code Block', icon: Code, action: (editor) => editor.chain().focus().toggleCodeBlock().run() },
  { label: 'Divider', icon: Minus, action: (editor) => editor.chain().focus().setHorizontalRule().run() },
];

export default function SlashCommandMenu({ editor }) {
  const [show, setShow] = useState(false);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const slashPosRef = useRef(null);

  const filteredCommands = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(filter.toLowerCase())
  );

  const executeCommand = useCallback((command) => {
    if (!editor) return;
    // Delete the slash + filter text
    const { state } = editor;
    const from = slashPosRef.current;
    const to = state.selection.from;
    editor.chain().focus().deleteRange({ from, to }).run();
    command.action(editor);
    setShow(false);
    setFilter('');
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event) => {
      if (!show) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelected(s => (s + 1) % filteredCommands.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelected(s => (s - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (filteredCommands[selected]) executeCommand(filteredCommands[selected]);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setShow(false);
        setFilter('');
      }
    };

    const handleUpdate = () => {
      const { state } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(
        Math.max(0, from - 20),
        from,
        '\n'
      );

      const slashMatch = textBefore.match(/\/([a-zA-Z]*)$/);

      if (slashMatch) {
        const slashStart = from - slashMatch[0].length;
        slashPosRef.current = slashStart;
        setFilter(slashMatch[1]);
        setSelected(0);

        const coords = editor.view.coordsAtPos(from);
        const editorEl = editor.view.dom.closest('.page-container') || editor.view.dom.parentElement;
        const editorRect = editorEl?.getBoundingClientRect() || { left: 0, top: 0 };

        setPos({
          top: coords.bottom - editorRect.top + 4,
          left: coords.left - editorRect.left,
        });
        setShow(true);
      } else {
        setShow(false);
        setFilter('');
      }
    };

    editor.on('update', handleUpdate);
    editor.view.dom.addEventListener('keydown', handleKeyDown);

    return () => {
      editor.off('update', handleUpdate);
      editor.view.dom.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, show, selected, filteredCommands, executeCommand]);

  if (!show || filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="slash-menu"
      style={{ position: 'absolute', top: pos.top, left: pos.left }}
    >
      {filteredCommands.map((cmd, i) => {
        const Icon = cmd.icon;
        return (
          <button
            key={cmd.label}
            className={`slash-menu-item ${i === selected ? 'selected' : ''}`}
            onMouseDown={(e) => { e.preventDefault(); executeCommand(cmd); }}
            onMouseEnter={() => setSelected(i)}
          >
            <Icon size={16} />
            <span>{cmd.label}</span>
          </button>
        );
      })}
    </div>
  );
}
