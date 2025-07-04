import * as assert from 'assert';
import { VALIDATION_PATTERNS } from '../../../validation/constants';
import { loadDataFile, extractMitreTechniques, extractMitreTactics, extractConnectorIds } from './test-utils';

suite('Data Integration Tests', () => {
    suite('MITRE Data Validation', () => {
        test('should validate real MITRE techniques from data files', () => {
            try {
                // Load actual MITRE data
                const enterpriseData = loadDataFile('mitre-v16.json');
                const mobileData = loadDataFile('mitre-mobile.json');
                const icsData = loadDataFile('mitre-ics.json');
                
                // Extract techniques from real data
                const enterpriseTechniques = extractMitreTechniques(enterpriseData);
                const mobileTechniques = extractMitreTechniques(mobileData);
                const icsTechniques = extractMitreTechniques(icsData);
                
                const allTechniques = [
                    ...enterpriseTechniques,
                    ...mobileTechniques,
                    ...icsTechniques
                ];
                
                // Debug information
                console.log(`Loaded ${enterpriseTechniques.length} enterprise techniques`);
                console.log(`Loaded ${mobileTechniques.length} mobile techniques`);
                console.log(`Loaded ${icsTechniques.length} ICS techniques`);
                console.log(`Total techniques: ${allTechniques.length}`);
                
                // Test that our regex validates real MITRE techniques
                assert.ok(allTechniques.length > 100, `Should have loaded many real techniques (found ${allTechniques.length})`);
                
                let invalidCount = 0;
                allTechniques.forEach(technique => {
                    if (!VALIDATION_PATTERNS.MITRE_TECHNIQUE.test(technique)) {
                        invalidCount++;
                        if (invalidCount <= 5) { // Log first few invalid techniques
                            console.log(`Invalid technique: ${technique}`);
                        }
                    }
                    assert.ok(
                        VALIDATION_PATTERNS.MITRE_TECHNIQUE.test(technique), 
                        `Real MITRE technique ${technique} should be valid`
                    );
                });
                
                if (invalidCount > 0) {
                    console.log(`Found ${invalidCount} invalid techniques`);
                }
            } catch (error) {
                console.error('Error in MITRE techniques test:', error);
                throw error;
            }
        });

        test('should validate real MITRE tactics from data files', () => {
            try {
                // Load actual MITRE data  
                const enterpriseData = loadDataFile('mitre-v16.json');
                
                // Extract tactics from real data
                const allTactics = extractMitreTactics(enterpriseData);
                
                // Debug information
                console.log(`Loaded ${allTactics.length} tactics`);
                if (allTactics.length > 0) {
                    console.log(`Sample tactics: ${allTactics.slice(0, 5).join(', ')}`);
                }
                
                // Test that our regex validates real MITRE tactics
                assert.ok(allTactics.length > 10, `Should have loaded real tactics (found ${allTactics.length})`);
                
                let invalidCount = 0;
                allTactics.forEach(tactic => {
                    if (!VALIDATION_PATTERNS.TACTIC_NAME.test(tactic)) {
                        invalidCount++;
                        if (invalidCount <= 5) { // Log first few invalid tactics
                            console.log(`Invalid tactic: ${tactic}`);
                        }
                    }
                    assert.ok(
                        VALIDATION_PATTERNS.TACTIC_NAME.test(tactic), 
                        `Real MITRE tactic ${tactic} should be valid`
                    );
                });
                
                if (invalidCount > 0) {
                    console.log(`Found ${invalidCount} invalid tactics`);
                }
            } catch (error) {
                console.error('Error in MITRE tactics test:', error);
                throw error;
            }
        });
    });

    suite('Connector Data Validation', () => {
        test('should validate real connector IDs from data files', () => {
            try {
                // Load actual connector data
                const connectorData = loadDataFile('connectors.json');
                
                // Extract connector IDs from real data
                const allConnectorIds = extractConnectorIds(connectorData);
                
                // Debug information
                console.log(`Loaded ${allConnectorIds.length} connectors`);
                if (allConnectorIds.length > 0) {
                    console.log(`Sample connectors: ${allConnectorIds.slice(0, 5).join(', ')}`);
                }
                
                // Test that our regex validates real connector IDs
                assert.ok(allConnectorIds.length > 50, `Should have loaded many real connectors (found ${allConnectorIds.length})`);
                
                let invalidCount = 0;
                allConnectorIds.forEach(connectorId => {
                    if (!VALIDATION_PATTERNS.CONNECTOR_ID.test(connectorId)) {
                        invalidCount++;
                        if (invalidCount <= 5) { // Log first few invalid connectors
                            console.log(`Invalid connector ID: ${connectorId}`);
                        }
                    }
                    assert.ok(
                        VALIDATION_PATTERNS.CONNECTOR_ID.test(connectorId), 
                        `Real connector ID ${connectorId} should be valid`
                    );
                });
                
                if (invalidCount > 0) {
                    console.log(`Found ${invalidCount} invalid connector IDs`);
                }
            } catch (error) {
                console.error('Error in connector validation test:', error);
                throw error;
            }
        });
    });

    suite('Data Completeness', () => {
        test('should reflect real data completeness', () => {
            try {
                // Load real data to verify our constants are comprehensive
                const connectorData = loadDataFile('connectors.json');
                const enterpriseData = loadDataFile('mitre-v16.json');
                
                // Check that we have reasonable coverage
                const realConnectorCount = connectorData.tablesByConnector?.length || 0;
                const realTechniqueCount = enterpriseData.objects?.filter(
                    (obj: any) => obj.type === 'attack-pattern'
                ).length || 0;
                
                console.log(`Found ${realConnectorCount} connectors and ${realTechniqueCount} techniques`);
                
                assert.ok(realConnectorCount > 100, `Should have many real connectors (found ${realConnectorCount})`);
                assert.ok(realTechniqueCount > 500, `Should have many real techniques (found ${realTechniqueCount})`);
            } catch (error) {
                console.error('Error in data completeness test:', error);
                throw error;
            }
        });
    });

    suite('Data Integrity', () => {
        test('should validate data file integrity and format', () => {
            try {
                // Verify that our data files have the expected structure
                const connectorData = loadDataFile('connectors.json');
                const enterpriseData = loadDataFile('mitre-v16.json');
                
                // Connector data structure
                assert.ok(connectorData.tablesByConnector, 'Connector data should have tablesByConnector');
                assert.ok(connectorData.metadata, 'Connector data should have metadata');
                assert.ok(Array.isArray(connectorData.tablesByConnector), 'tablesByConnector should be array');
                
                // MITRE data structure  
                assert.ok(enterpriseData.objects, 'MITRE data should have objects array');
                assert.ok(Array.isArray(enterpriseData.objects), 'MITRE objects should be array');
                
                // Sample connector structure
                if (connectorData.tablesByConnector.length > 0) {
                    const sampleConnector = connectorData.tablesByConnector[0];
                    assert.ok(sampleConnector.connectorId, 'Connector should have connectorId');
                    assert.ok(sampleConnector.connectorTitle, 'Connector should have connectorTitle');
                }
                
                // Sample MITRE technique structure
                const techniques = enterpriseData.objects.filter((obj: any) => obj.type === 'attack-pattern');
                if (techniques.length > 0) {
                    const sampleTechnique = techniques[0];
                    assert.ok(sampleTechnique.external_references, 'Technique should have external_references');
                }
                
                console.log('Data integrity validation passed');
            } catch (error) {
                console.error('Error in data integrity test:', error);
                throw error;
            }
        });
    });
});