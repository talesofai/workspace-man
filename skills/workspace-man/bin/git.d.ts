export declare const gitInit: (cwd: string) => Promise<void>;
export declare const gitSave: (cwd: string, message: string) => Promise<void>;
export declare const gitStatus: (cwd: string) => Promise<import("simple-git").StatusResult>;
export declare const gitBindRemote: (cwd: string, url: string) => Promise<void>;
export declare const ensureGitignore: (cwd: string) => Promise<void>;
export declare const gitSync: (cwd: string) => Promise<void>;
