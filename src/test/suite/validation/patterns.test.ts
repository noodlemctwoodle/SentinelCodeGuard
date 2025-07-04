import * as assert from 'assert';
import { VALIDATION_PATTERNS } from '../../../validation/constants';

suite('Validation Patterns Tests', () => {
    suite('GUID Pattern', () => {
        test('should validate correct GUID formats', () => {
            const validGuids = [
                'f3b5b1a1-1234-1234-1234-123456789abc',
                'A3B5B1A1-1234-1234-1234-123456789ABC',
                '12345678-1234-1234-1234-123456789abc'
            ];
            
            validGuids.forEach(guid => {
                assert.ok(VALIDATION_PATTERNS.GUID.test(guid), `${guid} should be valid GUID`);
            });
        });

        test('should reject invalid GUID formats', () => {
            const invalidGuids = [
                'not-a-guid',
                '12345678-1234-1234-1234-12345678',
                '12345678-1234-1234-1234-123456789abcd'
            ];
            
            invalidGuids.forEach(guid => {
                assert.ok(!VALIDATION_PATTERNS.GUID.test(guid), `${guid} should be invalid GUID`);
            });
        });
    });

    suite('ISO Duration Pattern', () => {
        test('should validate correct ISO duration formats', () => {
            const validDurations = [
                'PT5M',      // 5 minutes (minimum frequency)
                'PT1H',      // 1 hour
                'P1D',       // 1 day
                'PT1H30M',   // 1 hour 30 minutes
                'P1DT2H'     // 1 day 2 hours
            ];
            
            validDurations.forEach(duration => {
                assert.ok(VALIDATION_PATTERNS.ISO_DURATION.test(duration), `${duration} should be valid ISO duration`);
            });
        });

        test('should reject invalid ISO duration formats', () => {
            const invalidDurations = [
                'P',         // P alone is invalid (no duration specified)
                'PT',        // PT alone is invalid (no duration specified)
                'P1W',       // Weeks not supported in Sentinel Analytics Rules
                'PT30S',     // Seconds not supported in Sentinel Analytics Rules
                'P1DT5S',    // Seconds not supported in Sentinel Analytics Rules
                '5M',        // Missing PT prefix
                'invalid',   // Not a duration at all
                'T5M'        // Missing P prefix
            ];
            
            invalidDurations.forEach(duration => {
                assert.ok(!VALIDATION_PATTERNS.ISO_DURATION.test(duration), `${duration} should be invalid ISO duration`);
            });
        });

        test('should validate Sentinel-specific duration formats', () => {
            const validDurations = [
                'PT5M',      // Valid: PT + 5 minutes (minimum frequency)
                'PT1H',      // Valid: PT + 1 hour  
                'P1D',       // Valid: P + 1 day
                'P14D',      // Valid: P + 14 days (maximum lookback period)
                'PT24H',     // Valid: PT + 24 hours (maximum frequency)
                'PT1H30M',   // Valid: PT + 1 hour 30 minutes
                'P1DT5M',    // Valid: P + 1 day + T + 5 minutes
                'P1DT2H30M'  // Valid: P + 1 day + T + 2 hours 30 minutes
            ];
            
            validDurations.forEach(duration => {
                assert.ok(VALIDATION_PATTERNS.ISO_DURATION.test(duration), `${duration} should be valid ISO duration`);
            });
        });

        test('should handle edge cases appropriately', () => {
            const edgeCases = [
                { value: 'P1DT0H', shouldBeValid: true },    // Days with zero hours (valid combination)
                { value: 'P1DT0M', shouldBeValid: true },    // Days with zero minutes (valid combination)  
                { value: 'PT0H5M', shouldBeValid: true },    // Zero hours with minutes (valid)
                { value: 'P0D', shouldBeValid: true },       // Zero days - technically valid ISO 8601
                { value: 'PT0M', shouldBeValid: true },      // Zero minutes - technically valid ISO 8601
                { value: 'P01D', shouldBeValid: true },      // Leading zeros - allowed by current regex
                { value: 'PT01H', shouldBeValid: true },     // Leading zeros in time - allowed by current regex
            ];
            
            edgeCases.forEach(testCase => {
                const result = VALIDATION_PATTERNS.ISO_DURATION.test(testCase.value);
                if (testCase.shouldBeValid) {
                    assert.ok(result, `${testCase.value} should be valid`);
                } else {
                    assert.ok(!result, `${testCase.value} should be invalid`);
                }
            });
        });
    });

    suite('MITRE Technique Pattern', () => {
        test('should validate correct MITRE technique formats', () => {
            const validTechniques = [
                'T1566',       // Main technique
                'T1566.001',   // Sub-technique
                'T1234.999',   // Edge case sub-technique
            ];
            
            validTechniques.forEach(technique => {
                assert.ok(VALIDATION_PATTERNS.MITRE_TECHNIQUE.test(technique), `${technique} should be valid MITRE technique`);
            });
        });

        test('should reject invalid MITRE technique formats', () => {
            const invalidTechniques = [
                'T156',        // Too short
                'T15666',      // Too long  
                '1566',        // Missing T prefix
                'T1566.',      // Incomplete sub-technique
                'T1566.01',    // Sub-technique too short
                'T1566.1234',  // Sub-technique too long
                'T1566.a01',   // Non-numeric sub-technique
            ];
            
            invalidTechniques.forEach(technique => {
                assert.ok(!VALIDATION_PATTERNS.MITRE_TECHNIQUE.test(technique), `${technique} should be invalid MITRE technique`);
            });
        });
    });

    suite('Tactic Name Pattern', () => {
        test('should validate correct tactic name formats', () => {
            const validTactics = [
                'InitialAccess',
                'Execution', 
                'Persistence',
                'DefenseEvasion',
                'CredentialAccess',
                'Credential Access',    // Real MITRE tactic with space
                'Initial Access',       // Real MITRE tactic with space
                'INITIALACCESS',        // Actually valid - regex allows all caps after first letter
                'Abc',                  // Minimum length (3 chars total)
            ];
            
            validTactics.forEach(tactic => {
                assert.ok(VALIDATION_PATTERNS.TACTIC_NAME.test(tactic), `${tactic} should be valid tactic name`);
            });
        });

        test('should reject invalid tactic name formats', () => {
            const invalidTactics = [
                'initial-access',    // Kebab case - starts with lowercase
                'initialAccess',     // Camel case - starts with lowercase  
                'A',                // Too short (needs at least 3 chars: A + 2 more)
                'Ab',               // Too short (needs at least 3 chars)
                'ThisTacticNameIsWayTooLongToBeValidBecauseItExceedsThirtyCharacters' // Too long (over 30)
            ];
            
            invalidTactics.forEach(tactic => {
                assert.ok(!VALIDATION_PATTERNS.TACTIC_NAME.test(tactic), `${tactic} should be invalid tactic name`);
            });
        });
    });

    suite('Connector ID Pattern', () => {
        test('should validate correct connector ID formats', () => {
            const validConnectorIds = [
                'AzureActiveDirectory',
                'Microsoft365Defender', 
                'AzureSecurityCenter',
                'AWS-CloudTrail',
                'Custom_Connector',
                'Syslog-Linux',
                '1Password',            // Real connector starting with number
                '365Defender',          // Another example starting with number
                'Tenable.ad',           // Real connector with dot
            ];
            
            validConnectorIds.forEach(id => {
                assert.ok(VALIDATION_PATTERNS.CONNECTOR_ID.test(id), `${id} should be valid connector ID`);
            });
        });

        test('should reject invalid connector ID formats', () => {
            const invalidConnectorIds = [
                'Invalid Space',       // No spaces allowed
                'Invalid@Symbol',      // Invalid characters
                '',                    // Empty string
                '-StartsWithDash',     // Cannot start with dash
                '_StartsWithUnderscore', // Cannot start with underscore
                '.StartsWithDot',      // Cannot start with dot
            ];
            
            invalidConnectorIds.forEach(id => {
                assert.ok(!VALIDATION_PATTERNS.CONNECTOR_ID.test(id), `${id} should be invalid connector ID`);
            });
        });
    });

    suite('Entity Type Pattern', () => {
        test('should validate correct entity type formats', () => {
            const validEntityTypes = [
                'Account',
                'Host', 
                'IP',
                'CloudApplication',
                'FileHash',
                'IoTDevice',
                'ACCOUNT',          // Actually valid - regex allows all caps
                'MyEntity123',      // Numbers are allowed
            ];
            
            validEntityTypes.forEach(type => {
                assert.ok(VALIDATION_PATTERNS.ENTITY_TYPE.test(type), `${type} should be valid entity type format`);
            });
        });

        test('should reject invalid entity type formats', () => {
            const invalidEntityTypes = [
                'account',           // Lowercase start
                'my-entity',        // Kebab case
                'my_entity',        // Snake case  
                '123Entity',        // Cannot start with number
            ];
            
            invalidEntityTypes.forEach(type => {
                assert.ok(!VALIDATION_PATTERNS.ENTITY_TYPE.test(type), `${type} should be invalid entity type format`);
            });
        });
    });

    suite('Version Pattern', () => {
        test('should validate correct version formats', () => {
            const validVersions = ['1.0.0', '2.1.3', '10.20.30'];
            
            validVersions.forEach(version => {
                assert.ok(VALIDATION_PATTERNS.VERSION.test(version), `${version} should be valid version`);
            });
        });

        test('should reject invalid version formats', () => {
            const invalidVersions = ['1.0', '1.0.0.0', 'v1.0.0', '1.0.0-beta'];
            
            invalidVersions.forEach(version => {
                assert.ok(!VALIDATION_PATTERNS.VERSION.test(version), `${version} should be invalid version`);
            });
        });
    });

    suite('Pattern Consistency', () => {
        test('should have consistent RegExp objects', () => {
            Object.entries(VALIDATION_PATTERNS).forEach(([name, pattern]) => {
                assert.ok(pattern instanceof RegExp, `${name} should be a RegExp`);
                assert.ok(pattern.source.length > 0, `${name} should have a non-empty pattern`);
            });
        });
    });
});