import * as vscode from 'vscode';
import { SentinelRuleValidator } from '../validation/validator';

export class DocumentListenerManager {
    private validator: SentinelRuleValidator;

    constructor(validator: SentinelRuleValidator) {
        this.validator = validator;
    }

    public registerListeners(): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        // Document change listener
        disposables.push(
            vscode.workspace.onDidChangeTextDocument((event) => {
                this.validator.updateDiagnostics(event.document);
            })
        );

        // Document save listener  
        disposables.push(
            vscode.workspace.onDidSaveTextDocument((document) => {
                this.validator.updateDiagnostics(document);
            })
        );

        // Document open listener
        disposables.push(
            vscode.workspace.onDidOpenTextDocument((document) => {
                this.validator.updateDiagnostics(document);
            })
        );

        return disposables;
    }

    public validateOpenDocuments(): void {
        vscode.workspace.textDocuments.forEach((document: vscode.TextDocument) => {
            this.validator.updateDiagnostics(document);
        });
    }
}