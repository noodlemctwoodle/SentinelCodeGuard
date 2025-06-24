import * as vscode from 'vscode';
import * as path from 'path';

interface ConnectorInfo {
    id: string;
    displayName: string;
    dataTypes: string[];
    category?: string;
    deprecated?: boolean;
}

export class ConnectorLoader {
    private static connectors: Map<string, ConnectorInfo> = new Map();
    private static extensionContext: vscode.ExtensionContext;

    public static setExtensionContext(context: vscode.ExtensionContext) {
        this.extensionContext = context;
    }

    public static async loadConnectorData(): Promise<void> {
        try {
            await this.loadFromEmbeddedData();
        } catch (error) {
            console.error('Failed to load connector data:', error);
            this.loadFallbackData();
        }
    }

    private static async loadFromEmbeddedData(): Promise<void> {
        try {
            if (!this.extensionContext) {
                throw new Error('Extension context not set');
            }

            // Use extension context instead of vscode.extensions.getExtension()
            const connectorDataPath = path.join(this.extensionContext.extensionPath, 'data', 'connectors.json');
            const connectorDataUri = vscode.Uri.file(connectorDataPath);
            
            const data = await vscode.workspace.fs.readFile(connectorDataUri);
            const connectorData = JSON.parse(data.toString());
            
            this.connectors.clear();
            
            for (const connector of connectorData.connectors) {
                this.connectors.set(connector.id, connector);
            }
            
            console.log(`✅ Loaded ${this.connectors.size} connector definitions`);
        } catch (error) {
            console.warn('Could not load connector data from embedded file, using fallback:', error);
            this.loadFallbackData();
        }
    }

    private static loadFallbackData() {
        // Fallback logic to load connector data
        console.log('Loading fallback connector data...');
        // For example, load some default connectors or handle the error gracefully
    }

    private static async loadFromWorkspace(): Promise<void> {
        // Look for connector definitions in workspace
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return;

        for (const folder of workspaceFolders) {
            try {
                // Look for .sentinel-connectors.json in workspace
                const connectorFile = vscode.Uri.joinPath(folder.uri, '.sentinel-connectors.json');
                const data = await vscode.workspace.fs.readFile(connectorFile);
                const connectorData = JSON.parse(data.toString());
                
                for (const connector of connectorData.connectors || []) {
                    this.connectors.set(connector.id, connector);
                }
                
                console.log(`Loaded workspace-specific connectors from ${folder.name}`);
            } catch {
                // No workspace connector file found, that's ok
            }
        }
    }

    private static async loadCustomConnectors(): Promise<void> {
        const config = vscode.workspace.getConfiguration('sentinelRules');
        const customConnectors = config.get<string[]>('connectors.customConnectors', []);
        
        for (const connectorId of customConnectors) {
            if (!this.connectors.has(connectorId)) {
                this.connectors.set(connectorId, {
                    id: connectorId,
                    displayName: connectorId,
                    dataTypes: [],
                    category: 'custom'
                });
            }
        }
    }

    public static getValidationMode(): 'strict' | 'workspace' | 'permissive' {
        const config = vscode.workspace.getConfiguration('sentinelRules');
        return config.get<'strict' | 'workspace' | 'permissive'>('connectors.validationMode', 'permissive');
    }

    public static validateConnector(connectorId: string): {
        isValid: boolean;
        message?: string;
        severity: vscode.DiagnosticSeverity;
    } {
        const mode = this.getValidationMode();
        
        switch (mode) {
            case 'strict':
                if (this.connectors.has(connectorId)) {
                    return { isValid: true, severity: vscode.DiagnosticSeverity.Information };
                } else {
                    return {
                        isValid: false,
                        message: `Unknown connector '${connectorId}'. In strict mode, only known connectors are allowed.`,
                        severity: vscode.DiagnosticSeverity.Error
                    };
                }
                
            case 'workspace':
                if (this.connectors.has(connectorId)) {
                    return { isValid: true, severity: vscode.DiagnosticSeverity.Information };
                } else {
                    return {
                        isValid: false,
                        message: `Connector '${connectorId}' not found in workspace definitions. Add to .sentinel-connectors.json or settings.`,
                        severity: vscode.DiagnosticSeverity.Warning
                    };
                }
                
            case 'permissive':
            default:
                // Only validate format - any non-empty string is valid
                if (!connectorId || connectorId.trim() === '') {
                    return {
                        isValid: false,
                        message: 'Connector ID cannot be empty',
                        severity: vscode.DiagnosticSeverity.Error
                    };
                }
                
                // Basic format check
                if (!/^[A-Za-z][A-Za-z0-9]*$/.test(connectorId)) {
                    return {
                        isValid: false,
                        message: `Connector ID '${connectorId}' should use alphanumeric characters only, starting with a letter`,
                        severity: vscode.DiagnosticSeverity.Warning
                    };
                }
                
                return { isValid: true, severity: vscode.DiagnosticSeverity.Information };
        }
    }

    public static getConnectorInfo(connectorId: string): ConnectorInfo | undefined {
        return this.connectors.get(connectorId);
    }

    public static getAllConnectors(): ConnectorInfo[] {
        return Array.from(this.connectors.values());
    }

    public static getConnectorSuggestions(partial: string): string[] {
        const suggestions = Array.from(this.connectors.keys())
            .filter(id => id.toLowerCase().includes(partial.toLowerCase()))
            .slice(0, 10); // Limit suggestions
            
        return suggestions;
    }
}