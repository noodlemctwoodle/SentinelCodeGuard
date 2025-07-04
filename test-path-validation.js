const path = require('path');
const fs = require('fs');

/**
 * Find the workspace root directory by looking for package.json
 */
function findWorkspaceRoot() {
    let currentDir = __dirname;
    while (currentDir !== path.dirname(currentDir)) {
        if (fs.existsSync(path.join(currentDir, 'package.json'))) {
            return currentDir;
        }
        currentDir = path.dirname(currentDir);
    }
    throw new Error('Could not find workspace root (package.json not found)');
}

/**
 * Load a data file from the data directory
 */
function loadDataFile(filename) {
    const workspaceRoot = findWorkspaceRoot();
    const dataPath = path.join(workspaceRoot, 'data', filename);
    
    console.log(`Attempting to load: ${dataPath}`);
    
    if (!fs.existsSync(dataPath)) {
        throw new Error(`Data file not found: ${dataPath}`);
    }
    
    try {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log(`Successfully loaded ${filename}`);
        return data;
    } catch (error) {
        throw new Error(`Failed to parse data file ${filename}: ${error}`);
    }
}

/**
 * Extract MITRE techniques from a MITRE data object
 */
function extractMitreTechniques(data) {
    const techniques = [];
    if (data && data.objects && Array.isArray(data.objects)) {
        data.objects
            .filter((obj) => obj.type === 'attack-pattern')
            .forEach((technique) => {
                if (technique.external_references && Array.isArray(technique.external_references)) {
                    const mitreRef = technique.external_references.find(
                        (ref) => ref.source_name === 'mitre-attack'
                    );
                    if (mitreRef && mitreRef.external_id) {
                        techniques.push(mitreRef.external_id);
                    }
                }
            });
    }
    return techniques;
}

/**
 * Extract MITRE tactics from a MITRE data object
 */
function extractMitreTactics(data) {
    const tactics = [];
    if (data && data.objects && Array.isArray(data.objects)) {
        data.objects
            .filter((obj) => obj.type === 'x-mitre-tactic')
            .forEach((tactic) => {
                if (tactic.name) {
                    tactics.push(tactic.name);
                }
            });
    }
    return tactics;
}

// Test the functions
try {
    console.log('=== Path Validation Test ===');
    const workspaceRoot = findWorkspaceRoot();
    console.log(`Workspace root: ${workspaceRoot}`);
    
    // Test regex patterns
    const MITRE_TECHNIQUE_PATTERN = /^T[0-9]{4}(?:\.[0-9]{3})?$/;
    const TACTIC_NAME_PATTERN = /^[A-Z][a-zA-Z\s]{2,30}$/;
    
    // Test all three MITRE frameworks
    const frameworks = [
        { name: 'Enterprise', file: 'mitre-v16.json' },
        { name: 'Mobile', file: 'mitre-mobile.json' },
        { name: 'ICS', file: 'mitre-ics.json' }
    ];
    
    let totalTechniques = 0;
    let totalTactics = 0;
    let totalValidTechniques = 0;
    let totalValidTactics = 0;
    let totalInvalidTechniques = 0;
    let totalInvalidTactics = 0;
    
    for (const framework of frameworks) {
        console.log(`\n=== Testing ${framework.name} Framework (${framework.file}) ===`);
        
        const data = loadDataFile(framework.file);
        console.log(`${framework.name} data loaded: ${data.objects?.length || 0} objects`);
        
        // Test techniques
        const techniques = extractMitreTechniques(data);
        console.log(`Extracted ${techniques.length} techniques`);
        totalTechniques += techniques.length;
        
        if (techniques.length > 0) {
            console.log(`Sample techniques: ${techniques.slice(0, 5).join(', ')}`);
            
            let validCount = 0;
            let invalidCount = 0;
            
            techniques.forEach(technique => {
                if (MITRE_TECHNIQUE_PATTERN.test(technique)) {
                    validCount++;
                } else {
                    invalidCount++;
                    if (invalidCount <= 3) {
                        console.log(`  Invalid technique: ${technique}`);
                    }
                }
            });
            
            console.log(`  Valid techniques: ${validCount}`);
            console.log(`  Invalid techniques: ${invalidCount}`);
            totalValidTechniques += validCount;
            totalInvalidTechniques += invalidCount;
            
            if (invalidCount === 0) {
                console.log(`  ✅ All ${framework.name} techniques are valid!`);
            } else {
                console.log(`  ❌ Found ${invalidCount} invalid ${framework.name} techniques`);
            }
        }
        
        // Test tactics
        const tactics = extractMitreTactics(data);
        console.log(`Extracted ${tactics.length} tactics`);
        totalTactics += tactics.length;
        
        if (tactics.length > 0) {
            console.log(`Sample tactics: ${tactics.slice(0, 3).join(', ')}`);
            
            let validTacticCount = 0;
            let invalidTacticCount = 0;
            
            tactics.forEach(tactic => {
                if (TACTIC_NAME_PATTERN.test(tactic)) {
                    validTacticCount++;
                } else {
                    invalidTacticCount++;
                    if (invalidTacticCount <= 3) {
                        console.log(`  Invalid tactic: "${tactic}"`);
                    }
                }
            });
            
            console.log(`  Valid tactics: ${validTacticCount}`);
            console.log(`  Invalid tactics: ${invalidTacticCount}`);
            totalValidTactics += validTacticCount;
            totalInvalidTactics += invalidTacticCount;
            
            if (invalidTacticCount === 0) {
                console.log(`  ✅ All ${framework.name} tactics are valid!`);
            } else {
                console.log(`  ❌ Found ${invalidTacticCount} invalid ${framework.name} tactics`);
            }
        }
    }
    
    // Summary
    console.log('\n=== Summary ===');
    console.log(`Total techniques across all frameworks: ${totalTechniques}`);
    console.log(`Valid techniques: ${totalValidTechniques}`);
    console.log(`Invalid techniques: ${totalInvalidTechniques}`);
    console.log(`Total tactics across all frameworks: ${totalTactics}`);
    console.log(`Valid tactics: ${totalValidTactics}`);
    console.log(`Invalid tactics: ${totalInvalidTactics}`);
    
    if (totalInvalidTechniques === 0 && totalInvalidTactics === 0) {
        console.log('🎉 All MITRE data validation passed!');
        console.log('✅ Test completed successfully - path resolution and data extraction work correctly');
    } else {
        console.log(`❌ Found validation issues: ${totalInvalidTechniques} invalid techniques, ${totalInvalidTactics} invalid tactics`);
    }
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
}