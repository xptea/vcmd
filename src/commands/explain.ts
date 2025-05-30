import { Command, CommandOptions } from '../types';
import { CerebrasService } from '../services/cerebras';
import { log, errorHandler } from '../utils';
import inquirer from 'inquirer';
import { spawn } from 'child_process';

export class ExplainCommand implements Command {
    name = 'explain';
    description = 'Analyze and explain shell commands';
    private cerebrasService?: CerebrasService;

    private getCerebrasService(): CerebrasService {
        if (!this.cerebrasService) {
            this.cerebrasService = new CerebrasService();
        }
        return this.cerebrasService;
    }

    async execute(options: CommandOptions): Promise<void> {
        try {
            const providedCommand = options._?.join(' ');
            
            let commandToAnalyze: string;
            
            if (providedCommand) {
                commandToAnalyze = providedCommand;
            } else {
                const answer = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'command',
                        message: 'Enter the command you want me to analyze:',
                        validate: (input: string) => {
                            if (!input.trim()) {
                                return 'Please enter a command to analyze';
                            }
                            return true;
                        }
                    }
                ]);
                commandToAnalyze = answer.command.trim();
            }

            log(`🔍 Analyzing command: ${commandToAnalyze}`);
            log('Getting analysis from AI...');
            
            const analysis = await this.getCerebrasService().analyzeCommand(commandToAnalyze);

            process.stdout.write('\x1b[1A\x1b[2K');

            await this.showAnalysisMenu(commandToAnalyze, analysis);

        } catch (error) {
            if (error && typeof error === 'object' && 'isTtyError' in error) {
                log('❌ Interactive mode not available. Please provide the command as an argument:');
                log('Usage: vcmd -e "ping 1.1.1.1.1"');
                return;
            }
            
            if (error instanceof Error && error.message.includes('API key not configured')) {
                log('❌ CEREBRAS_API_KEY not configured!');
                log('\nPlease run: vcmd -settings');
                log('This will help you set up your API key interactively.');
            } else {
                errorHandler(error as Error);
            }
        }
    }

    private async showAnalysisMenu(originalCommand: string, analysis: any): Promise<void> {
        console.log('\n🛠️  Command Analysis & Suggestions:');
        console.log('====================================\n');
        console.log(`🔎 Original Command: \x1b[36m${originalCommand}\x1b[0m\n`);
        
        console.log('📋 Analysis:');
        console.log(analysis.analysis);

        if (analysis.explanation) {
            console.log('\n📚 How it works:');
            console.log(analysis.explanation);
        }

        console.log('\n');

        const choices = [];

        if (analysis.suggestedFix) {
            choices.push({
                name: `🔧 Execute Suggested Fix: ${analysis.suggestedFix}`,
                value: { type: 'execute', command: analysis.suggestedFix }
            });
        }

        if (analysis.alternatives && analysis.alternatives.length > 0) {
            analysis.alternatives.forEach((alt: string, index: number) => {
                choices.push({
                    name: `🔄 Execute Alternative ${index + 1}: ${alt}`,
                    value: { type: 'execute', command: alt }
                });
            });
        }

        choices.push({
            name: '📖 Get detailed explanation',
            value: { type: 'explain', command: originalCommand }
        });

        choices.push({
            name: '❌ Exit',
            value: { type: 'exit' }
        });

        try {
            if (analysis.suggestedFix) {
                console.log('💡 Suggested Fix:');
                console.log('\x1b[32m' + analysis.suggestedFix + '\x1b[0m\n');
            }
            
            if (analysis.alternatives && analysis.alternatives.length > 0) {
                console.log('🔄 Alternative Commands:');
                analysis.alternatives.forEach((alt: string, index: number) => {
                    console.log(`${index + 1}. \x1b[36m${alt}\x1b[0m`);
                });
                console.log('');
            }

            const answer = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: choices,
                    pageSize: Math.min(choices.length, 8)
                }
            ]);

            if (answer.action.type === 'execute') {
                await this.executeCommand(answer.action.command);
            } else if (answer.action.type === 'explain') {
                await this.getDetailedExplanation(answer.action.command);
            } else {
                log('Analysis completed.');
            }

        } catch (error) {
            if (error && typeof error === 'object' && 'isTtyError' in error) {
                if (analysis.suggestedFix) {
                    console.log('💡 Suggested Fix:');
                    console.log('\x1b[32m' + analysis.suggestedFix + '\x1b[0m');
                }
                
                if (analysis.alternatives && analysis.alternatives.length > 0) {
                    console.log('\n🔄 Alternative Commands:');
                    analysis.alternatives.forEach((alt: string, index: number) => {
                        console.log(`${index + 1}. \x1b[36m${alt}\x1b[0m`);
                    });
                }
            } else {
                throw error;
            }
        }
    }

    private async executeCommand(command: string): Promise<void> {
        try {
            console.log('\n⚡ Executing command...\n');
            console.log('\x1b[36m' + command + '\x1b[0m\n');

            const childProcess = spawn(command, [], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });

            childProcess.stdout.on('data', (data) => {
                process.stdout.write(data.toString());
            });

            childProcess.stderr.on('data', (data) => {
                process.stderr.write('\x1b[31m' + data.toString() + '\x1b[0m');
            });

            childProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('\n✅ Command executed successfully!');
                } else {
                    console.log(`\n❌ Command exited with code ${code}`);
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
        }
    }

    private async getDetailedExplanation(command: string): Promise<void> {
        try {
            log('\n📚 Getting detailed explanation...');
            const explanation = await this.getCerebrasService().explainCommand(command);
            
            process.stdout.write('\x1b[1A\x1b[2K');
            
            console.log('\n📖 Detailed Command Explanation:');
            console.log('=================================\n');
            console.log('\x1b[36m' + command + '\x1b[0m\n');
            console.log(explanation);
            console.log('\n');
        } catch (error) {
            process.stdout.write('\x1b[1A\x1b[2K');
            log('❌ Failed to get detailed explanation');
            errorHandler(error as Error);
        }
    }
}
