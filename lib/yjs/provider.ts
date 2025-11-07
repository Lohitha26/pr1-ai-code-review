/**
 * Yjs Provider for Socket.io
 * 
 * This file creates a custom Yjs provider that uses Socket.io for real-time synchronization.
 * It handles:
 * - Sending local Yjs updates to the server via Socket.io
 * - Receiving remote updates from other clients
 * - Managing awareness (cursor positions, user info)
 */

'use client';

import * as Y from 'yjs';
import { TypedSocket } from '../socket';
import * as awarenessProtocol from 'y-protocols/awareness';

export class SocketIOProvider {
  public doc: Y.Doc;
  public awareness: awarenessProtocol.Awareness;
  private socket: TypedSocket;
  private sessionId: string;

  constructor(sessionId: string, doc: Y.Doc, socket: TypedSocket) {
    this.sessionId = sessionId;
    this.doc = doc;
    this.socket = socket;
    
    // Create awareness instance for tracking user cursors/selections
    this.awareness = new awarenessProtocol.Awareness(doc);

    // Set up event listeners
    this.setupDocumentListeners();
    this.setupSocketListeners();
    this.setupAwarenessListeners();

    // Request initial sync from server
    this.requestSync();
  }

  /**
   * Set up listeners for local document changes
   * When the local document changes, broadcast to other clients
   */
  private setupDocumentListeners() {
    // Listen for updates to the Yjs document
    this.doc.on('update', (update: Uint8Array, origin: unknown) => {
      // Don't broadcast updates that came from the network (origin === this)
      // Only broadcast updates that originated locally
      if (origin !== this) {
        this.socket.emit('yjs-update', this.sessionId, update);
      }
    });
  }

  /**
   * Set up listeners for remote updates from Socket.io
   * When we receive updates from other clients, apply them locally
   */
  private setupSocketListeners() {
    // Receive Yjs updates from other clients
    this.socket.on('yjs-update', (update: Uint8Array) => {
      // Skip empty or invalid updates
      if (!update || update.length === 0) {
        console.warn('SocketIOProvider: Received empty update, skipping');
        return;
      }
      
      // Additional validation: ensure update is a valid Uint8Array
      if (!(update instanceof Uint8Array)) {
        console.warn('SocketIOProvider: Update is not a Uint8Array, attempting conversion');
        try {
          update = new Uint8Array(update);
        } catch (conversionError) {
          console.error('SocketIOProvider: Failed to convert update to Uint8Array:', conversionError);
          return;
        }
      }
      
      // Check if the update has valid content (not just zeros)
      const hasContent = Array.from(update).some(byte => byte !== 0);
      if (!hasContent) {
        console.warn('SocketIOProvider: Update contains only zeros, skipping');
        return;
      }
      
      try {
        // Apply the update to our local document
        // Pass 'this' as origin to prevent re-broadcasting
        Y.applyUpdate(this.doc, update, this);
      } catch (error) {
        console.error('SocketIOProvider: Error applying update:', error);
        // Request a fresh sync if we encounter an error
        console.log('SocketIOProvider: Requesting fresh sync after error');
        this.requestSync();
      }
    });

    // Receive awareness updates (cursor positions, etc.)
    this.socket.on('yjs-awareness', (update: Uint8Array) => {
      // Validate awareness update
      if (!update || update.length === 0) {
        console.warn('SocketIOProvider: Received empty awareness update, skipping');
        return;
      }
      
      // Ensure it's a proper Uint8Array
      if (!(update instanceof Uint8Array)) {
        console.warn('SocketIOProvider: Awareness update is not a Uint8Array, attempting conversion');
        try {
          update = new Uint8Array(update);
        } catch (conversionError) {
          console.error('SocketIOProvider: Failed to convert awareness update:', conversionError);
          return;
        }
      }
      
      // Check if the update has valid content
      const hasContent = Array.from(update).some(byte => byte !== 0);
      if (!hasContent) {
        console.warn('SocketIOProvider: Awareness update contains only zeros, skipping');
        return;
      }
      
      // Additional check: awareness updates should have at least 2 bytes (varint encoding)
      if (update.length < 2) {
        console.warn('SocketIOProvider: Awareness update too short, skipping');
        return;
      }
      
      try {
        awarenessProtocol.applyAwarenessUpdate(this.awareness, update, this);
      } catch (error) {
        console.error('SocketIOProvider: Error applying awareness update:', error);
        console.log('SocketIOProvider: Invalid update data:', Array.from(update).slice(0, 20));
      }
    });

    // Handle connection events
    this.socket.on('connect', () => {
      console.log('SocketIOProvider: Connected, requesting sync');
      this.requestSync();
    });

    this.socket.on('disconnect', () => {
      console.log('SocketIOProvider: Disconnected');
    });
  }

  /**
   * Set up listeners for local awareness changes
   * When local user moves cursor, broadcast to other clients
   */
  private setupAwarenessListeners() {
    // Listen for changes to local awareness state
    this.awareness.on('update', ({ added, updated, removed }: {
      added: number[];
      updated: number[];
      removed: number[];
    }) => {
      // Create an awareness update message
      const changedClients = added.concat(updated).concat(removed);
      
      // Don't send empty updates
      if (changedClients.length === 0) {
        return;
      }
      
      const update = awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        changedClients
      );
      
      // Validate the encoded update before sending
      if (!update || update.length === 0) {
        console.warn('SocketIOProvider: Encoded awareness update is empty, skipping');
        return;
      }
      
      // Broadcast to other clients
      this.socket.emit('yjs-awareness', this.sessionId, update);
    });
  }

  /**
   * Request full document sync from server
   * Called on initial connection and reconnection
   */
  private requestSync() {
    this.socket.emit('request-sync', this.sessionId);
  }

  /**
   * Set local user's awareness state (name, color, cursor position)
   */
  public setAwarenessField(field: string, value: unknown) {
    const currentState = this.awareness.getLocalState() || {};
    this.awareness.setLocalState({
      ...currentState,
      [field]: value,
    });
  }

  /**
   * Get all users' awareness states
   */
  public getAwarenessStates(): Map<number, Record<string, unknown>> {
    return this.awareness.getStates();
  }

  /**
   * Cleanup and disconnect
   */
  public destroy() {
    this.awareness.destroy();
    this.doc.off('update', () => {});
    this.socket.off('yjs-update');
    this.socket.off('yjs-awareness');
  }
}
