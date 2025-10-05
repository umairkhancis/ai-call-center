import { CommunicationConfig, ServerConfig } from './types';
export declare const DEFAULT_CONFIG: {
    readonly websocket: {
        readonly serverUrl: "ws://localhost:8080";
        readonly port: 8080;
        readonly reconnectInterval: 5000;
        readonly maxReconnectAttempts: 3;
    };
    readonly webrtc: {
        readonly iceServers: readonly [{
            readonly urls: "stun:stun.l.google.com:19302";
        }];
    };
};
export declare function createClientConfig(): CommunicationConfig;
export declare function createServerConfig(): ServerConfig;
//# sourceMappingURL=config.d.ts.map