# SentinelCodeGuard

![Beta](https://img.shields.io/badge/status-beta-orange) ![Version](https://img.shields.io/badge/version-0.0.3-blue) ![License](https://img.shields.io/badge/license-MIT-green)

<p align="center">
  <strong>Professional development toolkit for Microsoft Sentinel Analytics Rules</strong>
</p>

<p align="center">
  <em>Guard your Sentinel rules with precision</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#commands">Commands</a> •
  <a href="#configuration">Configuration</a>
</p>

---

## ⚠️ Beta Notice

**SentinelCodeGuard is currently in beta (v0.0.3).** We're actively developing and improving the extension. Please report any issues or feedback via [GitHub Issues](https://github.com/noodlemctwoodle/sentinelcodeguard-vscode/issues).

---

## 🌐 About

Created by **noodlemctwoodle** - Visit [sentinel.blog](https://sentinel.blog) for more Microsoft Sentinel resources, tutorials, and insights.

---

## 🚀 Features

### ✅ **Intelligent Validation**

- **Real-time validation** with instant feedback
- **Field order enforcement** according to Microsoft best practices
- **Required field checking** with helpful suggestions
- **MITRE ATT&CK validation** for tactics and techniques
- **Data connector validation** for supported connectors
- **YAML syntax validation** with precise error locations

### 🎯 **Smart Code Assistance**

- **IntelliSense** for all Sentinel rule fields
- **Auto-completion** for tactics, techniques, and data types
- **Code snippets** for common rule patterns
- **Entity mapping helpers** for different entity types
- **KQL query formatting preservation**

### 🔧 **Professional Formatting**

- **Automatic field reordering** according to standards
- **Missing field completion** with sensible defaults
- **YAML structure optimization**
- **Query formatting preservation**
- **Consistent indentation and spacing**

### 📋 **Template Generation**

- **Standard Rule Template** - General detection rules
- **Minimal Rule Template** - Basic rule structure
- **Advanced Rule Template** - Complex rules with all options
- **Near Real-Time (NRT) Template** - Low-latency detection
- **Behavior Analytics Template** - ML-based detection

### 🔍 **Workspace Integration**

- **Bulk validation** across multiple files
- **Problems panel integration** for centralized error viewing
- **File pattern recognition** for `.sentinel.yaml` files
- **Context menu commands** for quick actions

---

## 📦 Installation

### From VSCode Marketplace

1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Microsoft Sentinel Analytics Rules"
4. Click Install

### Manual Installation

1. Download the `.vsix` file
2. Open VSCode
3. Go to Extensions
4. Click "..." → "Install from VSIX"
5. Select the downloaded file

---

## 🎯 Usage

### Creating a New Rule

1. **Generate Template**:
   - Right-click in Explorer → "Generate Sentinel Rule Template"
   - Or use Command Palette: `Sentinel: Generate Standard Rule Template`

2. **Edit Rule**:
   - Real-time validation provides instant feedback
   - IntelliSense helps with field completion
   - Snippets speed up common patterns

3. **Format Rule**:
   - Use `Sentinel: Format Sentinel Rule` command
   - Or use VSCode's built-in format (Shift+Alt+F)

### File Naming Convention
Use `.sentinel.yaml` or `.sentinel.yml` extensions for automatic detection:
```
detection-rules/
├── suspicious-login.sentinel.yaml
├── data-exfiltration.sentinel.yaml
└── privilege-escalation.sentinel.yaml
```

### Example Rule Structure

```yaml
# Microsoft Sentinel Analytics Rule

id: "12345678-1234-1234-1234-123456789abc"
name: "Suspicious Login Activity"
description: |
  Detects suspicious login patterns that may indicate compromise
severity: "Medium"
requiredDataConnectors:
  - connectorId: "AzureActiveDirectory"
    dataTypes:
      - "SigninLogs"
queryFrequency: "PT5M"
queryPeriod: "PT1H"
triggerOperator: "gt"
triggerThreshold: 0
tactics:
  - "InitialAccess"
query: |
  SigninLogs
  | where TimeGenerated > ago(1h)
  | where ResultType != "0"
  | summarize FailedAttempts = count() by UserPrincipalName, IPAddress
  | where FailedAttempts > 5
entityMappings:
  - entityType: "Account"
    fieldMappings:
      - identifier: "FullName"
        columnName: "UserPrincipalName"
  - entityType: "IP"
    fieldMappings:
      - identifier: "Address"
        columnName: "IPAddress"
version: "1.0.0"
kind: "Scheduled"
```

---

## 🎮 Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `Sentinel: Validate Rule` | Validate current rule file | - |
| `Sentinel: Fix Field Order` | Reorder fields according to standards | - |
| `Sentinel: Format Sentinel Rule` | Format and optimize rule structure | Shift+Alt+F |
| `Sentinel: Generate Standard Rule Template` | Create standard rule template | - |
| `Sentinel: Generate Minimal Rule Template` | Create basic rule template | - |
| `Sentinel: Generate Advanced Rule Template` | Create comprehensive rule template | - |
| `Sentinel: Generate NRT Rule Template` | Create near real-time rule template | - |
| `Sentinel: Generate Behavior Analytics Template` | Create ML-based rule template | - |
| `Sentinel: Validate All Sentinel Rules` | Validate all rules in workspace | - |

---

## ⚙️ Configuration

### VSCode Settings

Add these to your VSCode settings for optimal experience:

```json
{
  "files.associations": {
    "*.sentinel.yaml": "yaml",
    "*.sentinel.yml": "yaml"
  },
  "editor.formatOnSave": true,
  "yaml.schemas": {
    "./schemas/sentinel-analytics-rule-schema.json": "*.sentinel.{yaml,yml}"
  }
}
```

### Workspace Configuration

Create a `.vscode/settings.json` in your workspace:

```json
{
  "sentinel.validation.enabled": true,
  "sentinel.formatting.addMissingFields": true,
  "sentinel.templates.defaultSeverity": "Medium"
}
```

---

## 🔧 Field Order Standards

The extension enforces this field order for consistency:

1. `id` - Unique identifier
2. `name` - Rule display name
3. `description` - Rule description
4. `severity` - Alert severity level
5. `requiredDataConnectors` - Data source requirements
6. `queryFrequency` - How often to run
7. `queryPeriod` - Time window to analyze
8. `triggerOperator` - Threshold comparison
9. `triggerThreshold` - Alert threshold
10. `status` - Rule status
11. `tactics` - MITRE ATT&CK tactics
12. `techniques` - MITRE ATT&CK techniques
13. `query` - KQL detection logic
14. `entityMappings` - Entity extraction rules
15. `version` - Rule version
16. `kind` - Rule type

---

## 🐛 Troubleshooting

### Common Issues

**Extension not activating:**

- Check that files use `.sentinel.yaml` or `.sentinel.yml` extensions
- Restart VSCode Extension Host (`Developer: Restart Extension Host`)

**Validation not working:**

- Ensure YAML syntax is valid
- Check file is properly detected (should show language as "YAML")

**Templates not loading:**

- Verify template files exist in `templates/` folder
- Check extension installation is complete

**Formatting issues:**

- Use `Sentinel: Format Sentinel Rule` instead of generic YAML formatting
- Check for syntax errors before formatting

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License

This extension is licensed under the MIT License. See LICENSE file for details.

---

## 🔗 Related Resources

- [Microsoft Sentinel Documentation](https://docs.microsoft.com/azure/sentinel/)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)
- [KQL Reference](https://docs.microsoft.com/azure/data-explorer/kusto/query/)
- [Analytics Rule Templates](https://github.com/Azure/Azure-Sentinel/tree/master/Detections)

---
