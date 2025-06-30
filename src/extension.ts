import * as vscode from 'vscode';
import { SentinelRuleValidator } from './validation/validator';
import { SentinelRuleFormatter } from './formatting/formatter';
import { CommandManager } from './commands/index';
import { createFormattingProvider } from './providers/formatProvider';
import { DocumentListenerManager } from './listeners/documentListeners';
import { MitreLoader } from './validation/mitreLoader';
import { ConnectorLoader } from './validation/connectorLoader';
import { SentinelCompletionProvider } from './providers/completionProvider';

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

function getErrorStack(error: unknown): string | undefined {
    if (error instanceof Error) {
        return error.stack;
    }
    return undefined;
}

export async function activate(context: vscode.ExtensionContext) {
    try {
        console.log('🚀 SentinelCodeGuard: Starting activation...');

        // Set extension context for all components that need it
        SentinelRuleFormatter.setExtensionContext(context);
        MitreLoader.setExtensionContext(context);
        ConnectorLoader.setExtensionContext(context);

        // Initialize loaders
        try {
            await MitreLoader.loadMitreData();
            await ConnectorLoader.loadConnectorData();
            console.log('✅ SentinelCodeGuard: Data loaders initialized');
        } catch (loaderError) {
            console.error('❌ SentinelCodeGuard: Failed to initialize validation loaders:', getErrorMessage(loaderError));
            // Extension will continue with basic validation
        }

        // Create core components
        const validator = new SentinelRuleValidator();
        const commandManager = new CommandManager(context, validator);
        const documentListenerManager = new DocumentListenerManager(validator);

        // Register all components
        console.log('🔧 SentinelCodeGuard: Registering components...');
        
        const documentListeners = documentListenerManager.registerListeners();
        console.log(`📄 SentinelCodeGuard: Registered ${documentListeners.length} document listeners`);
        
        const commands = commandManager.registerCommands();
        console.log(`⚡ SentinelCodeGuard: Registered ${commands.length} commands`);
        
        const formatterProvider = createFormattingProvider();
        console.log('🎨 SentinelCodeGuard: Registered formatting provider');

        const completionProvider = vscode.languages.registerCompletionItemProvider(
            { scheme: 'file', language: 'yaml' },
            new SentinelCompletionProvider(),
            ':', '"', "'"  // Trigger characters
        );
        context.subscriptions.push(completionProvider);

        // Add all disposables to context subscriptions
        context.subscriptions.push(
            validator,
            ...documentListeners,
            ...commands,
            formatterProvider
        );

        // Validate open documents on activation
        documentListenerManager.validateOpenDocuments();

        console.log('✅ SentinelCodeGuard: Extension activation complete!');
        
        // Test command registration
        const allCommands = await vscode.commands.getCommands(true);
        const sentinelCommands = allCommands.filter((cmd: string) => cmd.startsWith('sentinelRules.'));
        console.log('🔍 SentinelCodeGuard: Available commands:', sentinelCommands);
        
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        const errorStack = getErrorStack(error);
        
        console.error('❌ SentinelCodeGuard: Extension activation failed:', errorMessage);
        if (errorStack) {
            console.error('Stack trace:', errorStack);
        }
        
        vscode.window.showErrorMessage(`SentinelCodeGuard activation failed: ${errorMessage}`);
        throw error;
    }
}

export function deactivate() {
    console.log('🛑 SentinelCodeGuard: Extension deactivated');
}