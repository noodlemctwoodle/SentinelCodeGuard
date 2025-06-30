import * as vscode from 'vscode';
import * as path from 'path';

interface MitreTechnique {
    id: string;
    name: string;
    tactics: string[];
    description?: string;
    parent?: string;
}

interface MitreTactic {
    id: string;
    name: string;
    description: string;
}

export class MitreLoader {
    private static techniques: Map<string, MitreTechnique> = new Map();
    private static tactics: Set<string> = new Set();
    private static tacticDetails: Map<string, MitreTactic> = new Map();
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
            this.tacticDetails.clear();
            
            // Load tactics from the tactics array first (primary source)
            if (mitreData.tactics && Array.isArray(mitreData.tactics)) {
                for (const tactic of mitreData.tactics) {
                    if (tactic.name) {
                        this.tactics.add(tactic.name);
                        this.tacticDetails.set(tactic.name, {
                            id: tactic.id,
                            name: tactic.name,
                            description: tactic.description || ''
                        });
                    }
                }
                console.log(`Loaded ${this.tactics.size} tactics from tactics array`);
            }
            
            // Load techniques and extract additional tactics
            if (mitreData.techniques && Array.isArray(mitreData.techniques)) {
                for (const technique of mitreData.techniques) {
                    if (technique.id && technique.name && Array.isArray(technique.tactics)) {
                        this.techniques.set(technique.id, {
                            id: technique.id,
                            name: technique.name,
                            tactics: technique.tactics,
                            description: technique.description,
                            parent: technique.parent
                        });
                        
                        // Also collect tactics from techniques as secondary source
                        technique.tactics.forEach((tactic: string) => {
                            if (!this.tactics.has(tactic)) {
                                this.tactics.add(tactic);
                                // Add basic tactic info if not already loaded
                                if (!this.tacticDetails.has(tactic)) {
                                    this.tacticDetails.set(tactic, {
                                        id: '',
                                        name: tactic,
                                        description: `MITRE ATT&CK Tactic: ${tactic}`
                                    });
                                }
                            }
                        });
                    }
                }
                console.log(`Loaded ${this.techniques.size} techniques`);
            }
            
            console.log(`✅ MITRE data loaded: ${this.techniques.size} techniques, ${this.tactics.size} tactics`);
        } catch (error) {
            console.error('Failed to parse MITRE data:', error);
            throw error;
        }
    }

    private static loadFallbackData() {
        console.log('Loading fallback MITRE data...');
        
        // Fallback tactics from MITRE ATT&CK framework
        const fallbackTactics = [
            'Reconnaissance', 'ResourceDevelopment', 'InitialAccess', 'Execution', 
            'Persistence', 'PrivilegeEscalation', 'DefenseEvasion', 'CredentialAccess',
            'Discovery', 'LateralMovement', 'Collection', 'CommandAndControl', 
            'Exfiltration', 'Impact'
        ];
        
        this.tactics.clear();
        this.tacticDetails.clear();
        fallbackTactics.forEach(tactic => {
            this.tactics.add(tactic);
            this.tacticDetails.set(tactic, {
                id: '',
                name: tactic,
                description: `MITRE ATT&CK Tactic: ${tactic}`
            });
        });
        
        console.log(`Loaded ${fallbackTactics.length} fallback MITRE tactics`);
    }

    public static getValidTactics(): string[] {
        return Array.from(this.tactics);
    }

    public static getAllTactics(): MitreTactic[] {
        return Array.from(this.tacticDetails.values());
    }

    public static getAllTechniques(): MitreTechnique[] {
        return Array.from(this.techniques.values());
    }

    public static getTechniquesForTactic(tactic: string): MitreTechnique[] {
        return Array.from(this.techniques.values()).filter(technique => 
            technique.tactics.includes(tactic)
        );
    }

    public static isValidTechnique(technique: string): boolean {
        return this.techniques.has(technique);
    }

    public static getTechnique(id: string): MitreTechnique | undefined {
        return this.techniques.get(id);
    }

    public static getTacticDetails(name: string): MitreTactic | undefined {
        return this.tacticDetails.get(name);
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
                message: `Tactic '${tactic}' has invalid format. Should start with uppercase letter and contain only letters.`,
                severity: vscode.DiagnosticSeverity.Error
            };
        }

        if (strictValidation) {
            return {
                isKnown: false,
                isValidFormat: true,
                message: `Unknown tactic '${tactic}'. Enable 'Allow Unknown Tactics' or use a known MITRE tactic.`,
                severity: vscode.DiagnosticSeverity.Error
            };
        }

        if (!allowUnknown) {
            return {
                isKnown: false,
                isValidFormat: true,
                message: `Unknown tactic '${tactic}'. Consider using a known MITRE tactic.`,
                severity: vscode.DiagnosticSeverity.Warning
            };
        }

        return {
            isKnown: false,
            isValidFormat: true,
            message: `Custom tactic '${tactic}' (not in MITRE ATT&CK framework)`,
            severity: vscode.DiagnosticSeverity.Information
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
        const isValidFormat = /^T\d{4}(\.\d{3})?$/.test(technique);

        if (isKnown) {
            return { isKnown: true, isValidFormat: true, severity: vscode.DiagnosticSeverity.Information };
        }

        if (!isValidFormat) {
            return {
                isKnown: false,
                isValidFormat: false,
                message: `Technique '${technique}' has invalid format. Should be T#### or T####.### (e.g., T1566 or T1566.001)`,
                severity: vscode.DiagnosticSeverity.Error
            };
        }

        if (strictValidation) {
            return {
                isKnown: false,
                isValidFormat: true,
                message: `Unknown technique '${technique}'. Enable 'Allow Unknown Techniques' or use a known MITRE technique.`,
                severity: vscode.DiagnosticSeverity.Error
            };
        }

        if (!allowUnknown) {
            return {
                isKnown: false,
                isValidFormat: true,
                message: `Unknown technique '${technique}'. Consider using a known MITRE technique.`,
                severity: vscode.DiagnosticSeverity.Warning
            };
        }

        return {
            isKnown: false,
            isValidFormat: true,
            message: `Custom technique '${technique}' (not in MITRE ATT&CK framework)`,
            severity: vscode.DiagnosticSeverity.Information
        };
    }
}