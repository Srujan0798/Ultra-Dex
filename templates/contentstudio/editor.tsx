/**
 * @fileoverview Editor module
 * @module contentstudio/editor
 */

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

type RichEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
};

export function RichEditor({ value = '', onChange, readOnly = false }: RichEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !readOnly,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="editor editor--loading">Loading editor...</div>;
  }

  return (
    <div className="editor">
      <EditorContent editor={editor} />
    </div>
  );
}

/**
 * Error handler for editor
 * @param {Error} error - Error to handle
 */
function handleEditorError(error) {
  try {
    console.error('[editor]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
