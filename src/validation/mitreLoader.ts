import * as vscode from 'vscode';
import * as path from 'path';

interface MitreTechnique {
    id: string;
    name: string;
    tactics: string[];
}

export class MitreLoader {
    private static techniques: Map<string, MitreTechnique> = new Map();
    private static tactics: Set<string> = new Set();
    private static extensionContext: vscode.ExtensionContext;

    public static setExtensionContext(context: vscode.ExtensionContext) {
        this.extensionContext = context;
    }

    public static async loadMitreData(): Promise<void> {
        try {
            // Load from configuration or remote source
            const config = vscode.workspace.getConfiguration('sentinelRules');
            const mitreVersion = config.get('mitre.version', 'v16');
            
            // Load from embedded JSON file
            await this.loadFromEmbeddedData(mitreVersion);
        } catch (error) {
            console.error('Failed to load MITRE data:', error);
            // Fallback to basic tactics
            this.loadFallbackData();
        }
    }

    private static async loadFromEmbeddedData(version: string): Promise<void> {
        try {
            if (!this.extensionContext) {
                throw new Error('Extension context not set');
            }

            // Use extension context instead of vscode.extensions.getExtension()
            const mitreDataPath = path.join(this.extensionContext.extensionPath, 'data', `mitre-${version}.json`);
            const mitreDataUri = vscode.Uri.file(mitreDataPath);
            
            const data = await vscode.workspace.fs.readFile(mitreDataUri);
            const mitreData = JSON.parse(data.toString());
            
            this.techniques.clear();
            this.tactics.clear();
            
            for (const technique of mitreData.techniques) {
                this.techniques.set(technique.id, technique);
                technique.tactics.forEach((tactic: string) => this.tactics.add(tactic));
            }
            
            console.log(`✅ Loaded ${this.techniques.size} MITRE techniques and ${this.tactics.size} tactics`);
        } catch (error) {
            console.warn('Could not load MITRE data from embedded file, using fallback:', error);
            this.loadFallbackData();
        }
    }

    private static loadFallbackData(): void {
        // Updated fallback tactics for 2025 - based on MITRE ATT&CK v15/v16
        const fallbackTactics = [
            'Reconnaissance',           // TA0043
            'ResourceDevelopment',      // TA0042
            'InitialAccess',           // TA0001
            'Execution',               // TA0002
            'Persistence',             // TA0003
            'PrivilegeEscalation',     // TA0004
            'DefenseEvasion',          // TA0005
            'CredentialAccess',        // TA0006
            'Discovery',               // TA0007
            'LateralMovement',         // TA0008
            'Collection',              // TA0009
            'CommandAndControl',       // TA0011
            'Exfiltration',            // TA0010
            'Impact'                   // TA0040
        ];
        
        this.tactics.clear();
        fallbackTactics.forEach(tactic => this.tactics.add(tactic));
        
        console.log(`Loaded ${fallbackTactics.length} fallback MITRE tactics`);
    }

    public static getValidTactics(): string[] {
        return Array.from(this.tactics);
    }

    public static isValidTechnique(technique: string): boolean {
        return this.techniques.has(technique);
    }

    public static getTechnique(id: string): MitreTechnique | undefined {
        return this.techniques.get(id);
    }

    public static validateTactic(tactic: string): {
        isKnown: boolean;
        isValidFormat: boolean;
        message?: string;
        severity: vscode.DiagnosticSeverity;
    } {
        const config = vscode.workspace.getConfiguration('sentinelRules');
        const allowUnknown = config.get('mitre.allowUnknownTactics', true);
        const strictValidation = config.get('mitre.strictValidation', false);

        const isKnown = this.tactics.has(tactic);
        const isValidFormat = /^[A-Z][a-zA-Z]{2,30}$/.test(tactic);

        if (isKnown) {
            return { isKnown: true, isValidFormat: true, severity: vscode.DiagnosticSeverity.Information };
        }

        if (!isValidFormat) {
            return {
                isKnown: false,
                isValidFormat: false,
                message: `Invalid tactic format '${tactic}'. Expected PascalCase format (e.g., 'InitialAccess').`,
                severity: vscode.DiagnosticSeverity.Error
            };
        }

        if (strictValidation) {
            return {
                isKnown: false,
                isValidFormat: true,
                message: `Unknown tactic '${tactic}'. Strict validation requires tactics to be in loaded MITRE data.`,
                severity: vscode.DiagnosticSeverity.Error
            };
        }

        if (allowUnknown) {
            return {
                isKnown: false,
                isValidFormat: true,
                message: `Tactic '${tactic}' not found in loaded MITRE data. Please verify this is a valid MITRE tactic.`,
                severity: vscode.DiagnosticSeverity.Information
            };
        }

        return {
            isKnown: false,
            isValidFormat: true,
            message: `Unknown tactic '${tactic}'. Consider updating MITRE data or enabling 'allowUnknownTactics'.`,
            severity: vscode.DiagnosticSeverity.Warning
        };
    }

    public static validateTechnique(technique: string): {
        isKnown: boolean;
        isValidFormat: boolean;
        message?: string;
        severity: vscode.DiagnosticSeverity;
    } {
        const config = vscode.workspace.getConfiguration('sentinelRules');
        const allowUnknown = config.get('mitre.allowUnknownTechniques', true);
        const strictValidation = config.get('mitre.strictValidation', false);

        const isKnown = this.techniques.has(technique);
        const isValidFormat = /^T[0-9]{4}(\.[0-9]{3})?$/.test(technique);

        if (isKnown) {
            return { isKnown: true, isValidFormat: true, severity: vscode.DiagnosticSeverity.Information };
        }

        if (!isValidFormat) {
            return {
                isKnown: false,
                isValidFormat: false,
                message: `Invalid technique format '${technique}'. Expected format: T#### or T####.### (e.g., 'T1566.001').`,
                severity: vscode.DiagnosticSeverity.Error
            };
        }

        if (strictValidation) {
            return {
                isKnown: false,
                isValidFormat: true,
                message: `Unknown technique '${technique}'. Strict validation requires techniques to be in loaded MITRE data.`,
                severity: vscode.DiagnosticSeverity.Error
            };
        }

        if (allowUnknown) {
            return {
                isKnown: false,
                isValidFormat: true,
                message: `Technique '${technique}' not found in loaded MITRE data. Please verify this technique ID exists.`,
                severity: vscode.DiagnosticSeverity.Information
            };
        }

        return {
            isKnown: false,
            isValidFormat: true,
            message: `Unknown technique '${technique}'. Consider updating MITRE data or enabling 'allowUnknownTechniques'.`,
            severity: vscode.DiagnosticSeverity.Warning
        };
    }
}