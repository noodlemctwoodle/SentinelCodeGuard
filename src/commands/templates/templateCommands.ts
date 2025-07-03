import * as vscode from 'vscode';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BaseCommand } from '../base/baseCommand';
import { TemplateTypeOption } from './templateTypes';
import { SentinelRuleFormatter } from '../../formatting/formatter';

export class TemplateCommands extends BaseCommand {
    public registerCommands(): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        // Enhanced template creation command
        disposables.push(
            vscode.commands.registerCommand('sentinelRules.createSentinelRule', this.createSentinelRuleWorkflow.bind(this))
        );

        // Legacy template commands for backward compatibility
        disposables.push(
            vscode.commands.registerCommand('sentinelRules.generateTemplate', (uri?: vscode.Uri) => 
                this.generateTemplate('standard-rule', 'standard_sentinel_rule.yaml', uri))
        );

        disposables.push(
            vscode.commands.registerCommand('sentinelRules.generateAdvancedTemplate', (uri?: vscode.Uri) => 
                this.generateTemplate('advanced-rule', 'advanced_sentinel_rule.yaml', uri))
        );

        disposables.push(
            vscode.commands.registerCommand('sentinelRules.generateNRTTemplate', (uri?: vscode.Uri) => 
                this.generateTemplate('nrt-rule', 'nrt_sentinel_rule.yaml', uri))
        );

        disposables.push(
            vscode.commands.registerCommand('sentinelRules.generateBehaviorAnalyticsTemplate', (uri?: vscode.Uri) => 
                this.generateTemplate('behavior-analytics-rule', 'anomaly_sentinel_rule.yaml', uri))
        );

        disposables.push(
            vscode.commands.registerCommand('sentinelRules.generateMinimalTemplate', (uri?: vscode.Uri) => 
                this.generateTemplate('minimal-rule', 'minimal_sentinel_rule.yaml', uri))
        );

        return disposables;
    }

    private async generateTemplate(templateName: string, defaultFilename: string, uri?: vscode.Uri): Promise<void> {
        const template = await SentinelRuleFormatter.loadTemplate(templateName);
        await this.createTemplateFile(template, defaultFilename, uri);
    }

    /**
     * NEW: Enhanced workflow for creating Sentinel rule templates
     */
    private async createSentinelRuleWorkflow(uri?: vscode.Uri): Promise<void> {
        try {
            // Step 1: Prompt for template type
            const templateType = await this.promptForTemplateType();
            if (!templateType) {
                return; // User cancelled
            }

            // Step 2: Determine initial save location
            const defaultLocation = uri?.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            
            // Step 3: Prompt for save location
            const saveLocation = await this.promptForSaveLocation(defaultLocation, templateType.defaultFilename);
            if (!saveLocation) {
                return; // User cancelled
            }

            // Step 4: Generate template
            await this.generateTemplateAtLocation(templateType.templateKey, saveLocation);

            // Step 5: Open the created file
            const document = await vscode.workspace.openTextDocument(saveLocation);
            await vscode.languages.setTextDocumentLanguage(document, 'yaml');
            await vscode.window.showTextDocument(document);

            vscode.window.showInformationMessage(`${templateType.displayName} template created successfully!`);

        } catch (error) {
            console.error('Error creating Sentinel rule template:', error);
            vscode.window.showErrorMessage(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Prompt user to select template type
     */
    private async promptForTemplateType(): Promise<TemplateTypeOption | undefined> {
        const templateOptions: TemplateTypeOption[] = [
            {
                label: "$(file-code) Standard Rule",
                description: "General-purpose detection rule with standard fields",
                detail: "Recommended for most detection scenarios",
                templateKey: "standard-rule",
                defaultFilename: "standard_sentinel_rule.yaml",
                displayName: "Standard Rule"
            },
            {
                label: "$(gear) Advanced Rule",
                description: "Complex multi-stage detection with advanced fields",
                detail: "For sophisticated threat detection scenarios",
                templateKey: "advanced-rule",
                defaultFilename: "advanced_sentinel_rule.yaml",
                displayName: "Advanced Rule"
            },
            {
                label: "$(clock) Near Real-Time (NRT) Rule",
                description: "Low-latency alerting for immediate threats",
                detail: "For time-sensitive detections (5-minute intervals)",
                templateKey: "nrt-rule",
                defaultFilename: "nrt_sentinel_rule.yaml",
                displayName: "NRT Rule"
            },
            {
                label: "$(graph) Behaviour Analytics Rule",
                description: "Machine learning-based anomaly detection",
                detail: "For detecting unusual patterns and behaviours",
                templateKey: "behavior-analytics-rule",
                defaultFilename: "anomaly_sentinel_rule.yaml",
                displayName: "Behaviour Analytics Rule"
            },
            {
                label: "$(file) Minimal Rule",
                description: "Basic template with essential fields only",
                detail: "Quick start template for simple rules",
                templateKey: "minimal-rule",
                defaultFilename: "minimal_sentinel_rule.yaml",
                displayName: "Minimal Rule"
            },
            {
                label: "$(archive) Fallback Rule",
                description: "Generic fallback template",
                detail: "For edge cases and custom scenarios",
                templateKey: "fallback-rule",
                defaultFilename: "fallback_sentinel_rule.yaml",
                displayName: "Fallback Rule"
            }
        ];

        const selected = await vscode.window.showQuickPick(templateOptions, {
            placeHolder: "Select a Sentinel rule template type",
            matchOnDescription: true,
            matchOnDetail: true,
            ignoreFocusOut: false
        });

        return selected;
    }

    /**
     * Prompt user for save location
     */
    private async promptForSaveLocation(defaultPath?: string, defaultFilename?: string): Promise<string | undefined> {
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: defaultPath ? vscode.Uri.file(path.join(defaultPath, defaultFilename || 'sentinel_rule.yaml')) : undefined,
            filters: {
                'YAML Files': ['yaml', 'yml'],
                'All Files': ['*']
            },
            title: "Save Sentinel Rule Template"
        });

        return saveUri?.fsPath;
    }

    /**
     * Generate template at specific location with GUID replacement
     */
    private async generateTemplateAtLocation(templateKey: string, filePath: string): Promise<void> {
        try {
            const template = await SentinelRuleFormatter.loadTemplate(templateKey);
            
            // Replace {{GUID}} placeholder with actual GUID
            const processedTemplate = template.replace(/\{\{GUID\}\}/g, uuidv4());
            
            await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(processedTemplate, 'utf8'));
        } catch (error) {
            throw new Error(`Failed to load or create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async createTemplateFile(template: string, defaultFilename: string, uri?: vscode.Uri): Promise<void> {
        let targetUri: vscode.Uri;
        if (uri && uri.fsPath) {
            targetUri = vscode.Uri.file(path.join(uri.fsPath, defaultFilename));
        } else {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found');
                return;
            }
            targetUri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, defaultFilename));
        }

        try {
            // Replace {{GUID}} placeholder with actual GUID
            const processedTemplate = template.replace(/\{\{GUID\}\}/g, uuidv4());
            
            await vscode.workspace.fs.writeFile(targetUri, Buffer.from(processedTemplate, 'utf8'));
            const document = await vscode.workspace.openTextDocument(targetUri);
            
            // Explicitly set language to YAML to prevent auto-detection of custom language
            await vscode.languages.setTextDocumentLanguage(document, 'yaml');
            
            await vscode.window.showTextDocument(document);
            vscode.window.showInformationMessage(`New ${defaultFilename} template created with unique GUID!`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create template: ${error}`);
        }
    }
}