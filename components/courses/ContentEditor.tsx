'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Bold, Italic, Link as LinkIcon, Image as ImageIcon, List, ListOrdered, Quote, Heading1, Heading2, Undo, Redo } from 'lucide-react'

interface ContentEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function ContentEditor({ content, onChange, placeholder = 'Escribe el contenido aquí...' }: ContentEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4',
      },
    },
  })

  if (!editor) return null

  const addImage = () => {
    const url = prompt('URL de la imagen:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = prompt('URL del enlace:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-border bg-muted/30">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('bold') ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('italic') ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-6 bg-border mx-0.5" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-6 bg-border mx-0.5" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('bulletList') ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('orderedList') ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('blockquote') ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-6 bg-border mx-0.5" />
        <button
          onClick={addLink}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('link') ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={addImage}
          className="p-1.5 rounded-md text-mutedForeground hover:bg-muted transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-6 bg-border mx-0.5" />
        <button
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 rounded-md text-mutedForeground hover:bg-muted transition-colors"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1.5 rounded-md text-mutedForeground hover:bg-muted transition-colors"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
      
      {!content && (
        <div className="text-xs text-mutedForeground/50 px-4 pb-3 -mt-2">
          {placeholder}
        </div>
      )}
    </div>
  )
}
