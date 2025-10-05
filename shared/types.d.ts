export interface MessagePayload {
    [key: string]: any;
}
export interface Message {
    id: string;
    type: MessageType;
    timestamp: number;
    sender: string;
    recipient: string;
    payload: MessagePayload;
    metadata?: Record<string, any>;
}
export declare enum MessageType {
    HANDSHAKE = "handshake",
    DATA = "data",
    COMMAND = "command",
    STATUS = "status",
    ERROR = "error",
    HEARTBEAT = "heartbeat"
}
export interface CommunicationConfig {
    type: 'websocket' | 'webrtc';
    serverUrl?: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}
export interface ClientInfo {
    id: string;
    connection: any;
    ip?: string;
    connectedAt: Date;
}
export interface ServerConfig {
    protocol: 'websocket' | 'webrtc';
    port: number;
    heartbeatInterval?: number;
}
export interface Logger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}
export declare class ConsoleLogger implements Logger {
    private prefix;
    constructor(prefix?: string);
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}
export declare const createMessage: (type: MessageType, payload: MessagePayload, sender: string, recipient?: string) => Message;
//# sourceMappingURL=types.d.ts.map