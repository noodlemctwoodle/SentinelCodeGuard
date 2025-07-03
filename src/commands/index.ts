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

        // FIXED: Individual GUID regeneration (now supports both editor and explorer context)
        disposables.push(
            vscode.commands.registerCommand('sentinelRules.regenerateGuid', this.regenerateGuid.bind(this))
        );

        // NEW: Bulk GUID regeneration
        disposables.push(
            vscode.commands.registerCommand('sentinelRules.regenerateAllGuids', this.regenerateAllGuids.bind(this))
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
     * FIXED: Regenerate GUID in the current Sentinel rule (works from both editor and explorer context)
     */
    private async regenerateGuid(uri?: vscode.Uri): Promise<void> {
        try {
            let targetFile: vscode.Uri;
            let document: vscode.TextDocument;

            if (uri) {
                // Called from explorer context menu - use the provided URI
                targetFile = uri;
                
                // Validate this is a YAML file
                if (!targetFile.fsPath.match(/\.(yaml|yml)$/)) {
                    vscode.window.showErrorMessage('This command only works on YAML files');
                    return;
                }
                
                // Open the document
                document = await vscode.workspace.openTextDocument(targetFile);
            } else {
                // Called from editor context or command palette - use active editor
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('No active editor found');
                    return;
                }

                document = editor.document;
                targetFile = document.uri;
                
                // Validate this is a YAML file
                if (!document.fileName.match(/\.(yaml|yml)$/)) {
                    vscode.window.showErrorMessage('This command only works on YAML files');
                    return;
                }
            }

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
                    await this.addGuidToFileUri(targetFile);
                }
                return;
            }

            const currentGuid = match[2];
            const indentation = match[1];
            const newGuid = uuidv4();
            
            // Show confirmation dialog with current GUID
            const action = await vscode.window.showWarningMessage(
                `Generate new Rule ID for "${path.basename(targetFile.fsPath)}"?\n\nCurrent ID: ${currentGuid}\nNew ID: ${newGuid}`,
                { modal: true },
                'Generate New ID', 'Cancel'
            );

            if (action === 'Generate New ID') {
                const newText = text.replace(guidRegex, `${indentation}id: ${newGuid}`);
                
                // Write the updated content directly to file
                await vscode.workspace.fs.writeFile(targetFile, Buffer.from(newText, 'utf8'));
                
                vscode.window.showInformationMessage(`Rule ID generated successfully!\nFile: ${path.basename(targetFile.fsPath)}\nNew ID: ${newGuid}`);
            }

        } catch (error) {
            console.error('Error regenerating GUID:', error);
            vscode.window.showErrorMessage(`Failed to regenerate GUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * FIXED: Add GUID field to file using URI (for explorer context)
     */
    private async addGuidToFileUri(fileUri: vscode.Uri): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(fileUri);
            const text = document.getText();
            const newGuid = uuidv4();
            
            // Insert at the beginning of the file
            const newText = `id: ${newGuid}\n${text}`;
            
            // Write the updated content directly to file
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(newText, 'utf8'));
            
            vscode.window.showInformationMessage(`Rule ID added successfully!\nFile: ${path.basename(fileUri.fsPath)}\nNew ID: ${newGuid}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to add GUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Keep existing addGuidToFile method for backward compatibility with editor context
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

    /**
     * NEW: Bulk regenerate GUIDs in all Sentinel YAML files within a specific folder
     */
    private async regenerateAllGuids(uri?: vscode.Uri): Promise<void> {
        try {
            // Determine target folder
            let targetFolder: vscode.Uri;
            
            if (uri && uri.fsPath) {
                // Called from right-click on folder (though this shouldn't happen now)
                targetFolder = uri;
            } else {
                // Called from Command Palette - let user choose folder
                const folderOptions = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    title: 'Select folder to regenerate GUIDs in',
                    defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri
                });

                if (!folderOptions || folderOptions.length === 0) {
                    return; // User cancelled
                }
                targetFolder = folderOptions[0];
            }

            // FIXED: Search for ALL YAML files in the SPECIFIC folder only (not workspace-wide)
            const allYamlFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(targetFolder, '**/*.{yaml,yml}'),
                '**/node_modules/**'
            );

            // Filter for files that contain Sentinel rule content or have sentinel in filename
            const sentinelFiles: vscode.Uri[] = [];
            
            for (const file of allYamlFiles) {
                // Check if filename contains 'sentinel'
                if (file.fsPath.toLowerCase().includes('sentinel')) {
                    sentinelFiles.push(file);
                    continue;
                }
                
                // Check file content for Sentinel rule indicators
                try {
                    const content = await vscode.workspace.fs.readFile(file);
                    const text = Buffer.from(content).toString('utf8');
                    
                    // Look for common Sentinel rule fields
                    const sentinelIndicators = [
                        /^\s*tactics\s*:/m,
                        /^\s*techniques\s*:/m,
                        /^\s*queryFrequency\s*:/m,
                        /^\s*triggerOperator\s*:/m,
                        /^\s*requiredDataConnectors\s*:/m
                    ];
                    
                    const hasSentinelFields = sentinelIndicators.some(regex => regex.test(text));
                    if (hasSentinelFields) {
                        sentinelFiles.push(file);
                    }
                } catch (error) {
                    // Skip files that can't be read
                    console.log(`Skipping file ${file.fsPath}: ${error}`);
                }
            }

            if (sentinelFiles.length === 0) {
                vscode.window.showInformationMessage(
                    `No Sentinel rule files found in the folder:\n${path.basename(targetFolder.fsPath)}\n\nLooking for YAML files with Sentinel rule fields (tactics, techniques, queryFrequency, etc.) or files with "sentinel" in the filename.`
                );
                return;
            }

            // FIXED: Check which files actually have GUIDs before showing confirmation
            const filesWithGuids: vscode.Uri[] = [];
            for (const file of sentinelFiles) {
                try {
                    const content = await vscode.workspace.fs.readFile(file);
                    const text = Buffer.from(content).toString('utf8');
                    const guidRegex = /^(\s*)id:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|\{\{GUID\}\})/im;
                    
                    if (guidRegex.test(text)) {
                        filesWithGuids.push(file);
                    }
                } catch (error) {
                    console.log(`Error checking GUID in ${file.fsPath}: ${error}`);
                }
            }

            if (filesWithGuids.length === 0) {
                vscode.window.showInformationMessage(
                    `Found ${sentinelFiles.length} Sentinel rule file${sentinelFiles.length === 1 ? '' : 's'} in the folder, but none contain GUIDs to regenerate.`
                );
                return;
            }

            // Show confirmation dialog with accurate counts
            const folderName = path.basename(targetFolder.fsPath);
            const action = await vscode.window.showWarningMessage(
                `Generate new Rule IDs for ${filesWithGuids.length} file${filesWithGuids.length === 1 ? '' : 's'} in folder "${folderName}"?\n\nFiles with IDs: ${filesWithGuids.length}\nTotal Sentinel files: ${sentinelFiles.length}\n\nThis will replace all existing Rule IDs with new ones.`,
                { modal: true },
                'Generate New IDs', 'Cancel'
            );

            if (action !== 'Generate New IDs') {
                return;
            }

            // Process ONLY files with GUIDs
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Generating new Rule IDs in ${folderName}`,
                cancellable: false
            }, async (progress) => {
                let processedFiles = 0;
                let updatedFiles = 0;
                let errors: string[] = [];

                for (const file of filesWithGuids) {
                    try {
                        progress.report({
                            increment: (processedFiles / filesWithGuids.length) * 100,
                            message: `Processing ${path.basename(file.fsPath)}...`
                        });

                        const result = await this.regenerateGuidInFile(file);
                        if (result.updated) {
                            updatedFiles++;
                        }
                        if (result.error) {
                            errors.push(`${path.basename(file.fsPath)}: ${result.error}`);
                        }

                        processedFiles++;
                    } catch (error) {
                        errors.push(`${path.basename(file.fsPath)}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        processedFiles++;
                    }
                }

                progress.report({ increment: 100, message: 'Complete!' });

                // Show summary
                let message = `Processed ${processedFiles} files in "${folderName}". Generated new Rule IDs in ${updatedFiles} files.`;
                
                if (errors.length > 0) {
                    message += `\n\nErrors encountered:\n${errors.join('\n')}`;
                    vscode.window.showWarningMessage(message, 'OK');
                } else {
                    vscode.window.showInformationMessage(message);
                }
            });

        } catch (error) {
            console.error('Error in bulk GUID regeneration:', error);
            vscode.window.showErrorMessage(`Failed to regenerate GUIDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Helper: Regenerate GUID in a specific file
     */
    private async regenerateGuidInFile(fileUri: vscode.Uri): Promise<{ updated: boolean; error?: string }> {
        try {
            const document = await vscode.workspace.openTextDocument(fileUri);
            const text = document.getText();
            
            const guidRegex = /^(\s*)id:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|\{\{GUID\}\})/im;
            const match = text.match(guidRegex);

            if (!match) {
                return { updated: false, error: 'No GUID found' };
            }

            const indentation = match[1];
            const newGuid = uuidv4();
            const newText = text.replace(guidRegex, `${indentation}id: ${newGuid}`);
            
            // Write the updated content
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(newText, 'utf8'));
            
            return { updated: true };

        } catch (error) {
            return { updated: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
}

interface TemplateTypeOption extends vscode.QuickPickItem {
    templateKey: string;
    defaultFilename: string;
    displayName: string;
}