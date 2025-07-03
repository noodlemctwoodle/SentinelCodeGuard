import * as vscode from 'vscode';
import { SentinelRuleValidator } from '../validation/validator';
import { GuidCommands } from './guid/guidCommands';
import { TemplateCommands } from './templates/templateCommands';
import { ValidationCommands } from './validation/validationCommands';
import { FormatCommands } from './formatting/formatCommands';
import { ConversionCommands } from './conversion/conversionCommands';

export class CommandManager {
    private context: vscode.ExtensionContext;
    private validator: SentinelRuleValidator;
    
    // Command groups
    private guidCommands: GuidCommands;
    private templateCommands: TemplateCommands;
    private validationCommands: ValidationCommands;
    private formatCommands: FormatCommands;
    private conversionCommands: ConversionCommands;

    constructor(context: vscode.ExtensionContext, validator: SentinelRuleValidator) {
        this.context = context;
        this.validator = validator;
        
        // Initialize command groups
        this.guidCommands = new GuidCommands(context, validator);
        this.templateCommands = new TemplateCommands(context, validator);
        this.validationCommands = new ValidationCommands(context, validator);
        this.formatCommands = new FormatCommands(context, validator);
        this.conversionCommands = new ConversionCommands(context, validator);
    }

    public registerCommands(): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        // Register all command groups
        disposables.push(...this.guidCommands.registerCommands());
        disposables.push(...this.templateCommands.registerCommands());
        disposables.push(...this.validationCommands.registerCommands());
        disposables.push(...this.formatCommands.registerCommands());
        disposables.push(...this.conversionCommands.registerCommands());

        return disposables;
    }
}

// Re-export the TemplateTypeOption for backward compatibility
export { TemplateTypeOption } from './templates/templateTypes';