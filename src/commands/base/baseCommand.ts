import * as vscode from 'vscode';
import { SentinelRuleValidator } from '../../validation/validator';

export abstract class BaseCommand {
    protected context: vscode.ExtensionContext;
    protected validator: SentinelRuleValidator;

    constructor(context: vscode.ExtensionContext, validator: SentinelRuleValidator) {
        this.context = context;
        this.validator = validator;
    }

    abstract registerCommands(): vscode.Disposable[];
}