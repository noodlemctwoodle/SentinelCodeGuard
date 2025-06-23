import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Expected field order for Sentinel Analytics Rules
const EXPECTED_ORDER = [
    'id', 'name', 'description', 'severity', 'requiredDataConnectors',
    'queryFrequency', 'queryPeriod', 'triggerOperator', 'triggerThreshold',
    'status', 'tactics', 'techniques', 'relevantTechniques', 'tags',
    'query', 'entityMappings', 'incidentConfiguration', 'eventGroupingSettings',
    'suppressionDuration', 'suppressionEnabled', 'alertDetailsOverride',
    'customDetails', 'version', 'kind'
];

const REQUIRED_FIELDS = [
    'id', 'name', 'description', 'severity', 'requiredDataConnectors',
    'queryFrequency', 'queryPeriod', 'triggerOperator', 'triggerThreshold',
    'tactics', 'query', 'entityMappings', 'version', 'kind'
];

const VALID_TACTICS = [
    'InitialAccess', 'Execution', 'Persistence', 'PrivilegeEscalation',
    'DefenseEvasion', 'CredentialAccess', 'Discovery', 'LateralMovement',
    'Collection', 'CommandAndControl', 'Exfiltration', 'Impact',
    'ResourceDevelopment', 'Reconnaissance'
];

const VALID_SEVERITIES = ['Informational', 'Low', 'Medium', 'High'];

interface ValidationResult {
    errors: vscode.Diagnostic[];
    warnings: vscode.Diagnostic[];
}

