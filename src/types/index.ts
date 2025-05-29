export interface Command {
    name: string;
    description: string;
    execute(options: CommandOptions): Promise<void>;
}

export interface CommandOptions {
    [key: string]: any;
}

export interface CerebrasConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
}

export interface CerebrasRequest {
    model: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    max_tokens?: number;
    temperature?: number;
}

export interface CerebrasResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export interface ShellCommandResult {
    command: string;
    explanation: string;
    safety: 'safe' | 'caution' | 'dangerous';
}