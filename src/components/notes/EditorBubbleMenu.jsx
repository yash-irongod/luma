import { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Strikethrough, Code, Highlighter, Link } from 'lucide-react';
import './EditorBubbleMenu.css';

export default function EditorBubbleMenu({ editor }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      const { from, to, empty } = editor.state.selection;
      if (empty) {
        setShow(false);
        return;
      }

      const { view } = editor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      const editorEl = view.dom.closest('.page-container') || view.dom.parentElement;
      const editorRect = editorEl?.getBoundingClientRect() || { left: 0, top: 0 };

      setPos({
        top: start.top - editorRect.top - 48,
        left: (start.left + end.left) / 2 - editorRect.left,
      });
      setShow(true);
    };

    editor.on('selectionUpdate', updateMenu);
    editor.on('blur', () => setShow(false));

    return () => {
      editor.off('selectionUpdate', updateMenu);
    };
  }, [editor]);

  if (!editor || !show) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const buttons = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), label: 'Bold' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), label: 'Italic' },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), label: 'Strikethrough' },
    { icon: Code, action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive('code'), label: 'Code' },
    { icon: Highlighter, action: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive('highlight'), label: 'Highlight' },
    { icon: Link, action: setLink, active: editor.isActive('link'), label: 'Link' },
  ];

  return (
    <div
      ref={menuRef}
      className="bubble-menu"
      style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
    >
      {buttons.map(({ icon: Icon, action, active, label }) => (
        <button
          key={label}
          className={`bubble-menu-btn ${active ? 'active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); action(); }}
          aria-label={label}
          title={label}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
