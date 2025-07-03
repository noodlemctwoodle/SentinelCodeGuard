import * as vscode from 'vscode';
import * as path from 'path';
import { BaseCommand } from '../base/baseCommand';
import { SentinelRuleFormatter } from '../../formatting/formatter';

export class ValidationCommands extends BaseCommand {
    public registerCommands(): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        disposables.push(
            vscode.commands.registerCommand('sentinelRules.validateWorkspace', this.validateWorkspace.bind(this))
        );

        return disposables;
    }

    /**
     * ENHANCED: Bulk workspace validation and maintenance
     */
    private async validateWorkspace(): Promise<void> {
        try {
            // Let user choose folder (like bulk GUID regeneration)
            const folderOptions = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                title: 'Select folder to validate and maintain Sentinel rules',
                defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri
            });

            if (!folderOptions || folderOptions.length === 0) {
                return;
            }
            const targetFolder = folderOptions[0];

            // Find all YAML files (broader search like bulk GUID)
            const allYamlFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(targetFolder, '**/*.{yaml,yml}'),
                '**/node_modules/**'
            );

            // Filter for Sentinel files using content detection
            const sentinelFiles: vscode.Uri[] = [];
            for (const file of allYamlFiles) {
                try {
                    const content = await vscode.workspace.fs.readFile(file);
                    const text = Buffer.from(content).toString('utf8');
                    
                    const sentinelIndicators = [
                        /^\s*tactics\s*:/m,
                        /^\s*techniques\s*:/m,
                        /^\s*queryFrequency\s*:/m,
                        /^\s*triggerOperator\s*:/m,
                        /^\s*requiredDataConnectors\s*:/m
                    ];
                    
                    const hasSentinelFields = sentinelIndicators.some(regex => regex.test(text));
                    if (hasSentinelFields || file.fsPath.toLowerCase().includes('sentinel')) {
                        sentinelFiles.push(file);
                    }
                } catch (error) {
                    console.log(`Skipping file ${file.fsPath}: ${error}`);
                }
            }

            if (sentinelFiles.length === 0) {
                vscode.window.showInformationMessage(
                    `No Sentinel rule files found in folder "${path.basename(targetFolder.fsPath)}"`
                );
                return;
            }

            // Show options for what to do
            const action = await vscode.window.showQuickPick([
                {
                    label: "$(search) Validate Only",
                    description: "Check for validation errors without making changes",
                    detail: "Shows summary of validation issues",
                    action: "validate"
                },
                {
                    label: "$(tools) Fix Formatting & Field Order",
                    description: "Automatically fix field order and formatting issues",
                    detail: "Applies formatting and field reordering to all files",
                    action: "fix"
                },
                {
                    label: "$(report) Generate Validation Report",
                    description: "Create detailed report of all validation issues",
                    detail: "Exports findings to a text file",
                    action: "report"
                }
            ], {
                placeHolder: `Select action for ${sentinelFiles.length} Sentinel rule files`,
                ignoreFocusOut: false
            });

            if (!action) return;

            await this.performBulkValidation(sentinelFiles, action.action as 'validate' | 'fix' | 'report', targetFolder);

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to perform bulk maintenance: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Perform bulk validation with different actions
     */
    private async performBulkValidation(files: vscode.Uri[], action: 'validate' | 'fix' | 'report', folder: vscode.Uri): Promise<void> {
        const folderName = path.basename(folder.fsPath);
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `${action === 'validate' ? 'Validating' : action === 'fix' ? 'Fixing' : 'Analyzing'} Sentinel rules in ${folderName}`,
            cancellable: false
        }, async (progress) => {
            let processedFiles = 0;
            let totalErrors = 0;
            let fixedFiles = 0;
            const issues: string[] = [];
            const detailedReport: string[] = [];

            for (const file of files) {
                try {
                    progress.report({
                        increment: (processedFiles / files.length) * 100,
                        message: `Processing ${path.basename(file.fsPath)}...`
                    });

                    const document = await vscode.workspace.openTextDocument(file);
                    const { errors } = this.validator.validateDocument(document);
                    const fileName = path.basename(file.fsPath);
                    
                    if (errors.length > 0) {
                        totalErrors += errors.length;
                        issues.push(`${fileName}: ${errors.length} issue${errors.length === 1 ? '' : 's'}`);
                        
                        // Add detailed error info for reports
                        detailedReport.push(`\n${fileName}:`);
                        errors.forEach((error, index) => {
                            detailedReport.push(`  ${index + 1}. Line ${error.range.start.line + 1}: ${error.message}`);
                        });
                        
                        if (action === 'fix') {
                            // Apply formatting and field ordering fixes
                            const edits = SentinelRuleFormatter.formatDocument(document);
                            if (edits.length > 0) {
                                // Apply fixes by modifying text content
                                let fixedContent = document.getText();
                                
                                // Sort edits by position (reverse order to maintain positions)
                                const sortedEdits = edits.sort((a, b) => {
                                    const posA = document.offsetAt(a.range.start);
                                    const posB = document.offsetAt(b.range.start);
                                    return posB - posA; // Reverse order
                                });
                                
                                for (const edit of sortedEdits) {
                                    const startOffset = document.offsetAt(edit.range.start);
                                    const endOffset = document.offsetAt(edit.range.end);
                                    fixedContent = fixedContent.substring(0, startOffset) + 
                                                 edit.newText + 
                                                 fixedContent.substring(endOffset);
                                }
                                
                                await vscode.workspace.fs.writeFile(file, Buffer.from(fixedContent, 'utf8'));
                                fixedFiles++;
                                
                                // Re-validate after fixes to update diagnostics
                                const updatedDocument = await vscode.workspace.openTextDocument(file);
                                this.validator.updateDiagnostics(updatedDocument);
                            }
                        } else {
                            // Just update diagnostics for validation-only mode
                            this.validator.updateDiagnostics(document);
                        }
                    } else {
                        // No errors found
                        detailedReport.push(`\n${fileName}: ✅ No issues found`);
                        this.validator.updateDiagnostics(document);
                    }
                    
                    processedFiles++;
                } catch (error) {
                    const fileName = path.basename(file.fsPath);
                    issues.push(`${fileName}: Error processing file`);
                    detailedReport.push(`\n${fileName}: ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    processedFiles++;
                }
            }

            progress.report({ increment: 100, message: 'Complete!' });

            // Show results
            let message = `Processed ${processedFiles} Sentinel rule files in "${folderName}".`;
            
            if (action === 'validate') {
                if (totalErrors > 0) {
                    message += `\n\n❌ Found ${totalErrors} validation issue${totalErrors === 1 ? '' : 's'} across ${issues.length} file${issues.length === 1 ? '' : 's'}.`;
                    message += `\n\nCheck the Problems panel for detailed error information.`;
                } else {
                    message += `\n\n✅ All files are valid! No issues found.`;
                }
            } else if (action === 'fix') {
                message += `\n\n🔧 Applied formatting fixes to ${fixedFiles} file${fixedFiles === 1 ? '' : 's'}.`;
                if (totalErrors > fixedFiles) {
                    message += `\n\n⚠️ Some validation issues remain that require manual attention.`;
                }
            }

            if (action === 'report') {
                // Generate detailed report
                const timestamp = new Date().toISOString();
                const reportHeader = [
                    `Sentinel Rules Validation Report`,
                    `Generated: ${timestamp}`,
                    `Folder: ${folderName}`,
                    `Total Files Processed: ${processedFiles}`,
                    `Files with Issues: ${issues.length}`,
                    `Total Issues Found: ${totalErrors}`,
                    ``,
                    `${'='.repeat(50)}`,
                    `DETAILED FINDINGS:`,
                    `${'='.repeat(50)}`
                ].join('\n');
                
                const reportContent = reportHeader + detailedReport.join('\n');
                const reportPath = path.join(folder.fsPath, `sentinel-validation-report-${new Date().toISOString().split('T')[0]}.txt`);
                
                try {
                    await vscode.workspace.fs.writeFile(vscode.Uri.file(reportPath), Buffer.from(reportContent, 'utf8'));
                    message += `\n\n📄 Detailed report saved to: sentinel-validation-report-${new Date().toISOString().split('T')[0]}.txt`;
                    
                    // Offer to open the report
                    const openReport = await vscode.window.showInformationMessage(
                        message,
                        'Open Report', 'OK'
                    );
                    
                    if (openReport === 'Open Report') {
                        const reportDocument = await vscode.workspace.openTextDocument(reportPath);
                        await vscode.window.showTextDocument(reportDocument);
                    }
                    return; // Don't show the message again
                } catch (error) {
                    message += `\n\n❌ Failed to save report: ${error instanceof Error ? error.message : 'Unknown error'}`;
                }
            }

            // Show final results
            if (totalErrors > 0) {
                vscode.window.showWarningMessage(message, 'OK');
            } else {
                vscode.window.showInformationMessage(message);
            }
        });
    }
}