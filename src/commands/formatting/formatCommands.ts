import * as vscode from 'vscode';
import { BaseCommand } from '../base/baseCommand';
import { SentinelRuleFormatter } from '../../formatting/formatter';

export class FormatCommands extends BaseCommand {
    public registerCommands(): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        disposables.push(
            vscode.commands.registerCommand('sentinelRules.fixFieldOrder', this.fixFieldOrder.bind(this))
        );

        disposables.push(
            vscode.commands.registerCommand('sentinelRules.formatRule', this.formatRule.bind(this))
        );

        return disposables;
    }

    private async fixFieldOrder(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const edits = SentinelRuleFormatter.reorderFieldsOnly(editor.document);
        if (edits.length > 0) {
            await editor.edit(editBuilder => {
                for (const edit of edits) {
                    editBuilder.replace(edit.range, edit.newText);
                }
            });
        }
    }

    private formatRule(): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        if (!document.fileName.includes('sentinel') || !document.fileName.match(/\.(yaml|yml)$/)) {
            vscode.window.showErrorMessage('This command only works on Sentinel YAML files');
            return;
        }

        // Use the same formatter as the document formatting provider
        const edits = SentinelRuleFormatter.formatDocument(document);
        if (edits.length > 0) {
            editor.edit(editBuilder => {
                for (const edit of edits) {
                    editBuilder.replace(edit.range, edit.newText);
                }
            });
        }
    }
}