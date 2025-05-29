# VCMD - Natural Language to Shell Commands CLI

A powerful CLI tool that converts natural language descriptions into shell commands using the Cerebras AI API. Built with Bun and TypeScript for fast performance and excellent developer experience.

## ✨ Features

- 🤖 **AI-Powered Command Generation** - Convert natural language to shell commands using Cerebras AI
- 🖥️ **OS-Aware** - Automatically detects your operating system and generates appropriate commands
- 🛡️ **Safety Classification** - Commands are classified as safe, caution, or dangerous
- ⚡ **Fast Execution** - Built with Bun runtime for optimal performance
- 📚 **Command Explanation** - Get detailed explanations of generated commands
- 🔧 **Command Analysis** - Analyze and fix failed commands with AI assistance
- 🌍 **Global CLI** - Install once, use anywhere with `vcmd`
- ⚙️ **Interactive Configuration** - Easy setup with guided prompts
- 💬 **Natural Syntax** - Use intuitive "can you" syntax or direct requests

## 🚀 Quick Start

### Install from npm
```bash
# Install globally with npm
npm install -g void-cmd

# Install globally with Bun
bun install -g void-cmd

# Install globally with yarn
yarn global add void-cmd

# Install globally with pnpm
pnpm install -g void-cmd
```

### Or Install from Source
```bash
git clone <repository-url>
cd my-bun-cli
bun install
npm run install-global
```

### Configure and Use
```bash
# Configure API key
vcmd -settings

# Start using
vcmd can you list all files
vcmd make sure that ip 1.1.1.1 is online
```

## 📖 Usage

### Natural Language Commands
```bash
# Natural syntax (recommended)
vcmd list all files in current directory
vcmd can you see if this ip 1.1.1.1 is online
vcmd find all JavaScript files modified in the last 7 days
vcmd create a backup of my home directory
vcmd show disk usage for all mounted drives

# Both syntaxes work
vcmd can you list all files
vcmd list all files
```

### Command Analysis & Troubleshooting
```bash
# Analyze any command interactively
vcmd -e

# Analyze a specific command
vcmd -e "ping 1.1.1.1.1"
vcmd -e ping 1.1.1.1.1

# Example workflow:
ping 1.1.1.1.1  # This fails
vcmd -e "ping 1.1.1.1.1"  # Get AI analysis and fixes
```

### Configuration
```bash
vcmd -settings    # Configure API key, model, etc.
vcmd -help        # Show help
```

## 📦 Installation Methods

The package is published as `void-cmd` but installs the `vcmd` command:

```bash
# All of these install the 'vcmd' command globally:
npm install -g void-cmd
bun install -g void-cmd
yarn global add void-cmd
pnpm install -g void-cmd
```

After installation, use the `vcmd` command anywhere in your terminal.

## 🛠️ Command Analysis Features

When you use `vcmd -e`, you get:

- **Intelligent Analysis** - AI examines what went wrong with your command
- **Suggested Fixes** - Get corrected versions of failed commands
- **Alternative Commands** - Multiple ways to achieve the same goal
- **Interactive Execution** - Execute suggested fixes directly from the menu
- **Detailed Explanations** - Understand how commands work

### Example Analysis Session

```bash
$ ping 1.1.1.1.1
ping: 1.1.1.1.1: Name or service not known

$ vcmd -e "ping 1.1.1.1.1"
==== VCMD By Voidworks.xyz ====

🛠️  Command Analysis & Suggestions:
====================================

🔎 Original Command: ping 1.1.1.1.1

📋 Analysis:
The command has a malformed IP address. "1.1.1.1.1" is not a valid IPv4 address format...

💡 Suggested Fix:
ping -c 4 1.1.1.1

🔄 Alternative Commands:
1. ping -c 4 8.8.8.8
2. ping -c 4 google.com

? What would you like to do?
  🔧 Execute Suggested Fix: ping -c 4 1.1.1.1
  🔄 Execute Alternative 1: ping -c 4 8.8.8.8
  🔄 Execute Alternative 2: ping -c 4 google.com
❯ 📖 Get detailed explanation
  ❌ Exit
```

## 🖥️ OS-Aware Command Generation

VCMD automatically detects your operating system and generates appropriate commands:

| Request | Windows | Linux/macOS |
|---------|---------|-------------|
| List files | `dir /a` | `ls -la` |
| View file content | `type filename.txt` | `cat filename.txt` |
| Check connectivity | `ping -n 4 1.1.1.1` | `ping -c 4 1.1.1.1` |
| Network info | `netstat -an` | `netstat -tuln` |

## 🛡️ Safety Levels

All commands are classified for safety:

- **✅ SAFE** - Read-only operations (listing files, checking status)
- **⚠️ CAUTION** - File modifications, system changes
- **🚨 DANGEROUS** - Destructive operations requiring confirmation

## ⚙️ Configuration

Settings are stored in `~/.vcmd-settings.json`:

```json
{
  "apiKey": "csk-your-api-key-here",
  "baseUrl": "https://api.cerebras.ai/v1",
  "model": "llama3.1-8b"
}
```

### Getting a Cerebras API Key

1. Visit [Cerebras Cloud](https://cloud.cerebras.ai/)
2. Sign up for an account
3. Generate an API key
4. Run `vcmd -settings` to configure

## 🔧 Development

```bash
# Development with auto-reload
bun run dev

# Build for production
bun run build

# Install globally for testing
npm run install-global

# Remove global installation
npm run uninstall-global
```

## 📝 Command Reference

| Command | Description |
|---------|-------------|
| `vcmd [request]` | Convert natural language to shell command |
| `vcmd can you [request]` | Alternative natural language syntax |
| `vcmd -e` | Analyze command interactively |
| `vcmd -e "command"` | Analyze specific command |
| `vcmd -settings` | Configure API key and settings |
| `vcmd -help` | Show help information |

## 🎯 Example Commands

### File Operations
```bash
vcmd list all hidden files
vcmd find files larger than 100MB
vcmd compress all log files in /var/log
vcmd show permissions for all files in current directory
```

### Network & System
```bash
vcmd check if google.com is reachable
vcmd show all listening ports
vcmd display system memory usage
vcmd find process using port 3000
```

### Development
```bash
vcmd find all Python files with TODO comments
vcmd count lines of code in all JavaScript files
vcmd show git commits from last week
vcmd install package.json dependencies
```

## 🐛 Troubleshooting

### API Key Issues
```bash
# If you see "API key not configured"
vcmd -settings

# Verify your settings
cat ~/.vcmd-settings.json
```

### Command Analysis Not Working
```bash
# Make sure you provide the command correctly
vcmd -e "your-failed-command"

# For interactive mode
vcmd -e
```

### Permission Issues
```bash
# If global install fails
sudo npm run install-global

# Or use local development
bun run dev [your command]
```

## 🗑️ Uninstallation

```bash
# Remove global command
npm run uninstall-global

# Remove settings
rm ~/.vcmd-settings.json

# Remove command history
rm ~/.vcmd-history.json
```

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Setup
```bash
git clone <your-fork>
cd my-bun-cli
bun install
bun run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh/) for fast JavaScript runtime
- Powered by [Cerebras AI](https://cerebras.ai/) for intelligent command generation
- Uses [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) for interactive prompts

---

**Made with ❤️ by VoidWorks.xyz**

> Transform your natural language into powerful shell commands with AI assistance!