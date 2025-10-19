/**
 * Chat functionality module with WebSocket support
 * Handles chat UI interactions, WebSocket connectivity, and real-time messaging
 */

interface BrowserMessage {
  type: 'message' | 'ping';
  content?: string;
}

interface ServerMessage {
  type: 'text.delta' | 'text.done' | 'assistant.message' | 'response.done' | 'error' | 'pong';
  delta?: string;
  text?: string;
  error?: any;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

class ChatUI {
  private messagesContainer: HTMLElement;
  private chatInput: HTMLInputElement;
  private sendButton: HTMLButtonElement;
  private connectionStatus: HTMLElement;
  private lastMessageElement: HTMLElement | null = null;
  private currentAssistantMessage: string = '';
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number | null = null;

  constructor() {
    this.messagesContainer = document.getElementById('chat-messages')!;
    this.chatInput = document.getElementById('chat-input') as HTMLInputElement;
    this.sendButton = document.querySelector('.send-button')!;
    this.connectionStatus = document.getElementById('connection-status')!;

    this.setupEventListeners();
    this.connectWebSocket();
  }

  private setupEventListeners(): void {
    this.sendButton.addEventListener('click', () => this.handleSend());
    
    this.chatInput.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Reconnect button
    const reconnectBtn = document.getElementById('reconnect-btn');
    if (reconnectBtn) {
      reconnectBtn.addEventListener('click', () => this.connectWebSocket());
    }
  }

  private connectWebSocket(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.updateConnectionState('connecting');

    // Use wss:// for production, ws:// for local development
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/chat-stream`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.updateConnectionState('connected');
        this.reconnectAttempts = 0;
        
        // Send initial ping
        this.sendMessage({ type: 'ping' });
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          this.handleServerMessage(message);
        } catch (error) {
          console.error('Error parsing server message:', error);
        }
      };

      this.ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
        this.updateConnectionState('error');
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.updateConnectionState('disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.updateConnectionState('error');
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = window.setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }

  private updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    
    const statusText = this.connectionStatus.querySelector('.status-text')!;
    const statusDot = this.connectionStatus.querySelector('.status-dot')!;

    this.connectionStatus.className = 'connection-status';
    this.connectionStatus.classList.add(`status-${state}`);

    switch (state) {
      case 'connected':
        statusText.textContent = 'Connected';
        break;
      case 'connecting':
        statusText.textContent = 'Connecting...';
        break;
      case 'disconnected':
        statusText.textContent = 'Disconnected';
        break;
      case 'error':
        statusText.textContent = 'Connection Error';
        break;
    }

    // Enable/disable input based on connection state
    this.chatInput.disabled = state !== 'connected';
    this.sendButton.disabled = state !== 'connected';
  }

  private handleServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'pong':
        // Keepalive response
        break;

      case 'text.delta':
        // Incremental text update
        if (message.delta) {
          this.currentAssistantMessage += message.delta;
          this.updateLastMessage(this.currentAssistantMessage, 'assistant');
        }
        break;

      case 'text.done':
      case 'assistant.message':
        // Complete message
        console.log('ChatUI: assistant.message', message);
        if (message.text) {
          this.currentAssistantMessage = message.text;
          this.updateLastMessage(message.text, 'assistant');
        }
        break;

      case 'response.done':
        // Response completed, reset current message
        this.currentAssistantMessage = '';
        break;

      case 'error':
        console.error('Server error:', message.error);
        this.addMessage('Sorry, an error occurred. Please try again.', 'system');
        break;
    }
  }

  private sendMessage(message: BrowserMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleSend(): void {
    const message = this.chatInput.value.trim();
    if (message && this.connectionState === 'connected') {
      // Clear input
      this.chatInput.value = '';

      // Add message to UI
      this.addMessage(message, 'user');

      // Send to server
      this.sendMessage({
        type: 'message',
        content: message,
      });

      // Reset assistant message accumulator
      this.currentAssistantMessage = '';
    }
  }

  /**
   * Add a new message to the chat
   */
  private addMessage(content: string, sender: 'user' | 'assistant' | 'system'): void {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);
    this.messagesContainer.appendChild(messageDiv);

    // Track last message element
    this.lastMessageElement = messageDiv;

    this.scrollToBottom();
  }

  /**
   * Update the last message in the chat
   */
  private updateLastMessage(content: string, sender: 'user' | 'assistant' | 'system'): void {
    if (
      this.lastMessageElement &&
      this.lastMessageElement.classList.contains(`${sender}-message`)
    ) {
      const contentDiv = this.lastMessageElement.querySelector('.message-content');
      if (contentDiv) {
        contentDiv.textContent = content;
        this.scrollToBottom();
      }
    } else {
      this.addMessage(content, sender);
    }
  }

  /**
   * Scroll chat to the bottom
   */
  private scrollToBottom(): void {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Initialize chat when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ChatUI();
  });
} else {
  new ChatUI();
}

export { ChatUI };

