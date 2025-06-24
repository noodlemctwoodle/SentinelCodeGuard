# SentinelCodeGuard

![Beta](https://img.shields.io/badge/status-beta-orange) ![Version](https://img.shields.io/badge/version-0.0.4-blue) ![License](https://img.shields.io/badge/license-MIT-green)

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
  <a href="#configuration">Configuration</a> •
  <a href="#changelog">Changelog</a>
</p>

---

## ⚠️ Beta Notice

**SentinelCodeGuard is currently in beta (v0.0.4).** We're actively developing and improving the extension. Please report any issues or feedback via [GitHub Issues](https://github.com/noodlemctwoodle/SentinelCodeGuard/issues).

---

## 🌐 About

Created by **noodlemctwoodle** - Visit [sentinel.blog](https://sentinel.blog) for more Microsoft Sentinel resources, tutorials, and insights.

---

## 🚀 Features

### ✅ **Intelligent Content-Based Detection**

- **Automatic detection** of Sentinel rules based on content, not filename
- **Real-time validation** with instant feedback  
- **Field order enforcement** according to Microsoft best practices
- **Required field checking** with helpful suggestions
- **MITRE ATT&CK validation** using framework version 16 data
- **Configurable data connector validation** (strict/permissive/workspace modes)
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
- **ISO 8601 duration auto-correction** (e.g., `5m` → `PT5M`)
- **YAML structure optimization**
- **Query formatting preservation**
- **Consistent indentation and spacing**

### 📋 **Template Generation**

- **Standard Rule Template** - General detection rules
- **Minimal Rule Template** - Basic rule structure
- **Advanced Rule Template** - Complex rules with all options
- **Near Real-Time (NRT) Template** - Low-latency detection
- **Behavior Analytics Template** - ML-based detection
- **Fallback Template** - Compatibility template

### 🔍 **Workspace Integration**

- **Bulk validation** across multiple files
- **Problems panel integration** for centralized error viewing
- **Content-based detection** works with any YAML file structure
- **Context menu commands** for quick actions

---

## 📦 Installation

### From VSCode Marketplace

1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "SentinelCodeGuard"
4. Click Install

### Manual Installation

1. Download the `.vsix` file from [GitHub Releases](https://github.com/noodlemctwoodle/SentinelCodeGuard/releases)
2. Open VSCode
3. Go to Extensions
4. Click "..." → "Install from VSIX"
5. Select the downloaded file

---

## 🎯 Usage

### Content-Based Detection

**No special file naming required!** The extension automatically detects Sentinel rules by analyzing content. Any YAML file containing 3 or more Sentinel-specific fields will be validated:

- `tactics`, `techniques`, `queryFrequency`, `queryPeriod`
- `triggerOperator`, `triggerThreshold`, `entityMappings`
- `requiredDataConnectors`, `suppressionDuration`, etc.

### File Organization Examples

**✅ Works with any structure:**
```
detection-rules/
├── suspicious-login.yaml          # Detected by content
├── data-exfiltration.yml          # Detected by content  
├── rules/
│   ├── privilege-escalation.yaml  # Detected by content
│   └── malware-detection.yaml     # Detected by content
└── templates/
    └── custom-rule.yaml           # Detected by content
```

**✅ Also works with explicit naming:**
```
detection-rules/
├── suspicious-login.sentinel.yaml
├── data-exfiltration.sentinel.yml
└── privilege-escalation.yaml
```

### Creating a New Rule

1. **Generate Template**:
   - Right-click in Explorer → "Generate Standard Rule Template"
   - Or use Command Palette: `Sentinel: Generate Standard Rule Template`

2. **Edit Rule**:
   - Real-time validation provides instant feedback
   - IntelliSense helps with field completion
   - Snippets speed up common patterns

3. **Format Rule**:
   - Use `Sentinel: Format Sentinel Rule` command
   - Or use VSCode's built-in format (Shift+Alt+F)

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
| `Sentinel: Fix Field Order` | Reorder fields according to standards | - |
| `Sentinel: Format Sentinel Rule` | Format and optimize rule structure | Shift+Alt+F |
| `Sentinel: Generate Standard Rule Template` | Create standard rule template | - |
| `Sentinel: Generate Minimal Rule Template` | Create basic rule template | - |
| `Sentinel: Generate Advanced Rule Template` | Create comprehensive rule template | - |
| `Sentinel: Generate NRT Rule Template` | Create near real-time rule template | - |
| `Sentinel: Generate Behavior Analytics Template` | Create ML-based rule template | - |
| `Sentinel: Validate All Workspace Rules` | Validate all rules in workspace | - |

---

## ⚙️ Configuration

### Extension Settings

The extension provides several configuration options:

```json
{
  "sentinelRules.validation.enabled": true,
  "sentinelRules.validation.onSave": true,
  "sentinelRules.validation.onType": false,
  "sentinelRules.formatting.enabled": true,
  "sentinelRules.fieldOrdering.enforceOrder": true,
  "sentinelRules.fieldOrdering.showOrderHints": true,
  "sentinelRules.intellisense.enabled": true,
  "sentinelRules.mitre.version": "v16",
  "sentinelRules.connectors.validationMode": "permissive",
  "sentinelRules.connectors.customConnectors": [],
  "sentinelRules.mitre.allowUnknownTactics": true,
  "sentinelRules.mitre.mitre.allowUnknownTechniques": true,
  "sentinelRules.mitre.strictValidation": false
}
```

### Connector Validation Modes

- **`permissive`** (default): Accept any valid connector ID format
- **`strict`**: Only allow known connectors from extension database  
- **`workspace`**: Allow connectors defined in `.sentinel-connectors.json`

### Custom Workspace Connectors

Create `.sentinel-connectors.json` in your workspace root:

```json
{
  "connectors": [
    {
      "id": "MyCustomConnector",
      "displayName": "My Custom Data Connector",
      "dataTypes": ["CustomLogs", "CustomEvents"]
    }
  ]
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

## 📋 Changelog

### v0.0.4 (2025-01-24)

#### 🆕 **New Features**
- **Content-based rule detection**: Automatically detects Sentinel rules by analyzing YAML content, not filename patterns
- **Modular architecture**: Split monolithic code into focused modules for better maintainability
- **Enhanced debugging**: Added comprehensive logging for troubleshooting extension activation and command registration

#### 🔧 **Improvements**
- **Fixed command registration**: Resolved import path issues causing "command not found" errors in packaged extension
- **Repository migration**: Updated all repository URLs to point to new GitHub location
- **Documentation overhaul**: Updated README to accurately reflect current features and capabilities
- **Removed unnecessary manual configuration**: Extension now works automatically without user setup

#### 🐛 **Bug Fixes**
- Fixed extension activation in compiled VSIX packages
- Corrected command import paths for proper module resolution
- Resolved template generation command registration issues

---

### v0.0.3 (2025-01-23)

#### 🔧 **Improvements**
- **Dynamic validation**: Implemented content-based Sentinel rule detection
- **Import path corrections**: Fixed module import issues for command registration
- **Extension packaging**: Improved build process and file inclusion

#### 🐛 **Bug Fixes**
- Resolved command not found errors in installed extension
- Fixed extension activation issues in non-development environments

---

### v0.0.2 (2025-01-22)

#### 🆕 **New Features**
- **MITRE ATT&CK v16**: Updated to latest framework data with dynamic loading
- **Configurable connector validation**: Added strict/permissive/workspace validation modes
- **ISO 8601 duration auto-correction**: Automatically fixes duration formats
- **Professional formatting**: Enhanced field reordering and missing field completion

#### 🔧 **Improvements**
- **Removed hard-coded lists**: All validation now uses dynamic data loaders
- **Extensible entity types**: Support for custom entity mappings
- **Improved error handling**: Better fallback mechanisms and user feedback
- **Template management**: Complete set of rule templates for different use cases

---

### v0.0.1 (2025-01-21)

#### 🆕 **Initial Release**
- **Basic YAML validation**: Initial Sentinel analytics rule validation
- **Field order checking**: Enforcement of Microsoft recommended field ordering
- **Template generation**: Basic rule template creation
- **MITRE validation**: Initial MITRE ATT&CK tactics and techniques validation
- **VS Code integration**: Problems panel integration and syntax highlighting

---

## 🐛 Troubleshooting

### Common Issues

**Extension not detecting my YAML file:**

- Ensure the file contains at least 3 Sentinel-specific fields
- Check that YAML syntax is valid
- Look for fields like: `tactics`, `techniques`, `queryFrequency`, `entityMappings`

**Commands not appearing:**

- Open any YAML file to trigger extension activation
- Check VS Code Developer Console (Help → Toggle Developer Tools) for errors
- Restart VS Code Extension Host (`Developer: Restart Extension Host`)

**Validation not working:**

- Ensure YAML syntax is valid first
- Check extension settings are enabled
- Look at Problems panel for detailed diagnostics

**Templates not loading:**

- Verify extension is properly installed
- Check Developer Console for template loading errors

---

## 🏗️ Architecture

### Modular Design

- **Content-based detection**: Automatically identifies Sentinel rules
- **Dynamic data loaders**: MITRE v16 and connector data
- **Configurable validation**: Strict, permissive, or workspace modes
- **Extensible templates**: Easy to add new rule types

### Data Sources

- **MITRE ATT&CK**: Framework v16 (bundled, updateable)
- **Entity Types**: Latest Microsoft Sentinel entities  
- **Connectors**: Configurable with fallback modes

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the [repository](https://github.com/noodlemctwoodle/SentinelCodeGuard)
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License

This extension is licensed under the MIT License. See [LICENSE](https://github.com/noodlemctwoodle/SentinelCodeGuard/blob/main/LICENSE) file for details.

---

## 🔗 Related Resources

- [Microsoft Sentinel Documentation](https://docs.microsoft.com/azure/sentinel/)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)
- [KQL Reference](https://docs.microsoft.com/azure/data-explorer/kusto/query/)
- [Analytics Rule Templates](https://github.com/Azure/Azure-Sentinel/tree/master/Detections)

---
