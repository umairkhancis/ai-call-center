import { CommunicationConfig, ServerConfig } from './types';
export declare class CommunicationFactory {
    static createManager(config: CommunicationConfig): any;
    static createServer(config: ServerConfig): any;
    static validateClientConfig(config: CommunicationConfig): boolean;
    static validateServerConfig(config: ServerConfig): boolean;
}
//# sourceMappingURL=CommunicationFactory.d.ts.map