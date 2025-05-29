import { Command, CommandOptions } from '../types';
import { CerebrasService } from '../services/cerebras';
import { log, errorHandler } from '../utils';
import { saveCommandHistory } from '../config';
import inquirer from 'inquirer';
import { spawn } from 'child_process';

export class ConvertCommand implements Command {
    name = 'convert';
    description = 'Convert natural language to shell command';
    private cerebrasService?: CerebrasService;

    private getCerebrasService(): CerebrasService {
        if (!this.cerebrasService) {
            this.cerebrasService = new CerebrasService();
        }
        return this.cerebrasService;
    }

    async execute(options: CommandOptions): Promise<void> {
        const query = options.query || options._?.[0];
        if (!query) {
            log('Usage: convert "your natural language description"');
            return;
        }

        try {
            log('Converting natural language to shell command...');
            const result = await this.getCerebrasService().convertToShellCommand(query);

            process.stdout.write('\x1b[1A\x1b[2K');

            await this.showCommandPrompt(result);

        } catch (error) {
            process.stdout.write('\x1b[1A\x1b[2K');

            if (error instanceof Error && error.message.includes('API key not configured')) {
                log('❌ CEREBRAS_API_KEY not configured!');
                log('\nPlease run: vcmd -settings');
                log('This will help you set up your API key interactively.');
            } else {
                errorHandler(error as Error);
            }
        }
    }

    private async showCommandPrompt(result: any): Promise<void> {
        const safetyEmoji = this.getSafetyEmoji(result.safety);
        const safetyColor = this.getSafetyColor(result.safety);

        console.log(`\n${safetyColor}${safetyEmoji} Safety Level: ${result.safety.toUpperCase()}\x1b[0m`);
        console.log('\x1b[1m' + result.command + '\x1b[0m');
        console.log(`\n\x1b[90m${result.explanation}\x1b[0m\n`);

        const choices = [
            {
                name: `▶️  Execute: ${result.command}`,
                value: 'execute'
            },
            {
                name: '📚 Explain command in detail',
                value: 'explain'
            },
            {
                name: '❌ Exit',
                value: 'exit'
            }
        ];

        try {
            const answer = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: choices,
                    pageSize: 3
                }
            ]);

            if (answer.action === 'execute') {
                await this.executeCommand(result.command, result.safety);
            } else if (answer.action === 'explain') {
                await this.explainCommand(result.command);
            } else {
                log('Command execution cancelled.');
            }
        } catch (error) {
            if (error && typeof error === 'object' && 'isTtyError' in error) {
                log('\n🤖 Generated Command:');
                log(`Command: ${result.command}`);
                log(`Safety: ${safetyEmoji} ${result.safety.toUpperCase()}`);
                log(`Explanation: ${result.explanation}`);
            } else {
                throw error;
            }
        }
    }

    private async explainCommand(command: string): Promise<void> {
        try {
            log('\n📚 Getting detailed explanation...');
            const explanation = await this.getCerebrasService().explainCommand(command);
            
            process.stdout.write('\x1b[1A\x1b[2K');
            
            console.log('\n📖 Command Explanation:');
            console.log('========================\n');
            console.log('\x1b[36m' + command + '\x1b[0m\n');
            console.log(explanation);
            console.log('\n');
        } catch (error) {
            process.stdout.write('\x1b[1A\x1b[2K');
            log('❌ Failed to get detailed explanation');
            errorHandler(error as Error);
        }
    }

    private async executeCommand(command: string, safety: string): Promise<void> {
        try {
            if (safety === 'dangerous') {
                console.log('\n🚨 WARNING: This is a dangerous command!');
                const confirm = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'proceed',
                        message: 'Are you absolutely sure you want to execute this?',
                        default: false
                    }
                ]);

                if (!confirm.proceed) {
                    log('Command execution cancelled for safety.');
                    return;
                }
            }

            console.log('\n⚡ Executing command...\n');
            console.log('\x1b[36m' + command + '\x1b[0m\n');

            // Save command to history before execution
            saveCommandHistory({
                command,
                timestamp: new Date().toISOString(),
                safety
            });

            const childProcess = spawn(command, [], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });

            let hasOutput = false;
            let exitCode = 0;

            childProcess.stdout.on('data', (data) => {
                hasOutput = true;
                process.stdout.write(data.toString());
            });

            childProcess.stderr.on('data', (data) => {
                hasOutput = true;
                process.stderr.write('\x1b[31m' + data.toString() + '\x1b[0m');
            });

            childProcess.on('close', (code) => {
                exitCode = code || 0;
                
                // Update command history with result
                saveCommandHistory({
                    command,
                    timestamp: new Date().toISOString(),
                    safety,
                    exitCode,
                    success: code === 0
                });

                if (code === 0) {
                    console.log('\n✅ Command executed successfully!');
                } else {
                    console.log(`\n❌ Command exited with code ${code}`);
                    console.log('\n💡 Tip: Run "vcmd -e" to analyze what went wrong');
                }
            });

            childProcess.on('error', (error) => {
                console.error('\n❌ Command execution failed:');
                console.error(error.message);
            });

            console.log('\n\x1b[90m(Press Ctrl+C to stop the command)\x1b[0m');

            const signalHandler = () => {
                console.log('\n\n⏹️  Command interrupted by user');
                childProcess.kill('SIGTERM');
                process.exit(0);
            };

            process.on('SIGINT', signalHandler);

            await new Promise<void>((resolve) => {
                childProcess.on('close', () => {
                    process.removeListener('SIGINT', signalHandler);
                    resolve();
                });
            });

        } catch (error: any) {
            console.error('\n❌ Command execution failed:');
            console.error(error.message);
            console.log('\n💡 Tip: Run "vcmd -e" to analyze what went wrong');
            
            // Save failed command to history
            saveCommandHistory({
                command,
                timestamp: new Date().toISOString(),
                safety,
                success: false,
                error: error.message
            });
        }
    }

    private getSafetyEmoji(safety: string): string {
        switch (safety) {
            case 'safe': return '✅';
            case 'caution': return '⚠️';
            case 'dangerous': return '🚨';
            default: return '❓';
        }
    }

    private getSafetyColor(safety: string): string {
        switch (safety) {
            case 'safe': return '\x1b[32m';
            case 'caution': return '\x1b[33m';
            case 'dangerous': return '\x1b[31m';
            default: return '\x1b[37m';
        }
    }
}
