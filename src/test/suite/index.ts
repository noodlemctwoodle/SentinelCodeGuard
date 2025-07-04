import * as path from 'path';
import * as glob from 'glob';

// Use require for Mocha to avoid constructor issues
const Mocha = require('mocha');

export function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 10000
    });

    const testsRoot = path.resolve(__dirname, '..');

    return new Promise((resolve, reject) => {
        // Use callback-style glob with proper typing
        glob.glob('**/**.test.js', { cwd: testsRoot }, (err: Error | null, files: string[]) => {
            if (err) {
                return reject(err);
            }

            // Add files to the test suite
            files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                // Run the mocha test with explicit type annotation
                mocha.run((failures: number) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });
    });
}