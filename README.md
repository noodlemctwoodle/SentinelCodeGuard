# SentinelCodeGuard

![Beta](https://img.shields.io/badge/status-beta-orange) ![Version](https://img.shields.io/badge/version-0.0.7-blue) ![License](https://img.shields.io/badge/license-MIT-green)

**A development toolkit for Microsoft Sentinel Analytics Rules**

*Guard your Sentinel rules with precision*

---

## 📖 Documentation

**Complete documentation is available in our [Wiki](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki)**

- **[Getting Started Guide](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki)** - Complete feature overview and quick start
- **[Rule Templates](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Rule-Templates)** - Professional templates with best practices
- **[ARM to YAML Conversion](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Decompile-ARM-to-YAML)** - Comprehensive migration guide
- **[Configuration](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Configuration-Guide)** - Detailed setup and customization

---

## Beta Notice

**SentinelCodeGuard is currently in beta (v0.0.7).** We're actively developing and improving the extension. Please report any issues or feedback via [GitHub Issues](https://github.com/noodlemctwoodle/SentinelCodeGuard/issues).

---

## About

Created by **TobyG** - Visit [sentinel.blog](https://sentinel.blog) for more Microsoft Sentinel resources, tutorials, and insights.

---

## ✨ Key Features

### 🎯 Intelligent Rule Development

- **Content-based detection** - Automatically identifies Sentinel rules by analyzing YAML content
- **Real-time validation** with instant feedback and error correction
- **Professional templates** for all rule types (Standard, Advanced, NRT, Behavior Analytics)
- **MITRE ATT&CK v16 validation** with auto-correction and hover information
- **Smart IntelliSense** for all Sentinel fields and values

### 🔄 ARM Template Migration

- **Single and bulk conversion** from ARM templates to YAML
- **Multiple naming strategies** for organized file management
- **Comprehensive field mapping** with validation
- **Configurable conversion options** for enterprise needs
- **Progress tracking** and detailed conversion summaries

### 🛠️ Development Tools

- **Professional formatting** with field reordering and duration auto-correction
- **Live validation** in the Problems panel with rule-type-specific checks
- **Code snippets** and auto-completion
- **Entity mapping helpers** for all entity types
- **MITRE ATT&CK hover provider** with detailed technique and tactic information
- **Workspace integration** for team collaboration

---

## 🚀 Quick Start

### Installation

1. **From VS Code Marketplace**: Search for "SentinelCodeGuard" in Extensions
2. **From Visual Studio Marketplace**: [SentinelCodeGuard](https://marketplace.visualstudio.com/items?itemName=noodlemctwoodle.sentinelcodeguard)
3. **Manual Installation**: Download `.vsix` from [GitHub Releases](https://github.com/noodlemctwoodle/SentinelCodeGuard/releases)

### Create Your First Rule

1. **Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. **Run**: `Sentinel: Generate Standard Rule Template`
3. **Edit the template** with real-time validation feedback
4. **Format automatically** with `Shift+Alt+F`

### Convert ARM Templates

1. **Right-click** any `.json` file containing ARM templates
2. **Select**: "Decompile ARM to YAML"
3. **Choose naming strategy** and output location
4. **Review conversion summary** with any warnings

---

## 📋 Available Templates

| Template | Use Case | Documentation |
|----------|----------|---------------|
| **Standard** | General detection rules | [Standard Rule Template](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/RuleTemplates/StandardRuleTemplate) |
| **Advanced** | Complex multi-stage detection | [Advanced Rule Template](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/RuleTemplates/AdvancedRuleTemplate) |
| **NRT** | Near real-time alerts | [NRT Template](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/RuleTemplates/NearReal-Time(NRT)Template) |
| **Behavior Analytics** | ML-based anomaly detection | [Behavior Analytics Template](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/RuleTemplates/BehaviorAnalyticsTemplate) |

---

## ⚡ Example Usage

### Content-Based Detection

**No special naming required!** Works with any YAML file containing Sentinel rule fields:

```text
detection-rules/
├── login-anomalies.yaml        # ✅ Auto-detected
├── data-exfiltration.yml       # ✅ Auto-detected  
├── rules/
│   ├── privilege-escalation.yaml  # ✅ Auto-detected
│   └── malware-detection.yaml     # ✅ Auto-detected
```

### Bulk ARM Conversion

Convert multiple rules from a single ARM template:

**Input**: `SecurityRules.json` (5 rules) → **Output**: 5 separate YAML files

- `suspicious_login_activity.yaml`
- `data_exfiltration_alert.yaml`
- `privilege_escalation.yaml`
- etc.

---

## 🎛️ Configuration

### Basic Settings

```json
{
  "sentinelRules.validation.enabled": true,
  "sentinelRules.formatting.enabled": true,
  "sentinelRules.conversion.defaultNamingStrategy": "displayName"
}
```

### Advanced Configuration

For comprehensive configuration options, see: **[Configuration Guide](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/ARMTemplatetoYAMLConversion/Configuration-Options)**

---

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `Sentinel Rules: Generate Standard Rule Template` | Create general-purpose rule |
| `Sentinel Rules: Generate Advanced Rule Template` | Create complex detection rule |
| `Sentinel Rules: Generate NRT Rule Template` | Create near real-time rule |
| `Sentinel Rules: Generate Behavior Analytics Template` | Create ML-based rule |
| `Sentinel Rules: Decompile ARM to YAML` | Convert ARM templates to YAML |
| `Sentinel Rules: Format Sentinel Rule` | Format and optimise structure |
| `Sentinel Rules: Validate All Workspace Rules` | Bulk validation |

---

## 🆘 Support & Troubleshooting

### Documentation

- **[Complete Wiki](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki)** - Comprehensive guides and examples
- **[Troubleshooting](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Configuration-Guide#-troubleshooting)** - Common issues and solutions
- **[Configuration Help](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Configuration-Guide)** - Setup and settings guidance

### Community

- **[GitHub Issues](https://github.com/noodlemctwoodle/SentinelCodeGuard/issues)** - Bug reports and feature requests
- **[sentinel.blog](https://sentinel.blog)** - Additional resources and tutorials


### Quick Fixes

- **Extension not detecting files?** Ensure YAML contains 3+ Sentinel fields (`tactics`, `techniques`, `queryFrequency`, etc.)
- **Commands missing?** Open any YAML file to activate the extension
- **Validation issues?** Check Problems panel for detailed diagnostics

---

## 📈 Recent Updates

### v0.0.7 (2025-07-01)

#### 🎯 Enhanced MITRE ATT&CK Integration
- **Full MITRE ATT&CK v16 dataset** integrated as single source of truth
- **Rich hover provider** for techniques and tactics with detailed information
- **Context-aware hovers** that only trigger on actual MITRE fields
- **Comprehensive technique/tactic validation** with auto-correction

#### 🔧 Improved Formatting & Validation
- **Rule-type-specific validation** for Scheduled vs NRT rules
- **Enhanced duration handling** including `lookbackDuration` field support
- **Better field ordering** with `lookbackDuration` positioned correctly
- **Improved error handling** and YAML repair functionality

#### 🔄 ARM Conversion Enhancements
- **Renamed context menu** to "Decompile ARM to YAML" for clarity
- **Lowercase filename generation** for consistency
- **Improved command registration** and context menu integration
- **Better error handling** during conversion process

#### 🛠️ Developer Experience
- **Cleaner validation logic** with unused imports removed
- **Refactored required fields** logic for maintainability
- **Enhanced TypeScript support** with proper type definitions
- **Improved code organization** and documentation

[View Full Changelog](https://github.com/noodlemctwoodle/SentinelCodeGuard/blob/main/CHANGELOG.md)

---

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Change-Log) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](https://github.com/noodlemctwoodle/SentinelCodeGuard/blob/main/LICENSE.txt) for details.

---

## 🔗 Resources

- **[Wiki Documentation](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki)** - Complete feature guides
- **[Microsoft Sentinel Docs](https://docs.microsoft.com/azure/sentinel/)** - Official documentation
- **[MITRE ATT&CK](https://attack.mitre.org/)** - Framework reference
- **[KQL Reference](https://docs.microsoft.com/azure/data-explorer/kusto/query/)** - Query language docs
- **[sentinel.blog](https://sentinel.blog)** - Additional tutorials and insights

---

**SentinelCodeGuard** - A development toolkit for Microsoft Sentinel Analytics Rules
