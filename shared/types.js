"use strict";
// Shared types and interfaces for WebSocket to WebRTC communication
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessage = exports.ConsoleLogger = exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType["HANDSHAKE"] = "handshake";
    MessageType["DATA"] = "data";
    MessageType["COMMAND"] = "command";
    MessageType["STATUS"] = "status";
    MessageType["ERROR"] = "error";
    MessageType["HEARTBEAT"] = "heartbeat";
})(MessageType || (exports.MessageType = MessageType = {}));
// Simple console logger implementation
class ConsoleLogger {
    constructor(prefix = '') {
        this.prefix = prefix ? `[${prefix}] ` : '';
    }
    debug(message, ...args) {
        console.debug(`${this.prefix}DEBUG: ${message}`, ...args);
    }
    info(message, ...args) {
        console.info(`${this.prefix}INFO: ${message}`, ...args);
    }
    warn(message, ...args) {
        console.warn(`${this.prefix}WARN: ${message}`, ...args);
    }
    error(message, ...args) {
        console.error(`${this.prefix}ERROR: ${message}`, ...args);
    }
}
exports.ConsoleLogger = ConsoleLogger;
// Helper function to create type-safe messages
const createMessage = (type, payload, sender, recipient = 'server') => {
    const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        timestamp: Date.now(),
        sender,
        recipient,
        payload,
        metadata: {}
    };
    console.debug('[MESSAGE_FACTORY] Created message:', {
        id: message.id,
        type: message.type,
        sender: message.sender,
        recipient: message.recipient,
        payloadKeys: Object.keys(message.payload)
    });
    return message;
};
exports.createMessage = createMessage;
//# sourceMappingURL=types.js.map