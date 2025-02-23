'use client'

import { Button } from '@/components/ui/button';
import { CodeIcon, FontItalicIcon, ListBulletIcon, QuoteIcon, StrikethroughIcon } from '@radix-ui/react-icons';
import { type Editor, useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'
import HardBreak from '@tiptap/extension-hard-break'
import { BoldIcon, Heading1, Heading2, Heading3, ListOrdered, Code2 } from 'lucide-react';
import React, { useEffect } from 'react'

export function Menubar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }
  
  return (
    <div className='flex flex-wrap gap-2 p-2 bg-secondary/20 rounded-lg mb-2'>
      <div className='flex gap-1 border-r pr-2'>
        <Button 
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          className='h-8 w-8'
        >
          <Heading1 className='h-4 w-4'/>
        </Button>
        
        <Button 
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          className='h-8 w-8'
        >
          <Heading2 className='h-4 w-4'/>
        </Button>
        
        <Button 
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
          className='h-8 w-8'
        >
          <Heading3 className='h-4 w-4'/>
        </Button>
      </div>

      <div className='flex gap-1 border-r pr-2'>
        <Button 
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          className='h-8 w-8'
        >
          <BoldIcon className='h-4 w-4'/>
        </Button>
        
        <Button 
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          className='h-8 w-8'
        >
          <FontItalicIcon className='h-4 w-4'/>
        </Button>
        
        <Button 
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          className='h-8 w-8'
        >
          <StrikethroughIcon className='h-4 w-4'/>
        </Button>
      </div>

      <div className='flex gap-1 border-r pr-2'>
        <Button 
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          className='h-8 w-8'
        >
          <QuoteIcon className='h-4 w-4'/>
        </Button>
        
        <Button 
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          className='h-8 w-8'
        >
          <ListBulletIcon className='h-4 w-4'/>
        </Button>
        
        <Button 
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          className='h-8 w-8'
        >
          <ListOrdered className='h-4 w-4'/>
        </Button>
      </div>

      <div className='flex gap-1'>
        <Button 
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          variant={editor.isActive('code') ? 'default' : 'ghost'}
          className='h-8 w-8'
          title="Inline Code"
        >
          <CodeIcon className='h-4 w-4'/>
        </Button>
        
        <Button 
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
          className='h-8 w-8'
          title="Code Block"
        >
          <Code2 className='h-4 w-4'/>
        </Button>
      </div>
    </div>
  )
}

export function TipTapEditor({ setJson, json }: {
  setJson: (json: JSONContent) => void,
  json: JSONContent | null
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        code: {
          HTMLAttributes: {
            class: 'rounded-md bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'rounded-lg bg-muted p-4 font-mono',
          },
        },
        hardBreak: false,
      }),
      HardBreak.configure({
        keepMarks: true,
        HTMLAttributes: {
          class: 'my-2',
        },
      }),
    ],
    content: json ?? '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg prose-stone dark:prose-invert focus:outline-none max-w-none',
      }
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      setJson(json);
    }
  })

  // Update editor content when json prop changes
  useEffect(() => {
    if (editor && json) {
      if (typeof json === 'string') {
        editor.commands.setContent(json, false);
      } else {
        editor.commands.setContent(json);
      }
    }
  }, [editor, json]);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <Menubar editor={editor} />
      <EditorContent
        editor={editor}
        className='min-h-[200px] px-4 py-3'
      />
    </div>
  );
}
    