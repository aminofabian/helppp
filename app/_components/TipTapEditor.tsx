'use client'

import { Button } from '@/components/ui/button';
import { type Editor, useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'

export  function Menubar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }
  return (
    <div className='flex flex-wrap gap-3 text-sm'>
    <Button type="button"
    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
    variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'secondary'}
    >H1</Button>
    
    <Button type="button"
    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
    variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'secondary'}
    >H2</Button>
    
    <Button type="button"
    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
    variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'secondary'}
    >H3</Button>
    
    <Button type="button" className='font-bold'
    onClick={() => editor.chain().focus().toggleBold().run()}
    variant={editor.isActive('bold') ? 'default' : 'secondary'}
    >Bold</Button>
    
    <Button type="button" className='italic'
    onClick={() => editor.chain().focus().toggleItalic().run()}
    variant={editor.isActive('italic') ? 'default' : 'secondary'}
    >Italic</Button>
    
    <Button type="button" className='strike'
    onClick={() => editor.chain().focus().toggleStrike().run()}
    variant={editor.isActive('strike') ? 'default' : 'secondary'}
    >Strike</Button>
    
    <Button type="button" className='strike'
    onClick={() => editor.chain().focus().toggleBlockquote().run()}
    variant={editor.isActive('blockquote') ? 'default' : 'secondary'}
    >Blockquote</Button>
    
    <Button type="button" className='strike'
    onClick={() => editor.chain().focus().toggleBulletList().run()}
    variant={editor.isActive('bulletlist') ? 'default' : 'secondary'}
    >Bulletlist</Button>
    
    <Button type="button" className='strike'
    onClick={() => editor.chain().focus().toggleCode().run()}
    variant={editor.isActive('code') ? 'default' : 'secondary'}
    >Code</Button>
    
    <Button type="button" className='strike'
    onClick={() => editor.chain().focus().toggleOrderedList().run()}
    variant={editor.isActive('code') ? 'default' : 'secondary'}
    >Ordered List</Button>
    
    
    
    
    </div>
    )
  }
  import React from 'react'
  
  export  function TipTapEditor() {
    const editor = useEditor({
      extensions: [
        StarterKit,
      ],
      content: '<p>Hello World! 🌎️</p>',
      editorProps: {
        attributes: {
          class: 'prose',
        }
      },
    })
    
    return (
      <div>
      <Menubar editor={editor} />
      <EditorContent editor={editor} className='min-h-[10vh] border border-primary my-2 px-3 py-2 rounded-lg'/>
      </div>
      
      )
    }
    