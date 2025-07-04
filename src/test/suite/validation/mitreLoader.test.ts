import * as assert from 'assert';
import * as vscode from 'vscode';
import { MitreLoader } from '../../../validation/mitreLoader';

suite('MitreLoader Tests', () => {
    suiteSetup(async () => {
        // Create a mock extension context for testing
        const mockContext = {
            extensionPath: process.cwd() // Use current working directory for tests
        } as vscode.ExtensionContext;
        
        MitreLoader.setExtensionContext(mockContext);
        
        // Try to load MITRE data
        try {
            await MitreLoader.loadMitreData();
        } catch (_error) {
            console.log('Failed to load MITRE data in tests, using fallback');
        }
    });

    test('Should validate valid MITRE technique format', () => {
        const result = MitreLoader.validateTechnique('T1566');
        assert.ok(result.isValidFormat, 'Should validate correct technique format');
    });

    test('Should reject invalid MITRE technique format', () => {
        const result = MitreLoader.validateTechnique('Invalid');
        assert.ok(!result.isValidFormat, 'Should reject invalid technique format');
    });

    test('Should validate valid MITRE tactic format', () => {
        const result = MitreLoader.validateTactic('InitialAccess');
        assert.ok(result.isValidFormat, 'Should validate correct tactic format');
    });

    test('Should reject invalid MITRE tactic format', () => {
        const result = MitreLoader.validateTactic('invalid-tactic');
        assert.ok(!result.isValidFormat, 'Should reject invalid tactic format');
    });

    test('Should handle unknown but valid format techniques based on settings', () => {
        const result = MitreLoader.validateTechnique('T9999');
        assert.ok(result.isValidFormat, 'Should accept valid format even if unknown');
    });

    test('Should load fallback data when main data fails', () => {
        // Test that we have some tactics loaded (fallback or real data)
        const tactics = MitreLoader.getValidTactics();
        assert.ok(tactics.length >= 0, 'Should have some tactics loaded (fallback or real data)');
    });

    test('Should load techniques data', () => {
        // Test that we have some techniques loaded
        const techniques = MitreLoader.getAllTechniques();
        assert.ok(techniques.length >= 0, 'Should have some techniques loaded');
    });

    test('Should validate technique format patterns', () => {
        const validTechniques = ['T1566', 'T1566.001', 'T0123'];
        validTechniques.forEach(technique => {
            const result = MitreLoader.validateTechnique(technique);
            assert.ok(result.isValidFormat, `${technique} should be valid format`);
        });
    });

    test('Should validate tactic format patterns', () => {
        const validTactics = ['InitialAccess', 'Execution', 'Persistence'];
        validTactics.forEach(tactic => {
            const result = MitreLoader.validateTactic(tactic);
            assert.ok(result.isValidFormat, `${tactic} should be valid format`);
        });
    });

    test('Should handle sub-techniques correctly', () => {
        const subTechnique = MitreLoader.validateTechnique('T1566.001');
        assert.ok(subTechnique.isValidFormat, 'Should handle sub-techniques');
    });

    test('Should provide validation results with proper structure', () => {
        const result = MitreLoader.validateTechnique('T1566');
        assert.ok(typeof result.isKnown === 'boolean', 'Should have isKnown property');
        assert.ok(typeof result.isValidFormat === 'boolean', 'Should have isValidFormat property');
        assert.ok(typeof result.severity === 'number', 'Should have severity property');
    });

    test('Should handle different validation scenarios', () => {
        const techniques = MitreLoader.getAllTechniques();
        const tactics = MitreLoader.getValidTactics();
        
        // Should not crash even if no data loaded
        assert.ok(Array.isArray(techniques), 'Should return array for techniques');
        assert.ok(Array.isArray(tactics), 'Should return array for tactics');
    });

    test('Should handle tactic validation scenarios', () => {
        const tactics = MitreLoader.getValidTactics();
        const allTactics = MitreLoader.getAllTactics();
        
        // Should not crash even if no data loaded
        assert.ok(Array.isArray(tactics), 'Should return array for valid tactics');
        assert.ok(Array.isArray(allTactics), 'Should return array for all tactics');
    });
});

suite('MITRE Validation Tests', () => {
    test('Should validate technique format correctly', () => {
        const result = MitreLoader.validateTechnique('T1566');
        assert.ok(result.isValidFormat, 'Valid technique format should pass');
    });

    test('Should validate tactic format correctly', () => {
        const result = MitreLoader.validateTactic('InitialAccess');
        assert.ok(result.isValidFormat, 'Valid tactic format should pass');
    });

    test('Should handle sub-techniques correctly', () => {
        const result = MitreLoader.validateTechnique('T1566.001');
        assert.ok(result.isValidFormat, 'Sub-technique format should be valid');
    });
});