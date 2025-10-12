/**
 * Chat functionality module with WebSocket support
 * Handles chat UI interactions, WebSocket connectivity, and real-time messaging
 */
class ChatUI {
    constructor() {
        this.lastMessageElement = null;
        this.currentAssistantMessage = '';
        this.ws = null;
        this.connectionState = 'disconnected';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        this.messagesContainer = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.querySelector('.send-button');
        this.connectionStatus = document.getElementById('connection-status');
        this.setupEventListeners();
        this.connectWebSocket();
    }
    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.handleSend());
        this.chatInput.addEventListener('keypress', (e) => {
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
    connectWebSocket() {
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
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleServerMessage(message);
                }
                catch (error) {
                    console.error('Error parsing server message:', error);
                }
            };
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionState('error');
            };
            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.updateConnectionState('disconnected');
                this.attemptReconnect();
            };
        }
        catch (error) {
            console.error('Error creating WebSocket:', error);
            this.updateConnectionState('error');
        }
    }
    attemptReconnect() {
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
    updateConnectionState(state) {
        this.connectionState = state;
        const statusText = this.connectionStatus.querySelector('.status-text');
        const statusDot = this.connectionStatus.querySelector('.status-dot');
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
    handleServerMessage(message) {
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
    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    handleSend() {
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
    addMessage(content, sender) {
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
    updateLastMessage(content, sender) {
        if (this.lastMessageElement &&
            this.lastMessageElement.classList.contains(`${sender}-message`)) {
            const contentDiv = this.lastMessageElement.querySelector('.message-content');
            if (contentDiv) {
                contentDiv.textContent = content;
                this.scrollToBottom();
            }
        }
        else {
            this.addMessage(content, sender);
        }
    }
    /**
     * Scroll chat to the bottom
     */
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    /**
     * Clean up resources
     */
    destroy() {
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
}
else {
    new ChatUI();
}
export { ChatUI };
