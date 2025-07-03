import * as vscode from 'vscode';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid'; // Already imported
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

        // NEW: Enhanced template creation command
        disposables.push(
            vscode.commands.registerCommand('sentinelRules.createSentinelRule', this.createSentinelRuleWorkflow.bind(this))
        );

        // Keep existing commands for backward compatibility
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

        // NEW: Regenerate GUID command
        disposables.push(
            vscode.commands.registerCommand('sentinelRules.regenerateGuid', this.regenerateGuid.bind(this))
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

    /**
     * NEW: Regenerate GUID in the current Sentinel rule
     */
    private async regenerateGuid(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        
        // Validate this is a YAML file
        if (!document.fileName.match(/\.(yaml|yml)$/)) {
            vscode.window.showErrorMessage('This command only works on YAML files');
            return;
        }

        try {
            const text = document.getText();
            const guidRegex = /^(\s*)id:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|\{\{GUID\}\})/im;
            const match = text.match(guidRegex);

            if (!match) {
                // No existing GUID found, ask user if they want to add one
                const addGuid = await vscode.window.showWarningMessage(
                    'No GUID found in this file. Would you like to add an ID field at the top?',
                    'Yes', 'No'
                );
                
                if (addGuid === 'Yes') {
                    await this.addGuidToFile(editor);
                }
                return;
            }

            const currentGuid = match[2];
            const indentation = match[1];
            
            // Show confirmation dialog with current GUID
            const action = await vscode.window.showWarningMessage(
                `Replace current GUID?\n\nCurrent: ${currentGuid}\nNew: ${uuidv4()}`,
                { modal: true },
                'Replace GUID', 'Cancel'
            );

            if (action === 'Replace GUID') {
                const newGuid = uuidv4();
                const newText = text.replace(guidRegex, `${indentation}id: ${newGuid}`);
                
                // Apply the change
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(text.length)
                );

                await editor.edit(editBuilder => {
                    editBuilder.replace(fullRange, newText);
                });

                vscode.window.showInformationMessage(`GUID regenerated successfully!\nNew ID: ${newGuid}`);
            }

        } catch (error) {
            console.error('Error regenerating GUID:', error);
            vscode.window.showErrorMessage(`Failed to regenerate GUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Add GUID field to file that doesn't have one
     */
    private async addGuidToFile(editor: vscode.TextEditor): Promise<void> {
        const document = editor.document;
        const text = document.getText();
        const newGuid = uuidv4();
        
        // Insert at the beginning of the file
        const newText = `id: ${newGuid}\n${text}`;
        
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
        );

        await editor.edit(editBuilder => {
            editBuilder.replace(fullRange, newText);
        });

        vscode.window.showInformationMessage(`GUID added successfully!\nNew ID: ${newGuid}`);
    }
}

interface TemplateTypeOption extends vscode.QuickPickItem {
    templateKey: string;
    defaultFilename: string;
    displayName: string;
}