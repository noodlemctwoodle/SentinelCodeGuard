import * as assert from 'assert';
import { VALIDATION_PATTERNS } from '../../../validation/constants';
import { loadDataFile, extractMitreTechniques, extractMitreTactics, extractConnectorIds } from './test-utils';

suite('Data Integration Tests', () => {
    suite('MITRE Data Validation', () => {
        test('should validate real MITRE techniques from data files', () => {
            // Load actual MITRE data
            const enterpriseData = loadDataFile('mitre-v16.json');
            const mobileData = loadDataFile('mitre-mobile.json');
            const icsData = loadDataFile('mitre-ics.json');
            
            // Extract techniques from real data
            const allTechniques = [
                ...extractMitreTechniques(enterpriseData),
                ...extractMitreTechniques(mobileData),
                ...extractMitreTechniques(icsData)
            ];
            
            // Test that our regex validates real MITRE techniques
            assert.ok(allTechniques.length > 100, 'Should have loaded many real techniques');
            
            allTechniques.forEach(technique => {
                assert.ok(
                    VALIDATION_PATTERNS.MITRE_TECHNIQUE.test(technique), 
                    `Real MITRE technique ${technique} should be valid`
                );
            });
        });

        test('should validate real MITRE tactics from data files', () => {
            // Load actual MITRE data  
            const enterpriseData = loadDataFile('mitre-v16.json');
            
            // Extract tactics from real data
            const allTactics = extractMitreTactics(enterpriseData);
            
            // Test that our regex validates real MITRE tactics
            assert.ok(allTactics.length > 10, 'Should have loaded real tactics');
            
            allTactics.forEach(tactic => {
                assert.ok(
                    VALIDATION_PATTERNS.TACTIC_NAME.test(tactic), 
                    `Real MITRE tactic ${tactic} should be valid`
                );
            });
        });
    });

    suite('Connector Data Validation', () => {
        test('should validate real connector IDs from data files', () => {
            // Load actual connector data
            const connectorData = loadDataFile('connectors.json');
            
            // Extract connector IDs from real data
            const allConnectorIds = extractConnectorIds(connectorData);
            
            // Test that our regex validates real connector IDs
            assert.ok(allConnectorIds.length > 50, 'Should have loaded many real connectors');
            
            allConnectorIds.forEach(connectorId => {
                assert.ok(
                    VALIDATION_PATTERNS.CONNECTOR_ID.test(connectorId), 
                    `Real connector ID ${connectorId} should be valid`
                );
            });
        });
    });

    suite('Data Completeness', () => {
        test('should reflect real data completeness', () => {
            // Load real data to verify our constants are comprehensive
            const connectorData = loadDataFile('connectors.json');
            const enterpriseData = loadDataFile('mitre-v16.json');
            
            // Check that we have reasonable coverage
            const realConnectorCount = connectorData.tablesByConnector?.length || 0;
            const realTechniqueCount = enterpriseData.objects?.filter(
                (obj: any) => obj.type === 'attack-pattern'
            ).length || 0;
            
            assert.ok(realConnectorCount > 100, `Should have many real connectors (found ${realConnectorCount})`);
            assert.ok(realTechniqueCount > 500, `Should have many real techniques (found ${realTechniqueCount})`);
        });
    });

    suite('Data Integrity', () => {
        test('should validate data file integrity and format', () => {
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
        });
    });
});