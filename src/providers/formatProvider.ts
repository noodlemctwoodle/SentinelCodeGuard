import * as vscode from 'vscode';
import { SentinelRuleFormatter } from '../formatting/formatter';

export class SentinelDocumentFormatProvider implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
        return SentinelRuleFormatter.formatDocument(document);
    }
}

export function createFormattingProvider(): vscode.Disposable {
    return vscode.languages.registerDocumentFormattingEditProvider(
        { scheme: 'file', pattern: '**/*.sentinel.{yaml,yml}' },
        new SentinelDocumentFormatProvider()
    );
}