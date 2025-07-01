import * as vscode from 'vscode';
import { MitreLoader } from '../validation/mitreLoader';

export class SentinelRuleHoverProvider implements vscode.HoverProvider {
    
    public provideHover(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        
        // First, try to match MITRE technique IDs
        let wordRange = document.getWordRangeAtPosition(position, /T\d{4}(?:\.\d{3})?/);
        if (wordRange) {
            const techniqueId = document.getText(wordRange);
            return this.createTechniqueHover(techniqueId, wordRange);
        }
        
        // Then try to match tactic names (handle YAML array context)
        const line = document.lineAt(position.line).text;
        const linePrefix = line.substring(0, position.character);
        
        // Check if we're in a tactics array context
        if (line.includes('tactics:') || linePrefix.includes('- ')) {
            // Get word at position for tactics
            wordRange = document.getWordRangeAtPosition(position, /[A-Z][a-zA-Z]+/);
            if (wordRange) {
                const tacticName = document.getText(wordRange);
                return this.createTacticHover(tacticName, wordRange);
            }
        }
        
        return undefined;
    }
    
    private createTechniqueHover(techniqueId: string, wordRange: vscode.Range): vscode.Hover | undefined {
        // Check if it's a valid MITRE technique format
        if (!/^T\d{4}(?:\.\d{3})?$/.test(techniqueId)) {
            return undefined;
        }
        
        const technique = MitreLoader.getTechnique(techniqueId);
        if (!technique) {
            return new vscode.Hover(
                new vscode.MarkdownString(`**MITRE ATT&CK Technique**\n\n` +
                    `**ID:** ${techniqueId}\n\n` +
                    `*Technique not found in loaded MITRE dataset*\n\n` +
                    `[View on MITRE ATT&CK](https://attack.mitre.org/techniques/${techniqueId.replace('.', '/')}/)`
                ),
                wordRange
            );
        }
        
        return new vscode.Hover(this.createTechniqueHoverContent(technique), wordRange);
    }
    
    private createTacticHover(tacticName: string, wordRange: vscode.Range): vscode.Hover | undefined {
        const tacticDetails = MitreLoader.getTacticDetails(tacticName);
        if (!tacticDetails) {
            return new vscode.Hover(
                new vscode.MarkdownString(`**MITRE ATT&CK Tactic**\n\n` +
                    `**Name:** ${tacticName}\n\n` +
                    `*Tactic not found in loaded MITRE dataset*\n\n` +
                    `[View MITRE ATT&CK Tactics](https://attack.mitre.org/tactics/enterprise/)`
                ),
                wordRange
            );
        }
        
        return new vscode.Hover(this.createTacticHoverContent(tacticDetails), wordRange);
    }
    
    private createTechniqueHoverContent(technique: any): vscode.MarkdownString {
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        
        // Header
        markdown.appendMarkdown(`### 🎯 MITRE ATT&CK Technique\n\n`);
        markdown.appendMarkdown(`**${technique.id}: ${technique.name}**\n\n`);
        
        // Tactics badges
        if (technique.tactics && technique.tactics.length > 0) {
            const tacticBadges = technique.tactics.map((tactic: string) => `\`${tactic}\``).join(' ');
            markdown.appendMarkdown(`**Tactics:** ${tacticBadges}\n\n`);
        }
        
        // Parent technique for sub-techniques
        if (technique.parent) {
            const parentTechnique = MitreLoader.getTechnique(technique.parent);
            const parentName = parentTechnique ? parentTechnique.name : 'Unknown';
            markdown.appendMarkdown(`**Parent:** ${technique.parent} - ${parentName}\n\n`);
        }
        
        // Description
        if (technique.description) {
            let description = this.cleanDescription(technique.description);
            markdown.appendMarkdown(`**Description:**\n${description}\n\n`);
        }
        
        // Links
        const techniqueUrl = `https://attack.mitre.org/techniques/${technique.id.replace('.', '/')}/`;
        markdown.appendMarkdown(`---\n`);
        markdown.appendMarkdown(`[📖 View on MITRE ATT&CK](${techniqueUrl}) | `);
        markdown.appendMarkdown(`[🔍 Find Sentinel Examples](https://github.com/search?q=${encodeURIComponent(technique.id)}+path%3A*.yaml&type=code)`);
        
        return markdown;
    }
    
    private createTacticHoverContent(tactic: any): vscode.MarkdownString {
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        
        // Header
        markdown.appendMarkdown(`### 🎯 MITRE ATT&CK Tactic\n\n`);
        markdown.appendMarkdown(`**${tactic.name}**\n\n`);
        
        // ID if available
        if (tactic.id) {
            markdown.appendMarkdown(`**ID:** ${tactic.id}\n\n`);
        }
        
        // Description
        if (tactic.description) {
            let description = this.cleanDescription(tactic.description);
            markdown.appendMarkdown(`**Description:**\n${description}\n\n`);
        }
        
        // Related techniques
        const relatedTechniques = MitreLoader.getTechniquesForTactic(tactic.name);
        if (relatedTechniques && relatedTechniques.length > 0) {
            const techniqueCount = relatedTechniques.length;
            markdown.appendMarkdown(`**Related Techniques:** ${techniqueCount} techniques available\n\n`);
            
            // Show first few techniques as examples
            const exampleTechniques = relatedTechniques.slice(0, 3);
            for (const tech of exampleTechniques) {
                markdown.appendMarkdown(`• ${tech.id} - ${tech.name}\n`);
            }
            if (relatedTechniques.length > 3) {
                markdown.appendMarkdown(`• ... and ${relatedTechniques.length - 3} more\n`);
            }
            markdown.appendMarkdown(`\n`);
        }
        
        // Links
        const tacticUrl = `https://attack.mitre.org/tactics/${tactic.id || 'enterprise'}/`;
        markdown.appendMarkdown(`---\n`);
        markdown.appendMarkdown(`[📖 View on MITRE ATT&CK](${tacticUrl}) | `);
        markdown.appendMarkdown(`[🔍 Find Sentinel Examples](https://github.com/search?q=${encodeURIComponent(tactic.name)}+path%3A*.yaml&type=code)`);
        
        return markdown;
    }
    
    private cleanDescription(description: string): string {
        if (!description) return '';
        
        // Remove citations
        let cleaned = description.replace(/\(Citation: [^)]+\)/g, '');
        
        // Clean up whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        // Truncate if too long
        if (cleaned.length > 400) {
            cleaned = cleaned.substring(0, 400) + '...';
        }
        
        return cleaned;
    }
}