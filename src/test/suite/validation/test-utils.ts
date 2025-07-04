import * as path from 'path';
import * as fs from 'fs';

/**
 * Load a data file from the data directory
 */
export function loadDataFile(filename: string): any {
    const dataPath = path.join(__dirname, '../../../../data', filename);
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

/**
 * Extract MITRE techniques from a MITRE data object
 */
export function extractMitreTechniques(data: any): string[] {
    const techniques: string[] = [];
    if (data.objects) {
        data.objects
            .filter((obj: any) => obj.type === 'attack-pattern')
            .forEach((technique: any) => {
                if (technique.external_references) {
                    const mitreRef = technique.external_references.find(
                        (ref: any) => ref.source_name === 'mitre-attack'
                    );
                    if (mitreRef && mitreRef.external_id) {
                        techniques.push(mitreRef.external_id);
                    }
                }
            });
    }
    return techniques;
}

/**
 * Extract MITRE tactics from a MITRE data object
 */
export function extractMitreTactics(data: any): string[] {
    const tactics: string[] = [];
    if (data.objects) {
        data.objects
            .filter((obj: any) => obj.type === 'x-mitre-tactic')
            .forEach((tactic: any) => {
                if (tactic.name) {
                    tactics.push(tactic.name);
                }
            });
    }
    return tactics;
}

/**
 * Extract connector IDs from connector data
 */
export function extractConnectorIds(connectorData: any): string[] {
    const connectorIds: string[] = [];
    if (connectorData.tablesByConnector) {
        connectorData.tablesByConnector.forEach((connector: any) => {
            if (connector.connectorId) {
                connectorIds.push(connector.connectorId);
            }
        });
    }
    return connectorIds;
}

/**
 * Check if a date is within the last N days
 */
export function isDateWithinDays(dateString: string, days: number): boolean {
    const date = new Date(dateString);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return date > cutoff;
}