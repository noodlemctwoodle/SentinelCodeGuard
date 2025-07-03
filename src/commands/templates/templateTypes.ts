import * as vscode from 'vscode';

export interface TemplateTypeOption extends vscode.QuickPickItem {
    templateKey: string;
    defaultFilename: string;
    displayName: string;
}