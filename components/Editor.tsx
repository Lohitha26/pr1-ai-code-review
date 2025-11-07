/**
 * Monaco Editor Component with Yjs Integration
 * 
 * This component wraps the Monaco editor and integrates it with Yjs for real-time collaboration.
 * It handles:
 * - Loading and configuring Monaco editor
 * - Binding Monaco to Yjs document
 * - Displaying remote cursors and selections
 * - Syncing local changes to Yjs
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { SocketIOProvider } from '@/lib/yjs/provider';
import { TypedSocket } from '@/lib/socket';
import { monacoPositionToYjs, throttle } from '@/lib/yjs/awareness';
import type * as Monaco from 'monaco-editor';

interface CollaborativeEditorProps {
  sessionId: string;
  socket: TypedSocket;
  userId: string;
  userName: string;
  userColor: string;
  language?: string;
  onCodeChange?: (code: string) => void;
}

export default function CollaborativeEditor({
  sessionId,
  socket,
  userId,
  userName,
  userColor,
  language = 'javascript',
  onCodeChange,
}: CollaborativeEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<SocketIOProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  /**
   * Handle editor mount - called when Monaco editor is ready
   */
  const handleEditorDidMount: OnMount = (editor, _monaco) => {
    editorRef.current = editor;

    // Create Yjs text type for the editor content
    const yText = ydoc.getText('monaco');

    // Create Socket.io provider for Yjs synchronization
    const newProvider = new SocketIOProvider(sessionId, ydoc, socket);
    setProvider(newProvider);

    // Set initial awareness state (user info)
    newProvider.awareness.setLocalState({
      user: {
        id: userId,
        name: userName,
        color: userColor,
      },
    });

    // Create Monaco binding - connects Monaco editor to Yjs
    // This automatically syncs editor content with Yjs document
    const binding = new MonacoBinding(
      yText,
      editor.getModel()!,
      new Set([editor]),
      newProvider.awareness
    );
    bindingRef.current = binding;

    // Track cursor position changes and update awareness
    const updateCursorPosition = throttle(() => {
      const position = editor.getPosition();
      if (position && newProvider) {
        const yjsPosition = monacoPositionToYjs(position);
        newProvider.setAwarenessField('cursor', yjsPosition);
      }
    }, 100); // Update at most 10 times per second

    // Listen for cursor position changes
    editor.onDidChangeCursorPosition(updateCursorPosition);

    // Listen for selection changes
    editor.onDidChangeCursorSelection((e) => {
      if (newProvider) {
        const selection = {
          start: monacoPositionToYjs(e.selection.getStartPosition()),
          end: monacoPositionToYjs(e.selection.getEndPosition()),
        };
        newProvider.setAwarenessField('selection', selection);
      }
    });

    // Notify parent component of code changes
    if (onCodeChange) {
      editor.onDidChangeModelContent(() => {
        const code = editor.getValue();
        onCodeChange(code);
      });
    }

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
    });
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      if (provider) {
        provider.destroy();
      }
      ydoc.destroy();
    };
  }, [ydoc, provider]);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage={language}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          readOnly: false,
          domReadOnly: false,
        }}
      />
    </div>
  );
}
