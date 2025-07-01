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

// STIX format interfaces for the complete dataset
interface StixObject {
    type: string;
    id: string;
    name?: string;
    description?: string;
    external_references?: Array<{
        source_name: string;
        external_id: string;
    }>;
    kill_chain_phases?: Array<{
        kill_chain_name: string;
        phase_name: string;
    }>;
    x_mitre_is_subtechnique?: boolean;
}

interface StixBundle {
    type: string;
    objects: StixObject[];
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
            // Load from configuration
            const config = vscode.workspace.getConfiguration('sentinelRules');
            const mitreVersion = config.get('mitre.version', 'v16');
            
            // Load the complete STIX dataset
            const loaded = await this.loadFromEmbeddedData(mitreVersion);
            
            if (!loaded) {
                // Only fallback to hardcoded basics if file completely missing
                this.loadFallbackData();
            }
        } catch (error) {
            console.error('Failed to load MITRE data:', error);
            this.loadFallbackData();
        }
    }

    private static async loadFromEmbeddedData(version: string): Promise<boolean> {
        try {
            if (!this.extensionContext) {
                throw new Error('Extension context not set');
            }

            // Load the main MITRE dataset (complete STIX format)
            const mitreDataPath = path.join(this.extensionContext.extensionPath, 'data', `mitre-${version}.json`);
            const mitreDataUri = vscode.Uri.file(mitreDataPath);
            
            const data = await vscode.workspace.fs.readFile(mitreDataUri);
            const stixBundle: StixBundle = JSON.parse(data.toString());
            
            if (stixBundle.type !== 'bundle' || !stixBundle.objects) {
                throw new Error('Invalid STIX bundle format');
            }

            this.techniques.clear();
            this.tactics.clear();
            this.tacticDetails.clear();
            
            // Extract tactics from STIX objects
            const tacticObjects = stixBundle.objects.filter(obj => obj.type === 'x-mitre-tactic');
            for (const tacticObj of tacticObjects) {
                const externalRef = tacticObj.external_references?.find(ref => ref.source_name === 'mitre-attack');
                if (externalRef && tacticObj.name) {
                    const tacticName = this.formatTacticName(tacticObj.name);
                    this.tactics.add(tacticName);
                    this.tacticDetails.set(tacticName, {
                        id: externalRef.external_id,
                        name: tacticName,
                        description: tacticObj.description || ''
                    });
                }
            }

            // Extract techniques from STIX objects
            const techniqueObjects = stixBundle.objects.filter(obj => 
                obj.type === 'attack-pattern' && 
                obj.external_references?.some(ref => ref.source_name === 'mitre-attack')
            );
            
            for (const techniqueObj of techniqueObjects) {
                const externalRef = techniqueObj.external_references?.find(ref => ref.source_name === 'mitre-attack');
                if (externalRef && techniqueObj.name) {
                    const tactics = techniqueObj.kill_chain_phases
                        ?.filter(phase => phase.kill_chain_name === 'mitre-attack')
                        .map(phase => this.formatTacticName(phase.phase_name.replace(/-/g, ' '))) || [];

                    const isSubTechnique = techniqueObj.x_mitre_is_subtechnique === true;
                    const techniqueId = externalRef.external_id;
                    
                    this.techniques.set(techniqueId, {
                        id: techniqueId,
                        name: techniqueObj.name,
                        tactics: tactics,
                        description: techniqueObj.description,
                        parent: isSubTechnique ? techniqueId.split('.')[0] : undefined
                    });

                    // Add tactics to the tactics set if not already present
                    tactics.forEach(tactic => {
                        if (!this.tactics.has(tactic)) {
                            this.tactics.add(tactic);
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

            console.log(`✅ Loaded complete MITRE ATT&CK dataset: ${this.tactics.size} tactics, ${this.techniques.size} techniques`);
            return true;

        } catch (error) {
            console.error('Failed to load MITRE dataset:', error);
            return false;
        }
    }

    private static formatTacticName(tacticName: string): string {
        // Convert tactic names to Sentinel format
        // "initial-access" -> "InitialAccess"
        // "privilege-escalation" -> "PrivilegeEscalation"
        return tacticName
            .split(/[-\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }

    private static loadFallbackData() {
        console.log('⚠️  Loading minimal fallback MITRE data...');
        
        // Minimal fallback tactics from MITRE ATT&CK framework
        const fallbackTactics = [
            'Reconnaissance', 'ResourceDevelopment', 'InitialAccess', 'Execution', 
            'Persistence', 'PrivilegeEscalation', 'DefenseEvasion', 'CredentialAccess',
            'Discovery', 'LateralMovement', 'Collection', 'CommandAndControl', 
            'Exfiltration', 'Impact'
        ];
        
        this.tactics.clear();
        this.tacticDetails.clear();
        this.techniques.clear();
        
        fallbackTactics.forEach(tactic => {
            this.tactics.add(tactic);
            this.tacticDetails.set(tactic, {
                id: '',
                name: tactic,
                description: `MITRE ATT&CK Tactic: ${tactic}`
            });
        });
        
        console.log(`Loaded ${fallbackTactics.length} fallback tactics (techniques unavailable)`);
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