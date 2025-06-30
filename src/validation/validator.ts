import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import { MitreLoader } from './mitreLoader';
import { ConnectorLoader } from './connectorLoader';
import { 
    VALID_SEVERITIES, 
    VALID_ENTITY_TYPES, 
    EXPECTED_ORDER, 
    REQUIRED_FIELDS,
    VALID_TRIGGER_OPERATORS,
    VALIDATION_PATTERNS,
    SENTINEL_RULE_INDICATORS,
    MIN_SENTINEL_INDICATORS
} from './constants';

export interface ValidationResult {
    errors: vscode.Diagnostic[];
    warnings: vscode.Diagnostic[];
}

export class SentinelRuleValidator {
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
                    new vscode.Range(0, 0, 0, 10),
                    'Invalid YAML structure',
                    vscode.DiagnosticSeverity.Error
                ));
                return { errors, warnings };
            }

            // Validate required fields
            this.validateRequiredFields(parsedYaml, lines, errors);
            
            // Validate field values
            this.validateFieldValues(parsedYaml, lines, errors, warnings);
            
            // Validate field order
            this.validateFieldOrder(parsedYaml, lines, warnings);

        } catch (error) {
            console.error('Validation error:', error);
            errors.push(new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 10),
                `Validation error: ${error}`,
                vscode.DiagnosticSeverity.Error
            ));
        }

        return { errors, warnings };
    }

    private validateRequiredFields(parsedYaml: any, lines: string[], errors: vscode.Diagnostic[]) {
        for (const field of REQUIRED_FIELDS) {
            if (!(field in parsedYaml)) {
                // Add diagnostic at the end of the document
                const lastLine = lines.length - 1;
                errors.push(new vscode.Diagnostic(
                    new vscode.Range(lastLine, 0, lastLine, lines[lastLine]?.length || 0),
                    `Missing required field: ${field}`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }
    }

    private validateFieldValues(parsedYaml: any, lines: string[], errors: vscode.Diagnostic[], warnings: vscode.Diagnostic[]) {
        // Validate severity
        if (parsedYaml.severity && !VALID_SEVERITIES.includes(parsedYaml.severity)) {
            const line = this.findFieldLine(lines, 'severity');
            if (line !== -1) {
                errors.push(new vscode.Diagnostic(
                    new vscode.Range(line, 0, line, lines[line].length),
                    `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }

        // Validate trigger operator
        if (parsedYaml.triggerOperator && !VALID_TRIGGER_OPERATORS.includes(parsedYaml.triggerOperator)) {
            const line = this.findFieldLine(lines, 'triggerOperator');
            if (line !== -1) {
                errors.push(new vscode.Diagnostic(
                    new vscode.Range(line, 0, line, lines[line].length),
                    `Invalid trigger operator. Must be one of: ${VALID_TRIGGER_OPERATORS.join(', ')}`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }

        // Validate duration fields using dynamic patterns
        this.validateDurationFields(parsedYaml, lines, errors);

        // Validate entity types (dynamic validation)
        this.validateEntityTypes(parsedYaml, lines, warnings);

        // Validate MITRE techniques and tactics
        this.validateMitreTechniques(parsedYaml, lines, errors, warnings);

        // Validate data connectors
        this.validateDataConnectors(parsedYaml, lines, warnings);

        // Validate GUID format for id field
        if (parsedYaml.id && !VALIDATION_PATTERNS.GUID.test(parsedYaml.id)) {
            const line = this.findFieldLine(lines, 'id');
            if (line !== -1) {
                errors.push(new vscode.Diagnostic(
                    new vscode.Range(line, 0, line, lines[line].length),
                    'Invalid GUID format for id field',
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }

        // Validate version format
        if (parsedYaml.version && !VALIDATION_PATTERNS.VERSION.test(parsedYaml.version)) {
            const line = this.findFieldLine(lines, 'version');
            if (line !== -1) {
                warnings.push(new vscode.Diagnostic(
                    new vscode.Range(line, 0, line, lines[line].length),
                    'Version should follow semantic versioning (e.g., 1.0.0)',
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }
    }

    private validateDurationFields(parsedYaml: any, lines: string[], errors: vscode.Diagnostic[]) {
        const durationFields = ['queryFrequency', 'queryPeriod', 'suppressionDuration'];
        
        const validateDuration = (obj: any, path: string[] = []) => {
            if (typeof obj !== 'object' || obj === null) {
                return;
            }

            for (const [key, value] of Object.entries(obj)) {
                const currentPath = [...path, key];
                const fieldName = currentPath.join('.');

                if (durationFields.includes(key) && typeof value === 'string') {
                    if (!VALIDATION_PATTERNS.ISO_DURATION.test(value)) {
                        const line = this.findFieldLine(lines, fieldName);
                        if (line !== -1) {
                            errors.push(new vscode.Diagnostic(
                                new vscode.Range(line, 0, line, lines[line].length),
                                `Invalid duration format for ${fieldName}. Must be ISO 8601 format (e.g., PT5M, PT1H, P1D)`,
                                vscode.DiagnosticSeverity.Error
                            ));
                        }
                    }
                } else if (typeof value === 'object' && value !== null) {
                    validateDuration(value, currentPath);
                }
            }
        };

        validateDuration(parsedYaml);
    }

    private validateEntityTypes(parsedYaml: any, lines: string[], warnings: vscode.Diagnostic[]) {
        if (parsedYaml.entityMappings && Array.isArray(parsedYaml.entityMappings)) {
            parsedYaml.entityMappings.forEach((mapping: any, index: number) => {
                if (mapping.entityType && !VALID_ENTITY_TYPES.includes(mapping.entityType)) {
                    const line = this.findFieldLine(lines, `entityMappings[${index}].entityType`, mapping.entityType);
                    if (line !== -1) {
                        warnings.push(new vscode.Diagnostic(
                            new vscode.Range(line, 0, line, lines[line].length),
                            `Unknown entity type: ${mapping.entityType}. Consider checking if this is a custom or new entity type.`,
                            vscode.DiagnosticSeverity.Warning
                        ));
                    }
                }
            });
        }
    }

    private validateMitreTechniques(parsedYaml: any, lines: string[], errors: vscode.Diagnostic[], warnings: vscode.Diagnostic[]) {
        // Validate techniques using the MitreLoader validation methods
        if (parsedYaml.techniques && Array.isArray(parsedYaml.techniques)) {
            parsedYaml.techniques.forEach((technique: string) => {
                const validation = MitreLoader.validateTechnique(technique);
                if (!validation.isValidFormat || (!validation.isKnown && validation.message)) {
                    const line = this.findFieldLine(lines, 'techniques', technique);
                    if (line !== -1) {
                        const diagnostic = new vscode.Diagnostic(
                            new vscode.Range(line, 0, line, lines[line].length),
                            validation.message || `Technique validation failed for: ${technique}`,
                            validation.severity
                        );
                        
                        // Add to appropriate array based on severity
                        if (validation.severity === vscode.DiagnosticSeverity.Error) {
                            errors.push(diagnostic);
                        } else {
                            warnings.push(diagnostic);
                        }
                    }
                }
            });
        }

        // Validate tactics using the MitreLoader validation methods
        if (parsedYaml.tactics && Array.isArray(parsedYaml.tactics)) {
            parsedYaml.tactics.forEach((tactic: string) => {
                const validation = MitreLoader.validateTactic(tactic);
                if (!validation.isValidFormat || (!validation.isKnown && validation.message)) {
                    const line = this.findFieldLine(lines, 'tactics', tactic);
                    if (line !== -1) {
                        const diagnostic = new vscode.Diagnostic(
                            new vscode.Range(line, 0, line, lines[line].length),
                            validation.message || `Tactic validation failed for: ${tactic}`,
                            validation.severity
                        );
                        
                        // Add to appropriate array based on severity
                        if (validation.severity === vscode.DiagnosticSeverity.Error) {
                            errors.push(diagnostic);
                        } else {
                            warnings.push(diagnostic);
                        }
                    }
                }
            });
        }

        // Validate subtechniques (nested in techniques array with dot notation)
        if (parsedYaml.techniques && Array.isArray(parsedYaml.techniques)) {
            parsedYaml.techniques.forEach((technique: string) => {
                // If it's a sub-technique (contains a dot), validate both the main technique and sub-technique
                if (technique.includes('.')) {
                    const [mainTechnique] = technique.split('.');
                    const mainValidation = MitreLoader.validateTechnique(mainTechnique);
                    
                    if (!mainValidation.isValidFormat || (!mainValidation.isKnown && mainValidation.message)) {
                        const line = this.findFieldLine(lines, 'techniques', technique);
                        if (line !== -1) {
                            const diagnostic = new vscode.Diagnostic(
                                new vscode.Range(line, 0, line, lines[line].length),
                                `Parent technique '${mainTechnique}' validation failed: ${mainValidation.message}`,
                                mainValidation.severity
                            );
                            
                            if (mainValidation.severity === vscode.DiagnosticSeverity.Error) {
                                errors.push(diagnostic);
                            } else {
                                warnings.push(diagnostic);
                            }
                        }
                    }
                }
            });
        }
    }

    private validateDataConnectors(parsedYaml: any, lines: string[], warnings: vscode.Diagnostic[]) {
        if (parsedYaml.requiredDataConnectors && Array.isArray(parsedYaml.requiredDataConnectors)) {
            parsedYaml.requiredDataConnectors.forEach((connector: any, index: number) => {
                if (connector.connectorId) {
                    const validation = ConnectorLoader.validateConnector(connector.connectorId);
                    if (!validation.isValid && validation.message) {
                        const line = this.findFieldLine(lines, `requiredDataConnectors[${index}].connectorId`, connector.connectorId);
                        if (line !== -1) {
                            warnings.push(new vscode.Diagnostic(
                                new vscode.Range(line, 0, line, lines[line].length),
                                validation.message,
                                validation.severity || vscode.DiagnosticSeverity.Warning
                            ));
                        }
                    }
                }
            });
        }
    }

    private validateFieldOrder(parsedYaml: any, lines: string[], warnings: vscode.Diagnostic[]) {
        const presentFields = Object.keys(parsedYaml);
        const expectedPresentFields = EXPECTED_ORDER.filter(field => presentFields.includes(field));
        
        let currentIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('#') && line.includes(':')) {
                const fieldName = line.split(':')[0].trim();
                if (expectedPresentFields.includes(fieldName)) {
                    const expectedField = expectedPresentFields[currentIndex];
                    if (fieldName !== expectedField) {
                        warnings.push(new vscode.Diagnostic(
                            new vscode.Range(i, 0, i, line.length),
                            `Field order: '${fieldName}' should come after '${expectedField}' for better consistency`,
                            vscode.DiagnosticSeverity.Information
                        ));
                    }
                    currentIndex++;
                }
            }
        }
    }

    private findFieldLine(lines: string[], fieldPath: string, value?: string): number {
        const parts = fieldPath.split('.');
        let currentLevel = 0;
        let inTargetSection = parts.length === 1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('#') || !trimmedLine) {
                continue;
            }

            const indentation = line.length - line.trimStart().length;
            
            // Handle array items (lines starting with -)
            if (trimmedLine.startsWith('-')) {
                if (inTargetSection && value) {
                    const arrayValue = trimmedLine.substring(1).trim();
                    if (arrayValue.includes(value) || arrayValue === value) {
                        return i;
                    }
                }
                continue;
            }

            const colonIndex = trimmedLine.indexOf(':');
            
            if (colonIndex === -1) {
                continue;
            }

            const fieldName = trimmedLine.substring(0, colonIndex).trim();
            
            // Handle nested field paths
            if (parts.length > 1) {
                if (indentation === 0 && fieldName === parts[0]) {
                    inTargetSection = true;
                    currentLevel = 1;
                    continue;
                } else if (indentation === 0 && fieldName !== parts[0]) {
                    inTargetSection = false;
                    continue;
                }

                if (inTargetSection && currentLevel < parts.length && fieldName === parts[currentLevel]) {
                    currentLevel++;
                    if (currentLevel === parts.length) {
                        if (value) {
                            const lineValue = trimmedLine.substring(colonIndex + 1).trim();
                            if (lineValue.includes(value)) {
                                return i;
                            }
                        } else {
                            return i;
                        }
                    }
                }
            } else {
                // Simple field path
                if (fieldName === fieldPath) {
                    if (value) {
                        const lineValue = trimmedLine.substring(colonIndex + 1).trim();
                        if (lineValue.includes(value)) {
                            return i;
                        }
                    } else {
                        return i;
                    }
                }
            }
        }
        
        return -1;
    }

    public updateDiagnostics(document: vscode.TextDocument): void {
        if (this.isRelevantDocument(document)) {
            const { errors, warnings } = this.validateDocument(document);
            this.diagnosticCollection.set(document.uri, [...errors, ...warnings]);
        } else {
            this.diagnosticCollection.delete(document.uri);
        }
    }

    private isRelevantDocument(document: vscode.TextDocument): boolean {
        // Must be a YAML file
        if (document.languageId !== 'yaml') {
            return false;
        }

        // Quick filename check for obvious Sentinel files (optimization)
        if (document.fileName.includes('sentinel')) {
            return true;
        }

        // Content-based detection for any YAML file
        try {
            const content = document.getText();
            
            // Skip empty or very small files
            if (content.trim().length < 50) {
                return false;
            }

            const parsed = yaml.load(content);
            
            if (!parsed || typeof parsed !== 'object') {
                return false;
            }

            // Count how many Sentinel-specific fields are present
            const indicatorCount = SENTINEL_RULE_INDICATORS.filter(indicator => 
                indicator in parsed
            ).length;

            // If we have enough indicators, it's likely a Sentinel rule
            return indicatorCount >= MIN_SENTINEL_INDICATORS;

        } catch {
            // If YAML parsing fails, not a valid rule anyway
            return false;
        }
    }

    public dispose() {
        this.diagnosticCollection.dispose();
    }
}