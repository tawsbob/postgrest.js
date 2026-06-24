export declare function runDbPing(): Promise<void>;
export declare function runDbBootstrap(schemaPath?: string): Promise<void>;
export declare function runDbDiff(args: string[]): Promise<void>;
export declare function runDbMigrate(args: string[]): Promise<void>;
