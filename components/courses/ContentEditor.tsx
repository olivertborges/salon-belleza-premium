'use client'

import { useEffect } from 'react'
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
      StarterKit.configure({
        heading: {
          levels: [2, 3]
        }
      }),
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-rose-500 underline cursor-pointer'
        }
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4 text-foreground bg-background',
      },
    },
  })

  // Sincronización reactiva bidireccional estable (Evita ciclos infinitos y pérdida de cursor)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content || '', false, { preserveState: true })
    }
  }, [content, editor])

  if (!editor) return null

  const addImage = (e: React.MouseEvent) => {
    e.preventDefault()
    const url = prompt('URL de la imagen:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = (e: React.MouseEvent) => {
    e.preventDefault()
    const url = prompt('URL del enlace:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm">
      {/* Toolbar con types explícitos para evitar sumbmit accidental */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-border bg-muted/30">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('bold') ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('italic') ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-6 bg-border mx-0.5" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-6 bg-border mx-0.5" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('bulletList') ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('orderedList') ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('blockquote') ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-6 bg-border mx-0.5" />
        <button
          type="button"
          onClick={addLink}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('link') ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:bg-muted'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={addImage}
          className="p-1.5 rounded-md text-mutedForeground hover:bg-muted transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-6 bg-border mx-0.5" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 rounded-md text-mutedForeground hover:bg-muted transition-colors disabled:opacity-40"
          disabled={!editor.can().undo()}
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1.5 rounded-md text-mutedForeground hover:bg-muted transition-colors disabled:opacity-40"
          disabled={!editor.can().redo()}
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Caja de Entrada del Canvas Tiptap */}
      <div className="relative">
        <EditorContent editor={editor} />
        
        {editor.isEmpty && (
          <div className="absolute top-4 left-4 text-xs text-mutedForeground/40 pointer-events-none font-sans">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}
