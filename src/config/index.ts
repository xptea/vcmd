import { CerebrasConfig } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const SETTINGS_FILE = path.join(os.homedir(), '.vcmd-settings.json');
const HISTORY_FILE = path.join(os.homedir(), '.vcmd-history.json');

interface Settings {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
}

interface CommandHistoryEntry {
    command: string;
    timestamp: string;
    safety: string;
    exitCode?: number;
    success?: boolean;
    error?: string;
}

export const loadSettings = (): Settings => {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const content = fs.readFileSync(SETTINGS_FILE, 'utf8');
            return JSON.parse(content);
        }
    } catch (error) {
    }
    return {};
};

export const saveSettings = (settings: Settings): void => {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (error) {
        throw new Error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const getCerebrasConfig = (): CerebrasConfig => {
    const settings = loadSettings();

    const apiKey = settings.apiKey || process.env.CEREBRAS_API_KEY;

    if (!apiKey) {
        throw new Error('API key not configured. Please run: vcmd settings');
    }

    return {
        apiKey,
        baseUrl: settings.baseUrl || process.env.CEREBRAS_BASE_URL || 'https://api.cerebras.ai/v1',
        model: settings.model || process.env.CEREBRAS_MODEL || 'llama-4-scout-17b-16e-instruct'
    };
};

export const getSettingsFilePath = (): string => {
    return SETTINGS_FILE;
};

export const ensureSettingsFileExists = (): void => {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) {
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify({}, null, 2));
        }
    } catch (error) {
        throw new Error(`Failed to create settings file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const loadCommandHistory = (): CommandHistoryEntry[] => {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const content = fs.readFileSync(HISTORY_FILE, 'utf8');
            const history = JSON.parse(content);
            return Array.isArray(history) ? history : [];
        }
    } catch (error) {
    }
    return [];
};

export const saveCommandHistory = (entry: CommandHistoryEntry): void => {
    try {
        const history = loadCommandHistory();
        history.push(entry);
        
        const trimmedHistory = history.slice(-50);
        
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmedHistory, null, 2));
    } catch (error) {
    }
};

ensureSettingsFileExists();
