"use strict";
// Configuration management for simple setup
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.createClientConfig = createClientConfig;
exports.createServerConfig = createServerConfig;
exports.DEFAULT_CONFIG = {
    websocket: {
        serverUrl: 'ws://localhost:8080',
        port: 8080,
        reconnectInterval: 5000,
        maxReconnectAttempts: 3 // Keep simple
    },
    webrtc: {
        // Future - keep minimal for now
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }
};
function createClientConfig() {
    const config = {
        type: 'websocket',
        serverUrl: exports.DEFAULT_CONFIG.websocket.serverUrl,
        reconnectInterval: exports.DEFAULT_CONFIG.websocket.reconnectInterval,
        maxReconnectAttempts: exports.DEFAULT_CONFIG.websocket.maxReconnectAttempts
    };
    console.debug('[CONFIG] Created client config:', config);
    return config;
}
function createServerConfig() {
    const config = {
        protocol: 'websocket',
        port: exports.DEFAULT_CONFIG.websocket.port
    };
    console.debug('[CONFIG] Created server config:', config);
    return config;
}
//# sourceMappingURL=config.js.map