'use client'

import { Button } from '@/components/ui/button';
import { CodeIcon, CodeSandboxLogoIcon, FontItalicIcon, ListBulletIcon, QuoteIcon, StrikethroughIcon } from '@radix-ui/react-icons';
import { type Editor, useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'
import { BoldIcon, Code2, Code2Icon, Heading1, Heading2, Heading3, ListOrdered } from 'lucide-react';

export  function Menubar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }
  
  return (
    <div className='flex flex-wrap gap-2 text-sm text-[#298126]'>
    <Button type="button"
    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
    variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'secondary'}
    ><Heading1 className='h-4 w-4'/></Button>
    
    <Button type="button"
    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
    variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'secondary'}
    ><Heading2 className='h-4 w-4 text-[#298126'/></Button>
    
    <Button type="button"
    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
    variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'secondary'}
    ><Heading3 className='w-4 h-4'/></Button>
    
    <Button type="button" className='font-bold'
    onClick={() => editor.chain().focus().toggleBold().run()}
    variant={editor.isActive('bold') ? 'default' : 'secondary'}
    ><BoldIcon className='w-4 h-3'/></Button>
    
    <Button type="button" className='italic'
    onClick={() => editor.chain().focus().toggleItalic().run()}
    variant={editor.isActive('italic') ? 'default' : 'secondary'}
    ><FontItalicIcon /></Button>
    
    <Button type="button" className='strike'
    onClick={() => editor.chain().focus().toggleStrike().run()}
    variant={editor.isActive('strike') ? 'default' : 'secondary'}
    ><StrikethroughIcon /></Button>
    
    <Button type="button" className='strike'
    onClick={() => editor.chain().focus().toggleBlockquote().run()}
    variant={editor.isActive('blockquote') ? 'default' : 'secondary'}
    ><QuoteIcon />   </Button>
    
    <Button type="button" className='strike'
    onClick={() => editor.chain().focus().toggleBulletList().run()}
    variant={editor.isActive('bulletlist') ? 'default' : 'secondary'}
    ><ListBulletIcon /></Button>
    
    <Button type="button" className='strike'
    onClick={() => editor.chain().focus().toggleCode().run()}
    variant={editor.isActive('code') ? 'default' : 'secondary'}
    ><CodeIcon /></Button>
    
    <Button type="button" className='strike'
    onClick={() => editor.chain().focus().toggleOrderedList().run()}
    variant={editor.isActive('orderedlist') ? 'default' : 'secondary'}
    ><ListOrdered className='h-4 w-4 font-thin'/></Button>
    
    
    
    
    </div>
    )
  }
  import React, { useState } from 'react'
  
  export function TipTapEditor({ setJson, json }: {
    setJson: any, json: JSONContent | null
  }) {
    const editor = useEditor({
      extensions: [
        StarterKit,
      ],
      content: json ?? '<p Share Your Help Request</p>',
      editorProps: {
        attributes: {
          class: 'prose',
        }
      },
      onUpdate: ({ editor }) => {
        const json = editor.getJSON();
        setJson(json);
        
      }
    })
    
    
    return (
      <div>
      <Menubar editor={editor} />
      <EditorContent editor={editor} className='min-h-[10vh] border border-primary my-2 px-3 py-2 rounded-lg'/>
      </div>
      
      )
    }
    