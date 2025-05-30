import { Command, CommandOptions } from '../types';
import { ConvertCommand } from './convert';
import { SettingsCommand } from './settings';
import { HelpCommand } from './help';
import { ExplainCommand } from './explain';
import { UpdateCommand } from './update';

class CommandManager {
    private commands: Map<string, Command>;

    constructor() {
        this.commands = new Map();
        this.registerDefaultCommands();
    }

    private registerDefaultCommands(): void {
        this.register(new ConvertCommand());
        this.register(new SettingsCommand());
        this.register(new HelpCommand());
        this.register(new ExplainCommand());
        this.register(new UpdateCommand());
    }

    register(command: Command): void {
        this.commands.set(command.name, command);
    }

    async execute(commandName: string, options: CommandOptions): Promise<void> {
        const command = this.commands.get(commandName);
        if (command) {
            await command.execute(options);
        } else {
            throw new Error(`Command "${commandName}" not found. Use "-help or -h" to see available commands.`);
        }
    }

    getCommands(): Map<string, Command> {
        return this.commands;
    }
}

export { CommandManager };
export { ConvertCommand } from './convert';
export { SettingsCommand } from './settings';
export { HelpCommand } from './help';
export { ExplainCommand } from './explain';
export { UpdateCommand } from './update';