import * as assert from 'assert';
import { loadDataFile, isDateWithinDays } from './test-utils';

suite('Data Freshness Tests', () => {
    test('should have recent connector data with expected metadata', () => {
        const connectorData = loadDataFile('connectors.json');
        
        // Check metadata exists and is recent
        assert.ok(connectorData.metadata, 'Connector data should have metadata');
        assert.ok(connectorData.metadata.generatedDate, 'Should have generation date');
        
        // Parse the date and ensure it's not too old (within last 30 days)
        assert.ok(isDateWithinDays(connectorData.metadata.generatedDate, 30), 
            `Connector data is old (${connectorData.metadata.generatedDate}), should be updated`
        );
        
        // Check connector count is reasonable
        assert.ok(connectorData.metadata.totalConnectors >= 300, 
            'Should have at least 300 connectors'
        );
    });

    test('should have comprehensive MITRE data coverage', () => {
        const enterpriseData = loadDataFile('mitre-v16.json');
        
        // Should have comprehensive technique coverage
        const techniques = enterpriseData.objects.filter((obj: any) => obj.type === 'attack-pattern');
        const tactics = enterpriseData.objects.filter((obj: any) => obj.type === 'x-mitre-tactic');
        
        assert.ok(techniques.length >= 500, `Should have many techniques (found ${techniques.length})`);
        assert.ok(tactics.length >= 10, `Should have multiple tactics (found ${tactics.length})`);
        
        // Check for well-known tactics
        const tacticNames = tactics.map((t: any) => t.name);
        const expectedTactics = ['Initial Access', 'Execution', 'Persistence', 'Defense Evasion'];
        
        expectedTactics.forEach(expectedTactic => {
            assert.ok(tacticNames.includes(expectedTactic), 
                `Should include expected tactic: ${expectedTactic}`
            );
        });
    });

    test('should have reasonable data loading performance', () => {
        const start = Date.now();
        
        // Load all data files
        const connectorData = loadDataFile('connectors.json');
        const enterpriseData = loadDataFile('mitre-v16.json');
        const _mobileData = loadDataFile('mitre-mobile.json');  // Prefixed with underscore to indicate intentionally unused
        const _icsData = loadDataFile('mitre-ics.json');        // Prefixed with underscore to indicate intentionally unused
        
        const loadTime = Date.now() - start;
        
        // Should load data reasonably quickly (adjust threshold as needed)
        assert.ok(loadTime < 2000, `Data loading took ${loadTime}ms, should be under 2000ms`);
        
        // Verify we actually loaded substantial data
        assert.ok(connectorData.tablesByConnector.length > 100, 'Should load many connectors');
        assert.ok(enterpriseData.objects.length > 1000, 'Should load many MITRE objects');
    });
});