import 'dotenv/config';
import { CommandManager } from './commands';
import { log, errorHandler } from './utils';

const commandManager = new CommandManager();

const parseArguments = (): { command: string; options: any } => {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        return { command: 'help', options: {} };
    }

    const firstArg = args[0];

    if (firstArg === '-settings' || firstArg === '--settings') {
        return { command: 'settings', options: {} };
    }

    if (firstArg === '-e' || firstArg === '--explain') {
        const restArgs = args.slice(1);
        return { 
            command: 'explain', 
            options: { _: restArgs } 
        };
    }

    if (firstArg === '-update' || firstArg === '--update') {
        const restArgs = args.slice(1);
        return { 
            command: 'update', 
            options: { 
                _: restArgs,
                auto: restArgs.includes('--auto')
            } 
        };
    }

    if (firstArg === '-h' || firstArg === '-help' || firstArg === '--help') {
        return { command: 'help', options: {} };
    }

    const fullQuery = args.join(' ');
    if (fullQuery.toLowerCase().startsWith('can you ')) {
        const naturalQuery = fullQuery.substring(8);
        return {
            command: 'convert',
            options: {
                query: naturalQuery,
                _: [naturalQuery]
            }
        };
    }

    if (!firstArg.startsWith('-')) {
        const naturalQuery = fullQuery;
        return {
            command: 'convert',
            options: {
                query: naturalQuery,
                _: [naturalQuery]
            }
        };
    }

    const command = args[0];
    const restArgs = args.slice(1);

    const options: any = { _: restArgs };

    if (command === 'convert' && restArgs.length > 0) {
        options.query = restArgs.join(' ');
    }

    return { command, options };
};

const main = async () => {
    try {
        log('==== VCMD By Voidworks.xyz ====');
        const { command, options } = parseArguments();
        await commandManager.execute(command, options);
    } catch (error) {
        errorHandler(error as Error);
        process.exit(1);
    }
};

main();