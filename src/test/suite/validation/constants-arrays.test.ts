import * as assert from 'assert';
import { 
    VALID_SEVERITIES, 
    VALID_TRIGGER_OPERATORS, 
    VALID_ENTITY_TYPES, 
    REQUIRED_FIELDS,
    COMMON_REQUIRED_FIELDS,
    VALID_RULE_KINDS,
    getRequiredFieldsForKind
} from '../../../validation/constants';

suite('Constants Arrays Tests', () => {
    suite('Severities', () => {
        test('should contain expected severity values', () => {
            const expectedSeverities = ['Informational', 'Low', 'Medium', 'High'];
            expectedSeverities.forEach(severity => {
                assert.ok(VALID_SEVERITIES.includes(severity as any), `Should include ${severity} severity`);
            });
        });

        test('should have exactly 4 severity levels', () => {
            assert.strictEqual(VALID_SEVERITIES.length, 4, 'Should have exactly 4 severity levels');
        });

        test('should be properly typed array', () => {
            assert.ok(Array.isArray(VALID_SEVERITIES), 'Should be an array');
        });
    });

    suite('Trigger Operators', () => {
        test('should contain expected operators', () => {
            const expectedOperators: (typeof VALID_TRIGGER_OPERATORS[number])[] = ['gt', 'lt', 'eq', 'ne'];
            expectedOperators.forEach(operator => {
                assert.ok(VALID_TRIGGER_OPERATORS.includes(operator), `Should include ${operator} operator`);
            });
        });

        test('should have correct structure', () => {
            assert.ok(Array.isArray(VALID_TRIGGER_OPERATORS), 'Should be an array');
            assert.ok(VALID_TRIGGER_OPERATORS.length > 0, 'Should have operators');
            assert.ok(VALID_TRIGGER_OPERATORS.length >= 4, 'Should have at least 4 trigger operators');
        });

        test('should validate individual operators', () => {
            (VALID_TRIGGER_OPERATORS as readonly string[]).forEach(operator => {
                assert.ok(typeof operator === 'string', `${operator} should be a string`);
                assert.ok(operator.length > 0, `${operator} should not be empty`);
            });
        });

        test('should be the correct type', () => {
            assert.ok(Array.isArray(VALID_TRIGGER_OPERATORS), 'Should be an array');
            (VALID_TRIGGER_OPERATORS as readonly string[]).forEach(op => {
                assert.ok(typeof op === 'string', 'Each operator should be a string');
            });
        });
    });

    suite('Entity Types', () => {
        test('should contain common entity types', () => {
            const commonTypes = ['Account', 'Host', 'IP', 'File', 'Process'];
            commonTypes.forEach(type => {
                assert.ok(VALID_ENTITY_TYPES.includes(type as any), `Should include ${type} entity type`);
            });
        });

        test('should be comprehensive', () => {
            assert.ok(Array.isArray(VALID_ENTITY_TYPES), 'Should be an array');
            assert.ok(VALID_ENTITY_TYPES.length > 10, 'Should have many entity types');
            assert.ok(VALID_ENTITY_TYPES.length >= 20, 'Should have at least 20 entity types');
        });

        test('should contain all required core entity types', () => {
            const coreEntityTypes = [
                'Account', 'SecurityGroup', 'Host', 'IP', 'DNS', 'URL', 
                'File', 'FileHash', 'Process', 'AzureResource', 'Malware'
            ];
            
            coreEntityTypes.forEach(type => {
                assert.ok(VALID_ENTITY_TYPES.includes(type), `Should include core entity type: ${type}`);
            });
        });
    });

    suite('Required Fields', () => {
        test('should contain essential fields', () => {
            const essentialFields = ['id', 'name', 'description', 'severity', 'query'];
            essentialFields.forEach(field => {
                assert.ok(REQUIRED_FIELDS.includes(field), `Should include ${field} as required field`);
            });
        });

        test('should have minimum essential fields', () => {
            assert.ok(Array.isArray(REQUIRED_FIELDS), 'Should be an array');
            assert.ok(REQUIRED_FIELDS.length >= 5, 'Should have at least 5 required fields');
        });

        test('common fields should include essentials', () => {
            assert.ok(COMMON_REQUIRED_FIELDS.includes('id'), 'Common fields should include id');
            assert.ok(COMMON_REQUIRED_FIELDS.includes('query'), 'Common fields should include query');
            assert.ok(COMMON_REQUIRED_FIELDS.includes('severity'), 'Common fields should include severity');
        });
    });

    suite('Rule Kinds', () => {
        test('should contain expected rule types', () => {
            assert.ok(VALID_RULE_KINDS.includes('Scheduled'), 'Should include Scheduled rules');
            assert.ok(VALID_RULE_KINDS.includes('NRT'), 'Should include NRT rules');
            assert.strictEqual(VALID_RULE_KINDS.length, 2, 'Should only have 2 user-creatable rule kinds');
        });

        test('getRequiredFieldsForKind should return correct fields', () => {
            const scheduledFields = getRequiredFieldsForKind('Scheduled');
            const nrtFields = getRequiredFieldsForKind('NRT');
            const unknownFields = getRequiredFieldsForKind('Unknown');
            
            // Scheduled rules should have frequency/period fields
            assert.ok(scheduledFields.includes('queryFrequency'), 'Scheduled rules should require queryFrequency');
            assert.ok(scheduledFields.includes('triggerOperator'), 'Scheduled rules should require triggerOperator');
            
            // NRT rules should not have frequency/period fields
            assert.ok(!nrtFields.includes('queryFrequency'), 'NRT rules should not require queryFrequency');
            
            // Unknown should default to Scheduled
            assert.deepStrictEqual(unknownFields, scheduledFields, 'Unknown kind should default to Scheduled');
            
            // Both should have common fields
            assert.ok(scheduledFields.includes('id'), 'Should include common field: id');
            assert.ok(nrtFields.includes('tactics'), 'Should include common field: tactics');
        });
    });

    suite('Type Safety', () => {
        test('should maintain type safety', () => {
            assert.ok(Array.isArray(VALID_SEVERITIES), 'VALID_SEVERITIES should be an array');
            assert.ok(Array.isArray(VALID_ENTITY_TYPES), 'VALID_ENTITY_TYPES should be an array');
        });
    });
});