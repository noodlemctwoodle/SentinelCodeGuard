import * as vscode from 'vscode';
import * as path from 'path';
import { SentinelRuleFormatter } from '../formatting/formatter';
import { SentinelRuleValidator } from '../validation/validator';

export class CommandManager {
    private context: vscode.ExtensionContext;
    private validator: SentinelRuleValidator;

    constructor(context: vscode.ExtensionContext, validator: SentinelRuleValidator) {
        this.context = context;
        this.validator = validator;
    }

    public registerCommands(): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        // Command: Fix Field Order
        disposables.push(
            vscode.commands.registerCommand('sentinelRules.fixFieldOrder', this.fixFieldOrder.bind(this))
        );

        // Command: Format Sentinel Rule
        disposables.push(
            vscode.commands.registerCommand('sentinelRules.formatRule', this.formatRule.bind(this))
        );

        // Template generation commands
        disposables.push(
            vscode.commands.registerCommand('sentinelRules.generateTemplate', (uri?: vscode.Uri) => 
                this.generateTemplate('standard-rule', 'standard-rule.sentinel.yaml', uri))
        );

        disposables.push(
            vscode.commands.registerCommand('sentinelRules.generateAdvancedTemplate', (uri?: vscode.Uri) => 
                this.generateTemplate('advanced-rule', 'advanced-rule.sentinel.yaml', uri))
        );

        disposables.push(
            vscode.commands.registerCommand('sentinelRules.generateNRTTemplate', (uri?: vscode.Uri) => 
                this.generateTemplate('nrt-rule', 'nrt-rule.sentinel.yaml', uri))
        );

        disposables.push(
            vscode.commands.registerCommand('sentinelRules.generateBehaviorAnalyticsTemplate', (uri?: vscode.Uri) => 
                this.generateTemplate('behavior-analytics-rule', 'behavior-analytics-rule.sentinel.yaml', uri))
        );

        disposables.push(
            vscode.commands.registerCommand('sentinelRules.generateMinimalTemplate', (uri?: vscode.Uri) => 
                this.generateTemplate('minimal-rule', 'minimal-rule.sentinel.yaml', uri))
        );

        // Command: Validate All Workspace Rules
        disposables.push(
            vscode.commands.registerCommand('sentinelRules.validateWorkspace', this.validateWorkspace.bind(this))
        );

        return disposables;
    }

    private async fixFieldOrder(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const edits = SentinelRuleFormatter.reorderFieldsOnly(editor.document);
        if (edits.length > 0) {
            await editor.edit(editBuilder => {
                for (const edit of edits) {
                    editBuilder.replace(edit.range, edit.newText);
                }
            });
        }
    }

    private formatRule(): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        if (!document.fileName.includes('sentinel') || !document.fileName.match(/\.(yaml|yml)$/)) {
            vscode.window.showErrorMessage('This command only works on Sentinel YAML files');
            return;
        }

        // Use the same formatter as the document formatting provider
        const edits = SentinelRuleFormatter.formatDocument(document);
        if (edits.length > 0) {
            editor.edit(editBuilder => {
                for (const edit of edits) {
                    editBuilder.replace(edit.range, edit.newText);
                }
            });
        }
    }

    private async generateTemplate(templateName: string, defaultFilename: string, uri?: vscode.Uri): Promise<void> {
        const template = await SentinelRuleFormatter.loadTemplate(templateName);
        await this.createTemplateFile(template, defaultFilename, uri);
    }

    private async validateWorkspace(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        let totalRules = 0;
        let rulesWithErrors = 0;

        for (const folder of workspaceFolders) {
            const sentinelFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(folder, '**/*.sentinel.{yaml,yml}'),
                '**/node_modules/**'
            );

            for (const file of sentinelFiles) {
                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    const { errors } = this.validator.validateDocument(document);
                    totalRules++;
                    
                    if (errors.length > 0) {
                        rulesWithErrors++;
                    }
                    
                    this.validator.updateDiagnostics(document);
                } catch (error) {
                    console.error(`Error validating ${file.fsPath}:`, error);
                }
            }
        }

        if (totalRules === 0) {
            vscode.window.showInformationMessage('No Sentinel rule files found in workspace');
        } else {
            const message = rulesWithErrors > 0 
                ? `Validated ${totalRules} Sentinel rules. ${rulesWithErrors} rules have validation errors.`
                : `Successfully validated ${totalRules} Sentinel rules. No errors found.`;
            
            vscode.window.showInformationMessage(message);
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
            await vscode.workspace.fs.writeFile(targetUri, Buffer.from(template, 'utf8'));
            const document = await vscode.workspace.openTextDocument(targetUri);
            await vscode.window.showTextDocument(document);
            vscode.window.showInformationMessage(`New ${defaultFilename} template created!`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create template: ${error}`);
        }
    }
}