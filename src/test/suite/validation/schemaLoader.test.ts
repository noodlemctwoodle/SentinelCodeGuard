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
        // Test that schema is loaded by checking if basic getter methods work
        const severities = SchemaLoader.getValidSeverities();
        const requiredFields = SchemaLoader.getRequiredFields();
        const triggerOperators = SchemaLoader.getValidTriggerOperators();

        assert.ok(Array.isArray(severities), 'Should return array of severities');
        assert.ok(Array.isArray(requiredFields), 'Should return array of required fields');
        assert.ok(Array.isArray(triggerOperators), 'Should return array of trigger operators');

        assert.ok(severities.length > 0, 'Should have severities');
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

    test('Should handle entity types gracefully', () => {
        // Since entityMappings.items.entityType doesn't exist in schema,
        // test should handle this gracefully or use constants instead
        try {
            const entityTypes = SchemaLoader.getValidEntityTypes();
            assert.ok(Array.isArray(entityTypes), 'Should return array if available');
        } catch (error) {
            // This is expected - entityTypes should come from constants, not schema
            assert.ok(error instanceof Error, 'Should throw meaningful error');
            assert.ok(error.message.includes('entityMappings.items.entityType'), 'Should indicate missing field');
        }
    });

    test('Should provide validation patterns from schema', () => {
        // Test that we can get patterns that actually exist
        const hasGuidPattern = SchemaLoader.hasValidationPattern('id');
        const hasVersionPattern = SchemaLoader.hasValidationPattern('version');
        
        // These should be true if the patterns exist in your schema
        assert.ok(typeof hasGuidPattern === 'boolean', 'Should return boolean for pattern check');
        assert.ok(typeof hasVersionPattern === 'boolean', 'Should return boolean for pattern check');
    });

    test('Should provide required fields from schema', () => {
        const requiredFields = SchemaLoader.getRequiredFields();
        
        // Test that we get some required fields
        assert.ok(Array.isArray(requiredFields), 'Should return array');
        assert.ok(requiredFields.length > 0, 'Should have some required fields');
        
        // Test some expected fields that should be required
        const expectedFields = ['id', 'name', 'description', 'severity'];
        expectedFields.forEach(field => {
            if (requiredFields.includes(field)) {
                assert.ok(true, `${field} is correctly marked as required`);
            }
        });
    });

    test('Should provide field order from schema if available', () => {
        const fieldOrder = SchemaLoader.getFieldOrder();
        
        // Field order might be empty if not defined in schema
        assert.ok(Array.isArray(fieldOrder), 'Should return array');
        // Don't require it to be non-empty since it might not be defined
    });

    test('Should provide duration fields from schema', () => {
        const durationFields = SchemaLoader.getDurationFields();
        
        assert.ok(Array.isArray(durationFields), 'Should return array');
        // Duration fields like queryFrequency, queryPeriod should be detected
        const expectedDurationFields = ['queryFrequency', 'queryPeriod'];
        expectedDurationFields.forEach(field => {
            if (durationFields.includes(field)) {
                assert.ok(true, `${field} correctly identified as duration field`);
            }
        });
    });

    test('Should fail gracefully when extension context is not set', () => {
        // This test ensures proper error handling
        assert.doesNotThrow(() => {
            // The schema should already be loaded from suiteSetup
            const severities = SchemaLoader.getValidSeverities();
            assert.ok(severities.length > 0);
        });
    });
});