class SentinelRuleValidator {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('sentinel-rules');
    }

    public validateDocument(document: vscode.TextDocument): ValidationResult {
        const errors: vscode.Diagnostic[] = [];
        const warnings: vscode.Diagnostic[] = [];

        try {
            const content = document.getText();
            const lines = content.split('\n');
            
            // Parse YAML
            let parsedYaml: any;
            try {
                parsedYaml = yaml.load(content);
            } catch (yamlError: any) {
                const line = yamlError.mark?.line || 0;
                const character = yamlError.mark?.column || 0;
                errors.push(new vscode.Diagnostic(
                    new vscode.Range(line, character, line, character + 10),
                    `YAML Syntax Error: ${yamlError.message}`,
                    vscode.DiagnosticSeverity.Error
                ));
                return { errors, warnings };
            }

            if (!parsedYaml || typeof parsedYaml !== 'object') {
                errors.push(new vscode.Diagnostic(
                    new vscode.Range(0, 0, 0, 0),
                    'Invalid YAML: Document must be an object',
                    vscode.DiagnosticSeverity.Error
                ));
                return { errors, warnings };
            }

            // Validate required fields
            this.validateRequiredFields(parsedYaml, errors, lines);
            
            // Validate field order
            this.validateFieldOrder(lines, errors, warnings);
            
            // Validate field content
            this.validateFieldContent(parsedYaml, errors, warnings, lines);

        } catch (error) {
            errors.push(new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 0),
                `Validation error: ${error}`,
                vscode.DiagnosticSeverity.Error
            ));
        }

        return { errors, warnings };
    }

    private validateRequiredFields(data: any, errors: vscode.Diagnostic[], lines: string[]) {
        for (const field of REQUIRED_FIELDS) {
            if (!(field in data)) {
                const lineNum = this.findFieldLine(lines, field);
                errors.push(new vscode.Diagnostic(
                    new vscode.Range(lineNum, 0, lineNum, 0),
                    `Missing required field: '${field}'`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }
    }

    private validateFieldOrder(lines: string[], errors: vscode.Diagnostic[], _warnings: vscode.Diagnostic[]) {
        const fieldPositions: { [key: string]: number } = {};
        const actualOrder: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('#') && line.includes(':')) {
                const fieldName = line.split(':')[0].trim().replace(/^-\s*/, '');
                if (EXPECTED_ORDER.includes(fieldName)) {
                    fieldPositions[fieldName] = i;
                    actualOrder.push(fieldName);
                }
            }
        }

        // Check order - compare consecutive fields that are both present
        for (let i = 0; i < actualOrder.length - 1; i++) {
            const currentField = actualOrder[i];
            const nextField = actualOrder[i + 1];
            const currentExpectedIndex = EXPECTED_ORDER.indexOf(currentField);
            const nextExpectedIndex = EXPECTED_ORDER.indexOf(nextField);

            // Only flag as error if the next field should come before the current field
            if (currentExpectedIndex > nextExpectedIndex) {
                const lineNum = fieldPositions[nextField];
                const range = new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0);
                
                errors.push(new vscode.Diagnostic(
                    range,
                    `Field '${nextField}' is out of order. Should come before '${currentField}'. Expected position: ${nextExpectedIndex + 1}, Current position: ${i + 2}`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }
    }

    private validateFieldContent(data: any, errors: vscode.Diagnostic[], warnings: vscode.Diagnostic[], lines: string[]) {
        // Validate GUID format
        if (data.id && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(data.id)) {
            const lineNum = this.findFieldLine(lines, 'id');
            errors.push(new vscode.Diagnostic(
                new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                `Invalid GUID format for 'id' field. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`,
                vscode.DiagnosticSeverity.Error
            ));
        }

        // Validate description - check length and provide best practice suggestions
        if (data.description) {
            const description = data.description.trim();
            const lineNum = this.findFieldLine(lines, 'description');
            
            // Check for minimum length
            if (description.length < 10) {
                warnings.push(new vscode.Diagnostic(
                    new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                    `Description is too short. Consider adding more detail about what this rule detects.`,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
            
            // Check for maximum length (Sentinel has a practical limit)
            if (description.length > 5000) {
                errors.push(new vscode.Diagnostic(
                    new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                    `Description is too long (${description.length} characters). Maximum recommended length is 5000 characters.`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
            
            // Best practice suggestion (informational only)
            if (description.length > 500) {
                warnings.push(new vscode.Diagnostic(
                    new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                    `Description is quite long (${description.length} characters). Consider keeping it concise for better readability.`,
                    vscode.DiagnosticSeverity.Information
                ));
            }
            
            // Optional: Suggest good starting phrases (but don't enforce)
            const startsWithGoodPhrase = /^(Identifies|This query searches for|Detects|Monitors|Alerts when|Triggers when|Looks for|Finds)/i.test(description);
            if (!startsWithGoodPhrase && description.length > 20) {
                // Only show this as an information hint, not a warning
                warnings.push(new vscode.Diagnostic(
                    new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                    `Best practice: Consider starting with action words like 'Identifies', 'Detects', 'Monitors', etc. for clarity.`,
                    vscode.DiagnosticSeverity.Information
                ));
            }
        }

        // Validate severity
        if (data.severity && !VALID_SEVERITIES.includes(data.severity)) {
            const lineNum = this.findFieldLine(lines, 'severity');
            errors.push(new vscode.Diagnostic(
                new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                `Invalid severity '${data.severity}'. Must be one of: ${VALID_SEVERITIES.join(', ')}`,
                vscode.DiagnosticSeverity.Error
            ));
        }

        // Validate tactics
        if (data.tactics && Array.isArray(data.tactics)) {
            for (const tactic of data.tactics) {
                if (!VALID_TACTICS.includes(tactic)) {
                    const lineNum = this.findFieldLine(lines, 'tactics');
                    errors.push(new vscode.Diagnostic(
                        new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                        `Invalid tactic '${tactic}'. Valid tactics: ${VALID_TACTICS.join(', ')}`,
                        vscode.DiagnosticSeverity.Error
                    ));
                }
            }
        }

        // Validate techniques
        if (data.techniques && Array.isArray(data.techniques)) {
            for (const technique of data.techniques) {
                if (!/^T[0-9]{4}(\.[0-9]{3})?$/.test(technique)) {
                    const lineNum = this.findFieldLine(lines, 'techniques');
                    errors.push(new vscode.Diagnostic(
                        new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                        `Invalid technique format '${technique}'. Must be T#### or T####.### (e.g., T1078 or T1078.001)`,
                        vscode.DiagnosticSeverity.Error
                    ));
                }
            }
        }

        // Validate version
        if (data.version && !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(data.version)) {
            const lineNum = this.findFieldLine(lines, 'version');
            errors.push(new vscode.Diagnostic(
                new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                `Invalid version format '${data.version}'. Must be semantic version (e.g., 1.0.0)`,
                vscode.DiagnosticSeverity.Error
            ));
        }

        // Validate entity mappings
        if (!data.entityMappings || !Array.isArray(data.entityMappings) || data.entityMappings.length === 0) {
            const lineNum = this.findFieldLine(lines, 'entityMappings');
            errors.push(new vscode.Diagnostic(
                new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                `At least one entity mapping is required`,
                vscode.DiagnosticSeverity.Error
            ));
        }

        // Validate required data connectors
        if (data.requiredDataConnectors && Array.isArray(data.requiredDataConnectors)) {
            for (const connector of data.requiredDataConnectors) {
                // Check if connectorId exists and is not empty
                if (!connector.connectorId || typeof connector.connectorId !== 'string' || connector.connectorId.trim() === '') {
                    const lineNum = this.findFieldLine(lines, 'requiredDataConnectors');
                    errors.push(new vscode.Diagnostic(
                        new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                        'Connector ID is required and cannot be empty',
                        vscode.DiagnosticSeverity.Error
                    ));
                }

                // Check for basic format (optional warning for best practices)
                if (connector.connectorId && !/^[A-Za-z][A-Za-z0-9]*$/.test(connector.connectorId)) {
                    const lineNum = this.findFieldLine(lines, 'requiredDataConnectors');
                    warnings.push(new vscode.Diagnostic(
                        new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                        `Connector ID '${connector.connectorId}' should use alphanumeric characters only, starting with a letter`,
                        vscode.DiagnosticSeverity.Warning
                    ));
                }

                // Validate dataTypes array
                if (!connector.dataTypes || !Array.isArray(connector.dataTypes) || connector.dataTypes.length === 0) {
                    const lineNum = this.findFieldLine(lines, 'requiredDataConnectors');
                    errors.push(new vscode.Diagnostic(
                        new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                        'Each data connector must specify at least one data type',
                        vscode.DiagnosticSeverity.Error
                    ));
                } else {
                    // Check for empty data types
                    for (const dataType of connector.dataTypes) {
                        if (!dataType || typeof dataType !== 'string' || dataType.trim() === '') {
                            const lineNum = this.findFieldLine(lines, 'requiredDataConnectors');
                            errors.push(new vscode.Diagnostic(
                                new vscode.Range(lineNum, 0, lineNum, lines[lineNum]?.length || 0),
                                'Data type names cannot be empty',
                                vscode.DiagnosticSeverity.Error
                            ));
                        }
                    }
                }
            }
        }
    }

    private findFieldLine(lines: string[], fieldName: string): number {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith(`${fieldName}:`)) {
                return i;
            }
        }
        return 0; // Default to first line if field not found
    }

    public updateDiagnostics(document: vscode.TextDocument) {
        if (this.isSentinelRule(document)) {
            const { errors, warnings } = this.validateDocument(document);
            this.diagnosticCollection.set(document.uri, [...errors, ...warnings]);
        }
    }

    private isSentinelRule(document: vscode.TextDocument): boolean {
        return document.fileName.endsWith('.sentinel.yaml') || 
               document.fileName.endsWith('.sentinel.yml') ||
               (document.languageId === 'yaml' && document.fileName.includes('sentinel'));
    }

    public dispose() {
        this.diagnosticCollection.dispose();
    }
}

class SentinelRuleFormatter {
    private static readonly REQUIRED_FIELDS: Record<string, () => any> = {
        'id': () => uuidv4(),
        'name': () => 'New Detection Rule',
        'description': () => 'Enter rule description here',
        'severity': () => 'Medium',
        'requiredDataConnectors': () => [{
            connectorId: 'Enter connector ID',
            dataTypes: ['Enter data type']
        }],
        'queryFrequency': () => 'PT5M',
        'queryPeriod': () => 'PT5M',
        'triggerOperator': () => 'gt',
        'triggerThreshold': () => 0,
        'tactics': () => ['Enter MITRE ATT&CK tactic'],
        'query': () => '// Enter your KQL query here\nSecurityEvent\n| take 10'
    };

    private static extensionContext: vscode.ExtensionContext;

    public static setExtensionContext(context: vscode.ExtensionContext) {
        this.extensionContext = context;
    }

    public static async loadTemplate(templateName: string): Promise<string> {
        try {
            if (!this.extensionContext) {
                throw new Error('Extension context not set');
            }
            
            const templatePath = path.join(this.extensionContext.extensionPath, 'templates', `${templateName}.template.yaml`);
            const templateContent = await vscode.workspace.fs.readFile(vscode.Uri.file(templatePath));
            const template = Buffer.from(templateContent).toString('utf8');
            
            // Replace placeholder with actual GUID
            const newId = uuidv4();
            return template.replace('{{GUID}}', newId);
        } catch (error) {
            console.error(`Template file not found: ${templateName}`, error);
            
            // Try to load fallback template
            try {
                const fallbackPath = path.join(this.extensionContext.extensionPath, 'templates', 'fallback-rule.template.yaml');
                const fallbackContent = await vscode.workspace.fs.readFile(vscode.Uri.file(fallbackPath));
                const fallbackTemplate = Buffer.from(fallbackContent).toString('utf8');
                
                const newId = uuidv4();
                vscode.window.showWarningMessage(`Template '${templateName}' not found. Using fallback template.`);
                return fallbackTemplate.replace('{{GUID}}', newId);
            } catch (fallbackError) {
                console.error('Fallback template also not found', fallbackError);
                vscode.window.showErrorMessage(`Failed to load template '${templateName}' and fallback template. Please check that template files exist in the templates folder.`);
                
                // Return empty string or throw error - no more hardcoded templates
                throw new Error(`No templates available: ${templateName} and fallback both failed`);
            }
        }
    }

    public static formatDocument(document: vscode.TextDocument): vscode.TextEdit[] {
        try {
            const content = document.getText();
            const parsedYaml = yaml.load(content) as Record<string, any>;
            
            if (!parsedYaml || typeof parsedYaml !== 'object') {
                return [];
            }

            // Preserve original query formatting if it exists
            const originalQuery = parsedYaml.query;
            const missingFieldsAdded: string[] = [];
            
            // Reorder fields and add missing required ones
            const orderedRule: Record<string, any> = {};
            
            for (const field of EXPECTED_ORDER) {
                if (field === 'query') continue; // Handle separately
                
                if (field in parsedYaml) {
                    // Use existing value
                    orderedRule[field] = parsedYaml[field];
                } else if (this.REQUIRED_FIELDS[field]) {
                    // Add missing required field with default value
                    orderedRule[field] = this.REQUIRED_FIELDS[field]();
                    missingFieldsAdded.push(field);
                }
            }

            // Add any existing fields that aren't in expected order (except query)
            for (const [key, value] of Object.entries(parsedYaml)) {
                if (!(key in orderedRule) && key !== 'query') {
                    orderedRule[key] = value;
                }
            }

            // Convert to YAML without the query first
            let formattedYaml = yaml.dump(orderedRule, {
                indent: 2,
                lineWidth: -1,  // No line wrapping
                quotingType: '"',
                forceQuotes: false,
                sortKeys: false,
                flowLevel: -1,  // Always use block style
            });

            // Now handle the query with proper formatting
            let queryToUse = originalQuery;
            if (!queryToUse) {
                // Add default query if missing
                queryToUse = this.REQUIRED_FIELDS['query']();
                missingFieldsAdded.push('query');
            }

            if (queryToUse && typeof queryToUse === 'string') {
                // Clean up the query but preserve its structure
                const cleanQuery = queryToUse
                    .split('\n')
                    .map(line => line.trimEnd())  // Remove trailing whitespace
                    .join('\n')
                    .replace(/\n{3,}/g, '\n\n')  // Replace multiple empty lines with max 2
                    .trim(); // Remove leading/trailing empty lines
                
                // Format as literal block with proper indentation
                const formattedQuery = cleanQuery
                    .split('\n')
                    .map(line => line ? `  ${line}` : '')
                    .join('\n');
                
                const properQuery = `query: |\n${formattedQuery}`;
                
                // Find the correct position to insert the query
                const lines = formattedYaml.split('\n');
                const queryIndex = EXPECTED_ORDER.indexOf('query');
                
                if (queryIndex !== -1) {
                    // Find where to insert the query based on field order
                    let insertAfterField = '';
                    for (let i = queryIndex - 1; i >= 0; i--) {
                        const field = EXPECTED_ORDER[i];
                        if (field in orderedRule || (this.REQUIRED_FIELDS[field] && missingFieldsAdded.includes(field))) {
                            insertAfterField = field;
                            break;
                        }
                    }
                    
                    if (insertAfterField) {
                        // Find the line after this field and insert query there
                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i].startsWith(`${insertAfterField}:`)) {
                                // Skip to end of this field's content
                                let j = i + 1;
                                while (j < lines.length && (lines[j].startsWith('  ') || lines[j].startsWith('- ') || lines[j].trim() === '')) {
                                    j++;
                                }
                                // Insert query here
                                lines.splice(j, 0, properQuery);
                                break;
                            }
                        }
                    } else {
                        // Insert at the beginning
                        lines.splice(0, 0, properQuery);
                    }
                } else {
                    // Append at the end
                    lines.push(properQuery);
                }
                
                formattedYaml = lines.join('\n');
            }

            // Add header
            let header = `# Microsoft Sentinel Analytics Rule\n\n`;
            
            // Add informational comment if fields were added
            if (missingFieldsAdded.length > 0) {
                header += `# Missing required fields added: ${missingFieldsAdded.join(', ')}\n`;
                header += `# Please review and update the placeholder values below\n\n`;
            }

            const finalContent = header + formattedYaml;

            // Show user feedback about what was done
            if (missingFieldsAdded.length > 0) {
                vscode.window.showInformationMessage(
                    `Formatted rule and added ${missingFieldsAdded.length} missing required field(s): ${missingFieldsAdded.join(', ')}`
                );
            }

            return [vscode.TextEdit.replace(
                new vscode.Range(0, 0, document.lineCount, 0),
                finalContent
            )];

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to format document: ${error}`);
            return [];
        }
    }

    private static formatYamlString(yamlString: string): string {
        // Basic formatting: ensure single space after colons, sort keys, etc.
        return yamlString
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
    }
}

// Add this at the end of the file (after all the class definitions):

export function activate(context: vscode.ExtensionContext) {
    console.log('Sentinel Analytics Rules extension is now active!');

    // Create validator instance
    const validator = new SentinelRuleValidator();

    // Set the extension context for the formatter (needed for template loading)
    SentinelRuleFormatter.setExtensionContext(context);

    // Document change listener
    const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
        validator.updateDiagnostics(event.document);
    });

    // Document save listener  
    const documentSaveListener = vscode.workspace.onDidSaveTextDocument((document) => {
        validator.updateDiagnostics(document);
    });

    // Document open listener
    const documentOpenListener = vscode.workspace.onDidOpenTextDocument((document) => {
        validator.updateDiagnostics(document);
    });

    // Command: Validate Rule
    const validateCommand = vscode.commands.registerCommand('sentinelRules.validateRule', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            validator.updateDiagnostics(editor.document);
            vscode.window.showInformationMessage('Sentinel rule validation completed');
        }
    });

    // Command: Fix Field Order
    const fixOrderCommand = vscode.commands.registerCommand('sentinelRules.fixFieldOrder', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const edits = SentinelRuleFormatter.formatDocument(editor.document);
        if (edits.length > 0) {
            await editor.edit(editBuilder => {
                for (const edit of edits) {
                    editBuilder.replace(edit.range, edit.newText);
                }
            });
            vscode.window.showInformationMessage('Field order fixed successfully');
        }
    });

    // Command: Format Sentinel Rule
    const formatRuleCommand = vscode.commands.registerCommand('sentinelRules.formatRule', () => {
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
    });

    // Template generation commands
    const generateTemplateCommand = vscode.commands.registerCommand('sentinelRules.generateTemplate', async (uri?: vscode.Uri) => {
        const template = await SentinelRuleFormatter.loadTemplate('standard-rule');
        await createTemplateFile(template, 'standard-rule.sentinel.yaml', uri);
    });

    const generateAdvancedTemplateCommand = vscode.commands.registerCommand('sentinelRules.generateAdvancedTemplate', async (uri?: vscode.Uri) => {
        const template = await SentinelRuleFormatter.loadTemplate('advanced-rule');
        await createTemplateFile(template, 'advanced-rule.sentinel.yaml', uri);
    });

    const generateNRTTemplateCommand = vscode.commands.registerCommand('sentinelRules.generateNRTTemplate', async (uri?: vscode.Uri) => {
        const template = await SentinelRuleFormatter.loadTemplate('nrt-rule');
        await createTemplateFile(template, 'nrt-rule.sentinel.yaml', uri);
    });

    const generateBehaviorAnalyticsTemplateCommand = vscode.commands.registerCommand('sentinelRules.generateBehaviorAnalyticsTemplate', async (uri?: vscode.Uri) => {
        const template = await SentinelRuleFormatter.loadTemplate('behavior-analytics-rule');
        await createTemplateFile(template, 'behavior-analytics-rule.sentinel.yaml', uri);
    });

    // Helper function for creating template files
    async function createTemplateFile(template: string, defaultFilename: string, uri?: vscode.Uri) {
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

    // Register document formatter
    const formatterProvider = vscode.languages.registerDocumentFormattingEditProvider(
        { scheme: 'file', pattern: '**/*.sentinel.{yaml,yml}' },
        {
            provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                return SentinelRuleFormatter.formatDocument(document);
            }
        }
    );

    // Add to context subscriptions
    context.subscriptions.push(
        validator,
        documentChangeListener,
        documentSaveListener,
        documentOpenListener,
        validateCommand,
        fixOrderCommand,
        formatRuleCommand,
        generateTemplateCommand,
        generateAdvancedTemplateCommand,
        generateNRTTemplateCommand,
        generateBehaviorAnalyticsTemplateCommand,
        formatterProvider
    );

    // Validate open documents on activation
    vscode.workspace.textDocuments.forEach((document: vscode.TextDocument) => {
        validator.updateDiagnostics(document);
    });
}

export function deactivate() {
    console.log('Sentinel Analytics Rules extension deactivated');
}