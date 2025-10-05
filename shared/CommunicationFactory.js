"use strict";
// Factory for creating communication managers and servers
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationFactory = void 0;
// Import client classes
class CommunicationFactory {
    static createManager(config) {
        console.debug('[FACTORY] Creating communication manager', { type: config.type });
        switch (config.type) {
            case 'websocket':
                // Dynamic import to avoid circular dependencies
                // In a real implementation, you would import WebSocketManager here
                console.debug('[FACTORY] Creating WebSocket manager');
                return null; // This will be implemented in the actual client app
            case 'webrtc':
                console.warn('[FACTORY] WebRTC not implemented yet');
                throw new Error('WebRTC not implemented yet');
            default:
                const error = `Unsupported communication type: ${config.type}`;
                console.error('[FACTORY]', error);
                throw new Error(error);
        }
    }
    static createServer(config) {
        console.debug('[FACTORY] Creating communication server', { protocol: config.protocol });
        switch (config.protocol) {
            case 'websocket':
                // Dynamic import to avoid circular dependencies
                // In a real implementation, you would import WebSocketServer here
                console.debug('[FACTORY] Creating WebSocket server');
                return null; // This will be implemented in the actual server app
            case 'webrtc':
                console.warn('[FACTORY] WebRTC server not implemented yet');
                throw new Error('WebRTC server not implemented yet');
            default:
                const error = `Unsupported server type: ${config.protocol}`;
                console.error('[FACTORY]', error);
                throw new Error(error);
        }
    }
    // Utility method to validate configuration
    static validateClientConfig(config) {
        console.debug('[FACTORY] Validating client config', config);
        if (!config.type) {
            console.error('[FACTORY] Missing communication type');
            return false;
        }
        if (config.type === 'websocket' && !config.serverUrl) {
            console.error('[FACTORY] WebSocket config missing serverUrl');
            return false;
        }
        console.debug('[FACTORY] Client config validation passed');
        return true;
    }
    static validateServerConfig(config) {
        console.debug('[FACTORY] Validating server config', config);
        if (!config.protocol) {
            console.error('[FACTORY] Missing server protocol');
            return false;
        }
        if (!config.port || config.port <= 0 || config.port > 65535) {
            console.error('[FACTORY] Invalid server port', { port: config.port });
            return false;
        }
        console.debug('[FACTORY] Server config validation passed');
        return true;
    }
}
exports.CommunicationFactory = CommunicationFactory;
//# sourceMappingURL=CommunicationFactory.js.map