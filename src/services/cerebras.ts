import axios from 'axios';
import { CerebrasConfig, CerebrasRequest, CerebrasResponse, ShellCommandResult } from '../types';
import { getCerebrasConfig } from '../config';
import * as os from 'os';

export class CerebrasService {
    private config?: CerebrasConfig;

    private getConfig(): CerebrasConfig {
        if (!this.config) {
            this.config = getCerebrasConfig();
        }
        return this.config;
    }

    async convertToShellCommand(naturalLanguage: string): Promise<ShellCommandResult> {
        const config = this.getConfig();
        const prompt = this.buildPrompt(naturalLanguage);

        const request: CerebrasRequest = {
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that converts natural language descriptions into shell commands. You must respond with ONLY a valid JSON object. No explanatory text before or after the JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 300,
            temperature: 0.1
        };

        try {
            const response = await axios.post<CerebrasResponse>(
                `${config.baseUrl}/chat/completions`,
                request,
                {
                    headers: {
                        'Authorization': `Bearer ${config.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const content = response.data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from Cerebras API');
            }

            return this.parseResponse(content);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('API Error Status:', error.response?.status);
                console.error('API Error Data:', error.response?.data);
                throw new Error(`Cerebras API error: ${error.response?.status} - ${error.response?.statusText}`);
            }
            throw new Error(`Cerebras API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private buildPrompt(naturalLanguage: string): string {
        const platform = os.platform();
        const osType = this.getOSType(platform);

        return `Convert this natural language to a shell command for ${osType}. Respond ONLY with JSON in this exact format:

{"command": "the_shell_command", "explanation": "brief explanation", "safety": "safe"}

Operating System: ${osType}
Platform: ${platform}
Natural language: "${naturalLanguage}"

Safety levels: "safe" (read-only), "caution" (modifications), "dangerous" (destructive)

IMPORTANT: Generate complete, working commands for ${osType}:

Windows examples:
- ping: "ping -n 4 1.1.1.1" (use -n for count)
- list files: "dir" or "ls" (if using PowerShell)
- file content: "type filename.txt"

Linux/macOS examples:  
- ping: "ping -c 4 1.1.1.1" (use -c for count, NEVER just "ping 1.1.1.1")
- list files: "ls -la" 
- file content: "cat filename.txt"
- network: "netstat -tuln" or "ss -tuln"

CRITICAL: 
- For ping commands on Linux/macOS: ALWAYS include "-c [number]" flag
- For ping commands on Windows: ALWAYS include "-n [number]" flag  
- Never generate incomplete commands that require additional arguments
- Ensure all commands are complete and will execute successfully

JSON response only:`;
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

    private parseResponse(content: string): ShellCommandResult {
        try {
            let cleanContent = content.trim();

            cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
            cleanContent = cleanContent.replace(/^json\s*/gi, '');

            const jsonStart = cleanContent.indexOf('{');
            const jsonEnd = cleanContent.lastIndexOf('}');

            if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
                throw new Error('No valid JSON object found');
            }

            const jsonStr = cleanContent.substring(jsonStart, jsonEnd + 1);

            const parsed = JSON.parse(jsonStr);

            if (!parsed.command || !parsed.explanation || !parsed.safety) {
                throw new Error(`Missing required fields. Got: ${Object.keys(parsed).join(', ')}`);
            }

            const validSafety = ['safe', 'caution', 'dangerous'];
            if (!validSafety.includes(parsed.safety)) {
                parsed.safety = 'caution';
            }

            return {
                command: String(parsed.command).trim(),
                explanation: String(parsed.explanation).trim(),
                safety: parsed.safety as 'safe' | 'caution' | 'dangerous'
            };

        } catch (error) {
            console.error('Parse error:', error);
            console.error('Content to parse:', content);

            const commandMatch = content.match(/"command":\s*"([^"]+)"/);
            const explanationMatch = content.match(/"explanation":\s*"([^"]+)"/);

            if (commandMatch && explanationMatch) {
                return {
                    command: commandMatch[1],
                    explanation: explanationMatch[1],
                    safety: 'caution' as const
                };
            }

            throw new Error(`Failed to parse AI response. Raw content: ${content.substring(0, 200)}...`);
        }
    }

    async explainCommand(command: string): Promise<string> {
        const config = this.getConfig();
        const platform = os.platform();
        const osType = this.getOSType(platform);

        const prompt = `Explain this ${osType} shell command in detail. Break down each part and explain what it does:

Command: ${command}
Operating System: ${osType}

Provide a clear, educational explanation that covers:
1. What the command does overall
2. Each part/flag and its purpose
3. Expected output or behavior
4. Any important notes or warnings

IMPORTANT: Use plain text formatting only. NO markdown formatting (no **, ##, ###, *, -, etc.). Use simple text with line breaks and spacing for readability. Be detailed but easy to understand.`;

        const request: CerebrasRequest = {
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that explains shell commands in detail. Provide clear, educational explanations using ONLY plain text formatting. Do not use any markdown syntax like **, ##, ###, *, -, or other special formatting characters.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.1
        };

        try {
            const response = await axios.post<CerebrasResponse>(
                `${config.baseUrl}/chat/completions`,
                request,
                {
                    headers: {
                        'Authorization': `Bearer ${config.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const content = response.data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from Cerebras API');
            }

            return this.cleanMarkdownFromText(content.trim());
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Cerebras API error: ${error.response?.status} - ${error.response?.statusText}`);
            }
            throw new Error(`Cerebras API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private cleanMarkdownFromText(text: string): string {
        return text
            .replace(/#{1,6}\s+/g, '')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/^[\s]*[-*+]\s+/gm, '• ')
            .replace(/^\s*\d+\.\s+/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    async analyzeFailedCommand(command: string, exitCode?: number, error?: string): Promise<{
        analysis: string;
        suggestedFix?: string;
        alternatives?: string[];
    }> {
        const config = this.getConfig();
        const platform = os.platform();
        const osType = this.getOSType(platform);

        const prompt = `Analyze this failed ${osType} shell command and suggest fixes. Respond with JSON in this format:

{"analysis": "explanation of what went wrong", "suggestedFix": "corrected command", "alternatives": ["alternative1", "alternative2"]}

Failed Command: ${command}
Operating System: ${osType}
${exitCode !== undefined ? `Exit Code: ${exitCode}` : ''}
${error ? `Error Message: ${error}` : ''}

Common issues to check:
- Missing dependencies or tools
- Incorrect syntax for the OS
- Permission issues
- File/directory not found
- Network connectivity issues
- Invalid command options

Provide:
1. Clear analysis of what likely went wrong
2. A corrected version of the command if possible
3. 1-3 alternative approaches

JSON response only:`;

        const request: CerebrasRequest = {
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that analyzes failed shell commands and suggests fixes. Respond with ONLY valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 400,
            temperature: 0.1
        };

        try {
            const response = await axios.post<CerebrasResponse>(
                `${config.baseUrl}/chat/completions`,
                request,
                {
                    headers: {
                        'Authorization': `Bearer ${config.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const content = response.data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from Cerebras API');
            }

            return this.parseAnalysisResponse(content);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Cerebras API error: ${error.response?.status} - ${error.response?.statusText}`);
            }
            throw new Error(`Cerebras API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private parseAnalysisResponse(content: string): { analysis: string; suggestedFix?: string; alternatives?: string[] } {
        try {
            let cleanContent = content.trim();
            cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
            cleanContent = cleanContent.replace(/^json\s*/gi, '');

            const jsonStart = cleanContent.indexOf('{');
            const jsonEnd = cleanContent.lastIndexOf('}');

            if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
                throw new Error('No valid JSON object found');
            }

            const jsonStr = cleanContent.substring(jsonStart, jsonEnd + 1);
            const parsed = JSON.parse(jsonStr);

            return {
                analysis: parsed.analysis || 'Unable to analyze the command failure.',
                suggestedFix: parsed.suggestedFix,
                alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : []
            };

        } catch (error) {
            return {
                analysis: 'Failed to parse the analysis. The command likely failed due to syntax errors, missing dependencies, or permission issues.',
                suggestedFix: undefined,
                alternatives: []
            };
        }
    }

    async analyzeCommand(command: string): Promise<{
        analysis: string;
        suggestedFix?: string;
        alternatives?: string[];
        explanation?: string;
    }> {
        const config = this.getConfig();
        const platform = os.platform();
        const osType = this.getOSType(platform);

        const prompt = `Analyze this ${osType} shell command. The user just ran it and wants to understand what happened or how to fix/improve it. Respond with JSON in this format:

{"analysis": "what the command does and potential issues", "suggestedFix": "corrected version if needed", "alternatives": ["alternative1", "alternative2"], "explanation": "detailed explanation of how it works"}

Command: ${command}
Operating System: ${osType}

Analyze:
1. What the command does
2. If there are any obvious issues (syntax errors, typos, missing flags)
3. Suggest improvements or corrections
4. Provide alternative ways to achieve the same goal
5. Explain how the command works

Common issues to check:
- Typos in command names or domains
- Missing dependencies or tools
- Incorrect syntax for the OS
- Permission issues
- File/directory not found
- Network connectivity issues
- Invalid command options
- Missing quotes or escape characters

If the command looks correct, explain what it does and suggest useful variations.

JSON response only:`;

        const request: CerebrasRequest = {
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that analyzes shell commands. Provide helpful analysis whether the command failed or succeeded. Respond with ONLY valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.1
        };

        try {
            const response = await axios.post<CerebrasResponse>(
                `${config.baseUrl}/chat/completions`,
                request,
                {
                    headers: {
                        'Authorization': `Bearer ${config.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const content = response.data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from Cerebras API');
            }

            return this.parseCommandAnalysisResponse(content);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Cerebras API error: ${error.response?.status} - ${error.response?.statusText}`);
            }
            throw new Error(`Cerebras API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private parseCommandAnalysisResponse(content: string): { 
        analysis: string; 
        suggestedFix?: string; 
        alternatives?: string[];
        explanation?: string;
    } {
        try {
            let cleanContent = content.trim();
            cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
            cleanContent = cleanContent.replace(/^json\s*/gi, '');

            const jsonStart = cleanContent.indexOf('{');
            const jsonEnd = cleanContent.lastIndexOf('}');

            if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
                throw new Error('No valid JSON object found');
            }

            const jsonStr = cleanContent.substring(jsonStart, jsonEnd + 1);
            const parsed = JSON.parse(jsonStr);

            return {
                analysis: parsed.analysis || 'Unable to analyze the command.',
                suggestedFix: parsed.suggestedFix,
                alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
                explanation: parsed.explanation
            };

        } catch (error) {
            return {
                analysis: 'Failed to parse the analysis. The command might have syntax errors or require different approaches.',
                suggestedFix: undefined,
                alternatives: [],
                explanation: undefined
            };
        }
    }
}
