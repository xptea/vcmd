import { CommandOptions } from '../types';

export function log(message: string): void {
    console.log(message);
}

export function errorHandler(error: Error): void {
    console.error('An error occurred:', error.message);
}

export function parseCommandOptions(options: CommandOptions): string {
    return Object.entries(options)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
}