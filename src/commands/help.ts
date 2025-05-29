import { Command, CommandOptions } from '../types';
import { log } from '../utils';
import * as os from 'os';

export class HelpCommand implements Command {
    name = 'help';
    description = 'Show help information';

    async execute(options: CommandOptions): Promise<void> {
        log('\n📚 VCMD by VoidWorks.xyz');
        log('\n🚀 Usage:');
        log('  vcmd [your request]          # Natural language commands');
        log('  vcmd can you [your request]  # Alternative natural language syntax');
        log('  vcmd -settings               # Configure API key');
        log('  vcmd -e                      # Analyze a command (interactive)');
        log('  vcmd -e "command"            # Analyze a specific command');
        log('  vcmd -update                 # Check for updates');
        log('  vcmd -help                   # Show this help');
        log('\n💡 Examples:');
        log('  vcmd list all files in current directory');
        log('  vcmd make sure that the ip 1.1.1.1 is online');
        log('  vcmd can you find all JavaScript files modified in the last 7 days');
        log('  vcmd can you create a backup of my home directory');
        log('  vcmd show disk usage for all mounted drives');
        log('\n⚙️  Settings:');
        log('  vcmd -settings               # Interactive configuration');
        log('\n🛠️  Command Analysis:');
        log('  vcmd -e                      # Interactive: asks for command to analyze');
        log('  vcmd -e "ping 1.1.1.1.1"    # Analyze specific command');
        log('  vcmd -e ping 1.1.1.1.1      # Analyze command (without quotes)');
        log('\n🔄 Updates:');
        log('  vcmd -update                 # Check for updates');
        log('  vcmd -update --auto          # Automatically update if available');
        log('\n🛡️  Safety Levels:');
        log('  ✅ SAFE      - Read-only operations');
        log('  ⚠️  CAUTION   - File modifications, system changes');
        log('  🚨 DANGEROUS - Destructive operations');

        const platform = os.platform();
        const osType = this.getOSType(platform);
        log(`\n🖥️  Detected OS: ${osType} (${platform})`);
        log('Commands will be generated for your operating system.');
    }

    private getOSType(platform: string): string {
        switch (platform) {
            case 'win32':
                return 'Windows';
            case 'darwin':
                return 'macOS';
            case 'linux':
                return 'Linux';
            case 'freebsd':
                return 'FreeBSD';
            case 'openbsd':
                return 'OpenBSD';
            case 'sunos':
                return 'Solaris';
            default:
                return 'Unix-like';
        }
    }
}
