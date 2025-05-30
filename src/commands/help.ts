import { Command, CommandOptions } from '../types';
import { log } from '../utils';
import * as os from 'os';

export class HelpCommand implements Command {
    name = 'help';
    description = 'Show help information';

    async execute(options: CommandOptions): Promise<void> {
        log('\n📚 VCMD by VoidWorks.xyz');
        log('\n🚀 Usage:');
        log('  vcmd [your request]             # Run a command using natural language');
        log('  vcmd can you [your request]     # Alternative phrasing for commands');
        log('  vcmd -settings                  # Open interactive settings');
        log('  vcmd -e [your command]          # Analyze a command interactively');
        log('  vcmd -update                    # Check for updates');
        log('  vcmd -help                      # Show this help message');
        log('\n💡 Examples:');
        log('  vcmd list all files in the current directory');
        log('  vcmd make sure the IP 1.1.1.1 is online');
        log('  vcmd can you find all JavaScript files modified in the last 7 days');
        log('  vcmd can you create a backup of my home directory');
        log('  vcmd show disk usage for all mounted drives');
        log('\n⚙️  Settings:');
        log('  vcmd -settings                  # Configure your API key and preferences');
        log('\n🛠️  Command Analysis:');
        log('  vcmd -e                         # Enter interactive analysis mode');
        log('  vcmd -e "ping 1.1.1.1"          # Analyze a specific command');
        log('  vcmd -e ping 1.1.1.1            # Analyze command without quotes');
        log('\n🔄 Updates:');
        log('  vcmd -update                    # Check for available updates');
        log('  vcmd -update --auto             # Automatically update if a new version is found');
        log('\n🛡️  Safety Levels:');
        log('  ✅ SAFE        - Read-only operations');
        log('  ⚠️  CAUTION     - File modifications or system changes');
        log('  🚨 DANGEROUS   - Destructive or irreversible actions');

        const platform = os.platform();
        const osType = this.getOSType(platform);
        log(`\n🖥️  Detected OS: ${osType} (${platform})`);
        log('Commands will be generated for your operating system.');
        log('Version: 1.1.1');

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
