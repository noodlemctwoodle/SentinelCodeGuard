import * as vscode from 'vscode';
import { SentinelRuleValidator } from './validation/validator';
import { SentinelRuleFormatter } from './formatting/formatter';
import { CommandManager } from './commands';
import { createFormattingProvider } from './providers/formatProvider';
import { DocumentListenerManager } from './listeners/documentListeners';
import { MitreLoader } from './validation/mitreLoader';
import { ConnectorLoader } from './validation/connectorLoader';

export async function activate(context: vscode.ExtensionContext) {
    console.log('Sentinel Analytics Rules extension is now active!');

    // Initialize loaders
    try {
        await MitreLoader.loadMitreData();
        await ConnectorLoader.loadConnectorData();
    } catch (error) {
        console.error('Failed to initialize validation loaders:', error);
        // Extension will continue with basic validation
    }

    // Create core components
    const validator = new SentinelRuleValidator();
    const commandManager = new CommandManager(context, validator);
    const documentListenerManager = new DocumentListenerManager(validator);

    // Set the extension context for the formatter (needed for template loading)
    SentinelRuleFormatter.setExtensionContext(context);

    // Register all components
    const documentListeners = documentListenerManager.registerListeners();
    const commands = commandManager.registerCommands();
    const formatterProvider = createFormattingProvider();

    // Add all disposables to context subscriptions
    context.subscriptions.push(
        validator,
        ...documentListeners,
        ...commands,
        formatterProvider
    );

    // Validate open documents on activation
    documentListenerManager.validateOpenDocuments();
}

export function deactivate() {
    console.log('Sentinel Analytics Rules extension deactivated');
}