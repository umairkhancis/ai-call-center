// Simple client application demonstrating WebSocket communication

import { WebSocketManager } from '../communication/WebSocketManager';
import { createClientConfig } from '../../../shared/config';
import { Message, MessageType } from '../../../shared/types';

class SimpleClient {
  private communicationManager: WebSocketManager;
  private messageLog: HTMLElement | null = null;
  private connectionStatus: HTMLElement | null = null;
  private messageInput: HTMLInputElement | null = null;
  private sendButton: HTMLButtonElement | null = null;
  private connectButton: HTMLButtonElement | null = null;
  private disconnectButton: HTMLButtonElement | null = null;

  constructor() {
    console.info('[CLIENT] Initializing Simple Client Application');

    const config = createClientConfig();
    this.communicationManager = new WebSocketManager(config);

    this.setupUI();
    this.setupEventHandlers();

    console.info('[CLIENT] Simple Client initialized successfully', {
      config,
      clientId: this.communicationManager.getClientId()
    });
  }

  private setupUI(): void {
    console.debug('[CLIENT] Setting up UI elements');
    console.debug('[CLIENT] Document readyState:', document.readyState);
    console.debug('[CLIENT] Document body:', !!document.body);

    // Get DOM elements
    this.messageLog = document.getElementById('messageLog');
    this.connectionStatus = document.getElementById('connectionStatus');
    this.messageInput = document.getElementById('messageInput') as HTMLInputElement;
    this.sendButton = document.getElementById('sendButton') as HTMLButtonElement;
    this.connectButton = document.getElementById('connectButton') as HTMLButtonElement;
    this.disconnectButton = document.getElementById('disconnectButton') as HTMLButtonElement;

    // Verify all elements exist
    const elements = {
      messageLog: this.messageLog,
      connectionStatus: this.connectionStatus,
      messageInput: this.messageInput,
      sendButton: this.sendButton,
      connectButton: this.connectButton,
      disconnectButton: this.disconnectButton
    };

    console.debug('[CLIENT] UI elements found:', elements);

    // More detailed element checking
    Object.entries(elements).forEach(([name, element]) => {
      if (!element) {
        console.error(`[CLIENT] Missing UI element: ${name}`);
        console.error(`[CLIENT] Available elements with IDs:`,
          Array.from(document.querySelectorAll('[id]')).map(el => ({
            id: el.id,
            tagName: el.tagName,
            type: (el as any).type
          }))
        );
      } else {
        console.debug(`[CLIENT] Found ${name}:`, {
          id: element.id,
          tagName: element.tagName,
          type: (element as any).type,
          disabled: (element as any).disabled
        });
      }
    });

    // Set initial UI state
    this.updateConnectionStatus(false);
    this.updateButtonStates(false);
  }

