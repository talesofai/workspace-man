export declare const gitInit: () => Promise<void>;
export declare const gitSave: (message: string, localOnly?: boolean) => Promise<void>;
export declare const gitStatus: () => Promise<import("simple-git").StatusResult>;
export declare const gitBindRemote: (url: string) => Promise<void>;
export declare const ensureGitignore: () => Promise<void>;
export declare const gitSync: () => Promise<void>;
