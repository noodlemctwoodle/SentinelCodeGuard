import * as vscode from 'vscode';
import { SentinelRuleValidator } from './validation/validator';
import { SentinelRuleFormatter } from './formatting/formatter';
import { CommandManager } from './commands/index';
import { createFormattingProvider } from './providers/formatProvider';
import { DocumentListenerManager } from './listeners/documentListeners';
import { MitreLoader } from './validation/mitreLoader';
import { ConnectorLoader } from './validation/connectorLoader';

export async function activate(context: vscode.ExtensionContext) {
    console.log('🚀 SentinelCodeGuard: Starting activation...');

    // Initialize loaders
    try {
        await MitreLoader.loadMitreData();
        await ConnectorLoader.loadConnectorData();
        console.log('✅ SentinelCodeGuard: Data loaders initialized');
    } catch (error) {
        console.error('❌ SentinelCodeGuard: Failed to initialize validation loaders:', error);
        // Extension will continue with basic validation
    }

    // Create core components
    const validator = new SentinelRuleValidator();
    const commandManager = new CommandManager(context, validator);
    const documentListenerManager = new DocumentListenerManager(validator);

    // Set the extension context for the formatter (needed for template loading)
    SentinelRuleFormatter.setExtensionContext(context);

    // Register all components
    console.log('🔧 SentinelCodeGuard: Registering components...');
    
    const documentListeners = documentListenerManager.registerListeners();
    console.log(`📄 SentinelCodeGuard: Registered ${documentListeners.length} document listeners`);
    
    const commands = commandManager.registerCommands();
    console.log(`⚡ SentinelCodeGuard: Registered ${commands.length} commands`);
    
    const formatterProvider = createFormattingProvider();
    console.log('🎨 SentinelCodeGuard: Registered formatting provider');

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
    const sentinelCommands = allCommands.filter(cmd => cmd.startsWith('sentinelRules.'));
    console.log('🔍 SentinelCodeGuard: Available commands:', sentinelCommands);
}

export function deactivate() {
    console.log('🛑 SentinelCodeGuard: Extension deactivated');
}