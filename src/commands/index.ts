import * as vscode from 'vscode';
import * as path from 'path';
import { SentinelRuleFormatter } from '../formatting/formatter';
import { SentinelRuleValidator } from '../validation/validator';
import { ArmToYamlConverter, ConversionOptions } from '../conversion/armToYamlConverter';

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

        // ARM to YAML conversion commands
        disposables.push(
            vscode.commands.registerCommand('sentinelRules.convertArmToYaml', (uri?: vscode.Uri) => 
                this.convertArmToYaml(uri))
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
            
            // Explicitly set language to YAML to prevent auto-detection of custom language
            await vscode.languages.setTextDocumentLanguage(document, 'yaml');
            
            await vscode.window.showTextDocument(document);
            vscode.window.showInformationMessage(`New ${defaultFilename} template created!`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create template: ${error}`);
        }
    }

    private async convertArmToYaml(uri?: vscode.Uri): Promise<void> {
        try {
            let sourceFile: vscode.Uri;

            // Determine source file
            if (uri && uri.fsPath.endsWith('.json')) {
                sourceFile = uri;
            } else {
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor && activeEditor.document.fileName.endsWith('.json')) {
                    sourceFile = activeEditor.document.uri;
                } else {
                    // Show file picker
                    const selectedFiles = await vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: false,
                        filters: {
                            'JSON files': ['json']
                        },
                        title: 'Select ARM Template to Convert'
                    });

                    if (!selectedFiles || selectedFiles.length === 0) {
                        return;
                    }
                    sourceFile = selectedFiles[0];
                }
            }

            // Read and validate the ARM template
            const armContent = await vscode.workspace.fs.readFile(sourceFile);
            const armString = Buffer.from(armContent).toString('utf8');

            if (!ArmToYamlConverter.isValidArmTemplate(armString)) {
                vscode.window.showErrorMessage('Selected file does not contain a valid ARM template with Sentinel Analytics Rules.');
                return;
            }

            // Get conversion options from configuration
            const config = vscode.workspace.getConfiguration('sentinelRules.conversion');
            const options: Partial<ConversionOptions> = {
                namingStrategy: config.get('defaultNamingStrategy', 'displayName'),
                validateMitre: config.get('validateMitreOnConversion', true),
                autoFormat: config.get('autoFormatAfterConversion', true),
                includeOptionalFields: config.get('includeOptionalFields', true),
                preserveQueryFormatting: config.get('preserveQueryFormatting', true),
                defaultVersion: config.get('defaultVersion', '1.0.0'),
                defaultStatus: config.get('defaultStatus', 'Available')
            };

            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Converting ARM Template to YAML',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Parsing ARM template...' });

                // Perform conversion
                const result = await ArmToYamlConverter.convertArmToYaml(armString, options);

                progress.report({ increment: 50, message: 'Generating YAML files...' });

                if (!result.overallSuccess) {
                    const errors = result.results.flatMap(r => r.errors).join('\n');
                    vscode.window.showErrorMessage(`Conversion failed: ${errors}`);
                    return;
                }

                // Determine output directory
                const outputDir = config.get('outputDirectory', '') || path.dirname(sourceFile.fsPath);
                
                // Create YAML files
                let openedFiles = 0;
                for (const conversionResult of result.results) {
                    if (conversionResult.success && conversionResult.yamlContent && conversionResult.fileName) {
                        const yamlPath = path.join(outputDir, conversionResult.fileName);
                        const yamlUri = vscode.Uri.file(yamlPath);
                        
                        await vscode.workspace.fs.writeFile(yamlUri, Buffer.from(conversionResult.yamlContent, 'utf8'));
                        
                        // Open the first file automatically
                        if (openedFiles === 0) {
                            const document = await vscode.workspace.openTextDocument(yamlUri);
                            await vscode.window.showTextDocument(document);
                            openedFiles++;
                        }
                    }
                }

                progress.report({ increment: 100, message: 'Conversion complete!' });

                // Show summary
                const warnings = result.results.flatMap(r => r.warnings);
                let summaryMessage = `Successfully converted ${result.successfulConversions} of ${result.totalRules} rules.`;
                
                if (warnings.length > 0) {
                    summaryMessage += `\n\nWarnings:\n${warnings.join('\n')}`;
                    if (config.get('showConversionSummary', true)) {
                        vscode.window.showWarningMessage(summaryMessage, 'OK');
                    }
                } else {
                    vscode.window.showInformationMessage(summaryMessage);
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to convert ARM template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}