  private setupEventHandlers(): void {
    console.debug('[CLIENT] Setting up event handlers');

    // Communication manager events
    this.communicationManager.onConnectionChange((connected: boolean) => {
      console.info('[CLIENT] Connection state changed', { connected });
      this.updateConnectionStatus(connected);
      this.updateButtonStates(connected);
    });

    this.communicationManager.onMessage((message: Message) => {
      console.info('[CLIENT] Received message', {
        messageId: message.id,
        type: message.type,
        sender: message.sender
      });
      this.displayMessage('RECEIVED', message);
    });

    // UI event handlers with enhanced debugging
    if (this.connectButton) {
      console.debug('[CLIENT] Adding click handler to connect button');
      this.connectButton.addEventListener('click', (event) => {
        console.info('[CLIENT] Connect button clicked!', {
          target: event.target,
          currentTarget: event.currentTarget,
          disabled: this.connectButton?.disabled,
          buttonState: {
            id: this.connectButton?.id,
            className: this.connectButton?.className,
            textContent: this.connectButton?.textContent
          }
        });
        this.handleConnect();
      });
      console.debug('[CLIENT] Connect button handler added successfully');
    } else {
      console.error('[CLIENT] Connect button not found - cannot add event handler!');
    }

    if (this.disconnectButton) {
      console.debug('[CLIENT] Adding click handler to disconnect button');
      this.disconnectButton.addEventListener('click', (event) => {
        console.info('[CLIENT] Disconnect button clicked!', {
          target: event.target,
          disabled: this.disconnectButton?.disabled
        });
        this.handleDisconnect();
      });
    } else {
      console.error('[CLIENT] Disconnect button not found - cannot add event handler!');
    }

    if (this.sendButton) {
      console.debug('[CLIENT] Adding click handler to send button');
      this.sendButton.addEventListener('click', (event) => {
        console.info('[CLIENT] Send button clicked!', {
          target: event.target,
          disabled: this.sendButton?.disabled
        });
        this.handleSendMessage();
      });
    } else {
      console.error('[CLIENT] Send button not found - cannot add event handler!');
    }

    if (this.messageInput) {
      console.debug('[CLIENT] Adding keypress handler to message input');
      this.messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          console.info('[CLIENT] Enter key pressed in message input');
          this.handleSendMessage();
        }
      });
    } else {
      console.error('[CLIENT] Message input not found - cannot add event handler!');
    }

    console.info('[CLIENT] Event handlers set up successfully');
  }

  private async handleConnect(): Promise<void> {
    console.info('[CLIENT] ====== CONNECT HANDLER CALLED ======');
    console.info('[CLIENT] Connection manager state:', {
      isConnected: this.communicationManager.connected,
      connectionType: this.communicationManager.type,
      clientId: this.communicationManager.getClientId()
    });

    try {
      const serverUrl = 'ws://localhost:8080';
      console.info('[CLIENT] Attempting to connect to server', { serverUrl });

      // Add visual feedback immediately
      this.logMessage('INFO', 'Connecting to server...');
      this.updateConnectionStatus(false); // Show "connecting" state

      await this.communicationManager.connect(serverUrl);

      console.info('[CLIENT] Successfully connected to server', { serverUrl });
      this.logMessage('INFO', 'Connected to server successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      console.error('[CLIENT] Failed to connect to server', {
        error: errorMessage,
        stack: errorStack,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      });
      this.logMessage('ERROR', `Connection failed: ${errorMessage}`);
    }

    console.info('[CLIENT] ====== CONNECT HANDLER FINISHED ======');
  }

  private async handleDisconnect(): Promise<void> {
    console.info('[CLIENT] Disconnecting from server');

    try {
      await this.communicationManager.disconnect();

      console.info('[CLIENT] Successfully disconnected from server');
      this.logMessage('INFO', 'Disconnected from server');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CLIENT] Error during disconnect', { error: errorMessage });
      this.logMessage('ERROR', `Disconnect error: ${errorMessage}`);
    }
  }

  private async handleSendMessage(): Promise<void> {
    if (!this.messageInput || !this.messageInput.value.trim()) {
      console.warn('[CLIENT] Cannot send empty message');
      return;
    }

    const messageText = this.messageInput.value.trim();
    console.info('[CLIENT] Sending message', { messageText });

    try {
      const message = {
        type: MessageType.DATA,
        payload: {
          text: messageText,
          timestamp: Date.now()
        }
      };

      await this.communicationManager.sendMessage(message);

      console.info('[CLIENT] Message sent successfully');
      this.displayMessage('SENT', {
        id: 'temp-id',
        type: MessageType.DATA,
        timestamp: Date.now(),
        sender: this.communicationManager.getClientId(),
        recipient: 'server',
        payload: { text: messageText }
      } as Message);

      // Clear input
      this.messageInput.value = '';

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CLIENT] Failed to send message', { error: errorMessage });
      this.logMessage('ERROR', `Send failed: ${errorMessage}`);
    }
  }

  private updateConnectionStatus(connected: boolean): void {
    console.debug('[CLIENT] Updating connection status', { connected });

    if (this.connectionStatus) {
      this.connectionStatus.textContent = connected ? 'Connected' : 'Disconnected';
      this.connectionStatus.className = `status ${connected ? 'connected' : 'disconnected'}`;
    }

    // Log connection status change
    this.logMessage('INFO', `Status: ${connected ? 'Connected' : 'Disconnected'}`);
  }

  private updateButtonStates(connected: boolean): void {
    console.debug('[CLIENT] Updating button states', { connected });

    if (this.connectButton) {
      this.connectButton.disabled = connected;
    }

    if (this.disconnectButton) {
      this.disconnectButton.disabled = !connected;
    }

    if (this.sendButton) {
      this.sendButton.disabled = !connected;
    }

    if (this.messageInput) {
      this.messageInput.disabled = !connected;
    }
  }

  private displayMessage(direction: 'SENT' | 'RECEIVED', message: Message): void {
    console.debug('[CLIENT] Displaying message in UI', {
      direction,
      messageId: message.id,
      type: message.type
    });

    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    const messageText = message.payload.text || JSON.stringify(message.payload);

    this.logMessage(direction, `[${timestamp}] ${message.type}: ${messageText}`, {
      messageId: message.id,
      sender: message.sender
    });
  }

  private logMessage(level: 'INFO' | 'ERROR' | 'SENT' | 'RECEIVED', text: string, metadata?: any): void {
    console.debug('[CLIENT] Logging message to UI', { level, text, metadata });

    if (!this.messageLog) {
      console.warn('[CLIENT] Message log element not found');
      return;
    }

    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${level.toLowerCase()}`;

    const timestamp = new Date().toLocaleTimeString();
    logEntry.innerHTML = `
      <span class="timestamp">[${timestamp}]</span>
      <span class="level">${level}</span>
      <span class="message">${text}</span>
    `;

    this.messageLog.appendChild(logEntry);
    this.messageLog.scrollTop = this.messageLog.scrollHeight;

    // Keep only last 100 messages to prevent memory issues
    while (this.messageLog.children.length > 100) {
      this.messageLog.removeChild(this.messageLog.firstChild!);
    }
  }

  // Public methods for external control
  public getConnectionState(): string {
    return this.communicationManager.getConnectionState();
  }

  public getClientId(): string {
    return this.communicationManager.getClientId();
  }

  public getReconnectAttempts(): number {
    return this.communicationManager.getReconnectAttempts();
  }

  // Debug properties for troubleshooting
  public getConnectButton(): HTMLButtonElement | null {
    return this.connectButton;
  }

  public getDisconnectButton(): HTMLButtonElement | null {
    return this.disconnectButton;
  }

  // Debug method to manually test connection
  public async debugConnect(): Promise<void> {
    console.info('[CLIENT] Debug connect called manually');
    return this.handleConnect();
  }
}

// Initialize the client when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.info('[CLIENT] ====== DOM CONTENT LOADED ======');
  console.info('[CLIENT] Document ready state:', document.readyState);
  console.info('[CLIENT] Available elements:', document.querySelectorAll('*').length);

  // Add a small delay to ensure all elements are fully rendered
  setTimeout(() => {
    console.info('[CLIENT] Initializing application after timeout');

    try {
      const client = new SimpleClient();

      // Make client available globally for debugging
      (window as any).client = client;

      console.info('[CLIENT] Application initialized successfully', {
        clientId: client.getClientId(),
        hasConnectButton: !!client.getConnectButton(),
        connectButtonId: client.getConnectButton()?.id
      });

      // Add test button click handler for debugging
      setTimeout(() => {
        console.info('[CLIENT] Adding debug test to connect button');
        const testButton = document.getElementById('connectButton');
        if (testButton) {
          console.info('[CLIENT] Test button found:', {
            id: testButton.id,
            tagName: testButton.tagName,
            disabled: (testButton as HTMLButtonElement).disabled,
            style: testButton.getAttribute('style'),
            className: testButton.className
          });
        } else {
          console.error('[CLIENT] Test button NOT found during debug check');
        }
      }, 100);

    } catch (error) {
      console.error('[CLIENT] Failed to initialize application', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : 'No stack'
      });
    }
  }, 100);
});