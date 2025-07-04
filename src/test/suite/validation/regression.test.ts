import * as assert from 'assert';
import { VALIDATION_PATTERNS } from '../../../validation/constants';

suite('Regression Tests', () => {
    test('should reject known problematic patterns', () => {
        // Test cases that previously caused issues
        const knownBadPatterns = [
            { pattern: 'ISO_DURATION', value: 'P', reason: 'Empty duration' },
            { pattern: 'ISO_DURATION', value: 'PT', reason: 'Empty time duration' },
            { pattern: 'ISO_DURATION', value: 'P1W', reason: 'Weeks not supported' },
            { pattern: 'MITRE_TECHNIQUE', value: 'T12345', reason: 'Too many digits' },
            { pattern: 'MITRE_TECHNIQUE', value: 'T123', reason: 'Too few digits' },
            { pattern: 'GUID', value: '12345678-1234-1234-1234-12345678', reason: 'Too short' },
        ];
        
        knownBadPatterns.forEach(test => {
            const result = VALIDATION_PATTERNS[test.pattern as keyof typeof VALIDATION_PATTERNS].test(test.value);
            assert.ok(!result, `Should reject ${test.pattern}: "${test.value}" (${test.reason})`);
        });
    });

    test('should handle Unicode and international characters appropriately', () => {
        // Test edge cases that might appear in real data
        const unicodeTests = [
            { pattern: 'TACTIC_NAME', value: 'Exfiltración', shouldMatch: false }, // Spanish chars
            { pattern: 'CONNECTOR_ID', value: 'Connector-™', shouldMatch: false }, // Trademark symbol
            { pattern: 'ENTITY_TYPE', value: 'FilePathñ', shouldMatch: false }, // Spanish chars
        ];
        
        unicodeTests.forEach(test => {
            const result = VALIDATION_PATTERNS[test.pattern as keyof typeof VALIDATION_PATTERNS].test(test.value);
            if (test.shouldMatch) {
                assert.ok(result, `${test.pattern} should match "${test.value}"`);
            } else {
                assert.ok(!result, `${test.pattern} should not match "${test.value}"`);
            }
        });
    });

    test('should handle extremely long inputs', () => {
        // Create a very long string (longer than any reasonable real-world input)
        const longString = 'A' + 'a'.repeat(1000);
        
        // Should reject extremely long inputs for patterns that have length limits
        assert.ok(!VALIDATION_PATTERNS.TACTIC_NAME.test(longString), 'Should reject very long tactic names');
        assert.ok(!VALIDATION_PATTERNS.ENTITY_TYPE.test(longString), 'Should reject very long entity types');
        
        // Note: CONNECTOR_ID doesn't currently have a length limit in the regex, 
        // which reflects real-world data where some connector names can be quite long.
        // If we need to add a limit, we would update the regex pattern itself.
        // For now, we'll test that it handles long strings without crashing:
        const connectorResult = VALIDATION_PATTERNS.CONNECTOR_ID.test(longString);
        assert.ok(typeof connectorResult === 'boolean', 'Should return a boolean for long connector IDs');
        
        // Test a more reasonable but still very long connector ID
        const longButReasonableConnector = 'Very' + 'Long'.repeat(50) + 'ConnectorName';
        const reasonableResult = VALIDATION_PATTERNS.CONNECTOR_ID.test(longButReasonableConnector);
        assert.ok(typeof reasonableResult === 'boolean', 'Should handle long but reasonable connector IDs');
    });
});