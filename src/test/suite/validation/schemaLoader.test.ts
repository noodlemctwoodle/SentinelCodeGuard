import * as assert from 'assert';
import * as vscode from 'vscode';
import { SchemaLoader } from '../../../validation/schemaLoader';

suite('SchemaLoader Tests', () => {
    suiteSetup(async () => {
        // Create a mock extension context for testing
        const mockContext = {
            extensionPath: process.cwd() // Use current working directory for tests
        } as vscode.ExtensionContext;
        
        SchemaLoader.setExtensionContext(mockContext);
        await SchemaLoader.loadSchema();
    });

    test('Should load schema successfully', () => {
        // Test that schema is loaded by checking if getter methods work
        const severities = SchemaLoader.getValidSeverities();
        const entityTypes = SchemaLoader.getValidEntityTypes();
        const requiredFields = SchemaLoader.getRequiredFields();
        const triggerOperators = SchemaLoader.getValidTriggerOperators();

        assert.ok(Array.isArray(severities), 'Should return array of severities');
        assert.ok(Array.isArray(entityTypes), 'Should return array of entity types');
        assert.ok(Array.isArray(requiredFields), 'Should return array of required fields');
        assert.ok(Array.isArray(triggerOperators), 'Should return array of trigger operators');

        assert.ok(severities.length > 0, 'Should have severities');
        assert.ok(entityTypes.length > 0, 'Should have entity types');
        assert.ok(requiredFields.length > 0, 'Should have required fields');
        assert.ok(triggerOperators.length > 0, 'Should have trigger operators');
    });

    test('Should provide expected severities from schema', () => {
        const severities = SchemaLoader.getValidSeverities();
        const expectedSeverities = ['Informational', 'Low', 'Medium', 'High'];
        
        expectedSeverities.forEach(severity => {
            assert.ok(severities.includes(severity), `Should include ${severity} severity`);
        });
    });

    test('Should provide expected trigger operators from schema', () => {
        const operators = SchemaLoader.getValidTriggerOperators();
        const expectedOperators = ['gt', 'lt', 'eq', 'ne'];
        
        expectedOperators.forEach(operator => {
            assert.ok(operators.includes(operator), `Should include ${operator} operator`);
        });
    });

    test('Should provide expected entity types from schema', () => {
        const entityTypes = SchemaLoader.getValidEntityTypes();
        const expectedEntityTypes = ['Account', 'Host', 'IP', 'File', 'Process'];
        
        expectedEntityTypes.forEach(entityType => {
            assert.ok(entityTypes.includes(entityType), `Should include ${entityType} entity type`);
        });
    });

    test('Should provide validation patterns from schema', () => {
        // Test individual patterns
        assert.ok(SchemaLoader.hasValidationPattern('id'), 'Should have GUID pattern');
        assert.ok(SchemaLoader.hasValidationPattern('queryFrequency'), 'Should have ISO_DURATION pattern');
        assert.ok(SchemaLoader.hasValidationPattern('version'), 'Should have VERSION pattern');
        
        // Test that patterns are RegExp objects
        const guidPattern = SchemaLoader.getValidationPattern('id');
        const durationPattern = SchemaLoader.getValidationPattern('queryFrequency');
        const versionPattern = SchemaLoader.getValidationPattern('version');
        
        assert.ok(guidPattern instanceof RegExp, 'GUID pattern should be RegExp');
        assert.ok(durationPattern instanceof RegExp, 'ISO_DURATION pattern should be RegExp');
        assert.ok(versionPattern instanceof RegExp, 'VERSION pattern should be RegExp');
    });

    test('Should provide required fields from schema', () => {
        const requiredFields = SchemaLoader.getRequiredFields();
        const expectedRequiredFields = ['name', 'description', 'severity', 'query'];
        
        expectedRequiredFields.forEach(field => {
            assert.ok(requiredFields.includes(field), `Should include ${field} as required field`);
        });
    });

    test('Should provide field order from schema', () => {
        const fieldOrder = SchemaLoader.getFieldOrder();
        
        assert.ok(Array.isArray(fieldOrder), 'Field order should be an array');
        assert.ok(fieldOrder.length > 0, 'Field order should not be empty');
        
        // Test that essential fields are in the order
        const essentialFields = ['name', 'description', 'severity'];
        essentialFields.forEach(field => {
            assert.ok(fieldOrder.includes(field), `Field order should include ${field}`);
        });
    });

    test('Should provide duration fields from schema', () => {
        const durationFields = SchemaLoader.getDurationFields();
        
        assert.ok(Array.isArray(durationFields), 'Duration fields should be an array');
        
        // Test that common duration fields are included
        const expectedDurationFields = ['queryFrequency', 'queryPeriod'];
        expectedDurationFields.forEach(field => {
            assert.ok(durationFields.includes(field), `Should include ${field} as duration field`);
        });
    });

    test('Should fail gracefully when extension context is not set', async () => {
        // Create a new SchemaLoader instance to test error handling
        class TestSchemaLoader extends SchemaLoader {
            public static async testLoadWithoutContext(): Promise<void> {
                // Reset context
                (this as any).extensionContext = null;
                await this.loadSchema();
            }
        }

        await assert.rejects(
            TestSchemaLoader.testLoadWithoutContext(),
            /Extension context not set/,
            'Should throw error when extension context is not set'
        );
    });
});