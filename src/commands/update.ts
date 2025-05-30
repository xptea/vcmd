import { Command, CommandOptions } from '../types';
import { log, errorHandler } from '../utils';
import { spawn } from 'child_process';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export class UpdateCommand implements Command {
    name = 'update';
    description = 'Check for updates and update void-cmd';

    async execute(options: CommandOptions): Promise<void> {
        try {
            log('\n🔄 Checking for updates...');
            
            const currentVersion = this.getCurrentVersion();
            const latestVersion = await this.getLatestVersion();
            
            if (!latestVersion) {
                log('❌ Could not check for updates. Please check your internet connection.');
                return;
            }

            log(`\n📦 Current version: ${currentVersion}`);
            log(`📦 Latest version:  ${latestVersion}`);

            if (this.compareVersions(currentVersion, latestVersion) >= 0) {
                log('\n✅ You are already running the latest version!');
                return;
            }

            log('\n🆙 A new version is available!');
            log('\nUpdate options:');
            log('1. Run: npm update -g void-cmd');
            log('2. Run: bun update -g void-cmd');
            log('3. Run: vcmd -update --auto (automatic update)');

            if (options.auto || options._?.includes('--auto')) {
                await this.performUpdate();
            }

        } catch (error) {
            errorHandler(error as Error);
        }
    }

    private getCurrentVersion(): string {
        try {
            const possiblePaths = [
                path.join(__dirname, '../../package.json'),
                path.join(__dirname, '../package.json'),
                path.join(process.cwd(), 'package.json')
            ];

            for (const packagePath of possiblePaths) {
                if (fs.existsSync(packagePath)) {
                    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                    return packageJson.version;
                }
            }

            return '1.0.0';
        } catch (error) {
            return '1.0.0';
        }
    }

    private async getLatestVersion(): Promise<string | null> {
        try {
            const response = await axios.get('https://registry.npmjs.org/void-cmd/latest', {
                timeout: 5000
            });
            return response.data.version;
        } catch (error) {
            try {
                const response = await axios.get('https://registry.npmjs.org/void-cmd', {
                    timeout: 5000
                });
                return response.data['dist-tags'].latest;
            } catch (fallbackError) {
                return null;
            }
        }
    }

    private compareVersions(current: string, latest: string): number {
        const currentParts = current.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);

        for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
            const currentPart = currentParts[i] || 0;
            const latestPart = latestParts[i] || 0;

            if (currentPart < latestPart) return -1;
            if (currentPart > latestPart) return 1;
        }

        return 0;
    }

    private async performUpdate(): Promise<void> {
        log('\n⚡ Starting automatic update...');

        const updateCommands = [
            'npm update -g void-cmd',
            'bun update -g void-cmd'
        ];

        for (const command of updateCommands) {
            try {
                log(`\n🔄 Trying: ${command}`);
                const success = await this.runCommand(command);
                
                if (success) {
                    log('\n✅ Update completed successfully!');
                    log('🔄 Please restart your terminal or run a new vcmd command to use the updated version.');
                    return;
                }
            } catch (error) {
                log(`❌ Failed with ${command.split(' ')[0]}`);
                continue;
            }
        }

        log('\n❌ Automatic update failed. Please update manually:');
        log('   npm update -g void-cmd');
        log('   or');
        log('   bun update -g void-cmd');
    }

    private async runCommand(command: string): Promise<boolean> {
        return new Promise((resolve) => {
            const [cmd, ...args] = command.split(' ');
            const childProcess = spawn(cmd, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });

            let hasError = false;

            childProcess.stdout.on('data', (data) => {
                process.stdout.write(data.toString());
            });

            childProcess.stderr.on('data', (data) => {
                const output = data.toString();
                if (output.includes('error') || output.includes('Error')) {
                    hasError = true;
                }
                process.stderr.write('\x1b[31m' + output + '\x1b[0m');
            });

            childProcess.on('close', (code) => {
                resolve(code === 0 && !hasError);
            });

            childProcess.on('error', () => {
                resolve(false);
            });
        });
    }
}
