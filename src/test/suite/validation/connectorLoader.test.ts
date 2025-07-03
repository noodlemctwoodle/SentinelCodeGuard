import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConnectorLoader } from '../../../validation/connectorLoader';

suite('ConnectorLoader Tests', () => {
    suiteSetup(async () => {
        // Create a mock extension context for testing
        const mockContext = {
            extensionPath: process.cwd() // Use current working directory for tests
        } as vscode.ExtensionContext;
        
        ConnectorLoader.setExtensionContext(mockContext);
        await ConnectorLoader.loadConnectorData();
    });

    test('Should load connectors from data/connectors.json', () => {
        const allConnectors = ConnectorLoader.getAllConnectors();
        assert.ok(Array.isArray(allConnectors), 'Should return array of connectors');
        assert.ok(allConnectors.length > 0, 'Should have loaded connectors');
        
        // Test that we have some expected connectors
        const connectorIds = allConnectors.map(c => c.id);
        assert.ok(connectorIds.some(id => id.includes('Darktrace')), 'Should include Darktrace connectors');
        assert.ok(connectorIds.some(id => id.includes('Microsoft')), 'Should include Microsoft connectors');
    });

    test('Should validate known connectors correctly', () => {
        const validation = ConnectorLoader.validateConnector('Darktrace');
        assert.strictEqual(validation.isValid, true, 'Known connector should be valid');
    });

    test('Should validate connector data types correctly', () => {
        const validation = ConnectorLoader.validateDataConnector({
            connectorId: 'Darktrace',
            dataTypes: ['CommonSecurityLog']
        });
        
        assert.strictEqual(validation.isValid, true, 'Valid connector and data type should pass');
        assert.ok(validation.dataTypeValidation.validDataTypes.length > 0, 'Should have valid data types');
    });

    test('Should detect invalid data types', () => {
        const validation = ConnectorLoader.validateDataConnector({
            connectorId: 'Darktrace',
            dataTypes: ['InvalidTableName']
        });
        
        assert.ok(validation.dataTypeValidation.invalidDataTypes.length > 0, 'Should detect invalid data types');
    });

    test('Should provide connector suggestions', () => {
        const suggestions = ConnectorLoader.getConnectorSuggestions('Dark');
        assert.ok(Array.isArray(suggestions), 'Should return array of suggestions');
        assert.ok(suggestions.some(s => s.includes('Darktrace')), 'Should suggest Darktrace connectors');
    });
});