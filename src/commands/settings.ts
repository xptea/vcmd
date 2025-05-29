import { Command, CommandOptions } from '../types';
import { log, errorHandler } from '../utils';
import { loadSettings, saveSettings, getSettingsFilePath } from '../config';
import * as readline from 'readline';

export class SettingsCommand implements Command {
    name = 'settings';
    description = 'Configure API key and other settings';

    async execute(options: CommandOptions): Promise<void> {
        try {
            await this.configureSettings();
        } catch (error) {
            errorHandler(error as Error);
        }
    }

    private async configureSettings(): Promise<void> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (prompt: string): Promise<string> => {
            return new Promise((resolve) => {
                rl.question(prompt, resolve);
            });
        };

        try {
            log('\n⚙️  VCMD Settings Configuration');
            log('===============================\n');

            const currentSettings = loadSettings();

            if (currentSettings.apiKey) {
                log(`Current API Key: ${currentSettings.apiKey.substring(0, 8)}...`);
                log(`Current Base URL: ${currentSettings.baseUrl || 'https://api.cerebras.ai/v1'}`);
                log(`Current Model: ${currentSettings.model || 'llama-4-scout-17b-16e-instruct'}\n`);
            }

            const apiKey = await question('Enter your Cerebras API Key (starts with csk-): ');

            if (!apiKey.trim()) {
                log('❌ API Key is required!');
                return;
            }

            if (!apiKey.startsWith('csk-')) {
                log('⚠️  Warning: API Key should start with "csk-"');
            }

            const baseUrl = await question(`Enter Base URL (default: https://api.cerebras.ai/v1): `);
            const model = await question(`Enter Model (default: llama-4-scout-17b-16e-instruct): `);

            const settings = {
                apiKey: apiKey.trim(),
                baseUrl: baseUrl.trim() || 'https://api.cerebras.ai/v1',
                model: model.trim() || 'llama-4-scout-17b-16e-instruct'
            };

            saveSettings(settings);

            log('\n✅ Settings saved successfully!');
            log(`Settings file: ${getSettingsFilePath()}`);
            log('\nYou can now use: vcmd can you [your request]');

        } catch (error) {
            log('\n❌ Failed to configure settings');
            throw error;
        } finally {
            rl.close();
        }
    }
}
