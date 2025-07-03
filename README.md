# SentinelCodeGuard

![Beta](https://img.shields.io/badge/status-beta-orange) ![Version](https://img.shields.io/badge/version-0.0.9-blue) ![License](https://img.shields.io/badge/license-MIT-green)

**Development toolkit for Microsoft Sentinel Analytics Rules**

*Guard your Sentinel rules with precision*

---

## 📖 Documentation

**Complete documentation is available in our [Wiki](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki)**

- **[Getting Started Guide](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki#-quick-start)** - Complete feature overview and quick start
- **[Rule Templates](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Rule-Templates)** - Professional templates with best practices
- **[ARM to YAML Conversion](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Decompile-ARM-to-YAML)** - Comprehensive migration guide
- **[Configuration](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Configuration-Guide)** - Detailed setup and customization

---

## Beta Notice

**SentinelCodeGuard is currently in beta (v0.0.9).** We're actively developing and improving the extension. Please report any issues or feedback via [GitHub Issues](https://github.com/noodlemctwoodle/SentinelCodeGuard/issues).

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

## 📈 Recent Updates

### v0.0.9 (2025-07-03)

#### 🆔 GUID Management Features

- **Regenerate Rule GUID** - Right-click on YAML files to replace existing GUIDs with new ones
- **Add Missing GUID** - Automatically detect files without GUIDs and offer to add them
- **Smart GUID Detection** - Recognises both actual GUIDs and template placeholders (`{{GUID}}`)
- **Confirmation Dialogs** - Preview old and new GUIDs before replacement
- **Auto-GUID Templates** - All new templates automatically replace `{{GUID}}` placeholders with real UUIDs

#### 🛠️ Enhanced Template Experience

- **Unique IDs for Every Template** - No more duplicate GUIDs when creating multiple templates
- **Proper Indentation Preservation** - GUID replacement maintains YAML formatting
- **Context Menu Integration** - "Regenerate Rule GUID" available via right-click
- **Bulk Template Creation** - Each template gets a unique GUID automatically

#### 🎯 Developer Productivity

- **Quick GUID Regeneration** - Perfect for duplicating existing rules
- **Template-to-Production** - Convert templates with placeholder GUIDs to production-ready rules
- **Rule Duplication Workflow** - Copy existing rules and generate new GUIDs instantly
- **Error Prevention** - Ensures unique identifiers across rule sets

### v0.0.8 (2025-07-02)

#### 🎯 Enhanced Template Creation Workflow

- **Interactive template selection** with visual quick-pick interface
- **Intelligent right-click workflow** - Right-click folder → Create Sentinel Rule Template → Choose type → Select location
- **All template types available** from context menu (Standard, Advanced, NRT, Behaviour Analytics, Minimal, Fallback)
- **Smart default locations** using right-clicked folder path
- **Professional file naming** with template-specific suggestions

#### 🛠️ Improved User Experience

- **Single entry point** for all template creation via "Create Sentinel Rule Template..."
- **Step-by-step workflow** with clear prompts and cancellation support
- **Automatic file opening** after template creation
- **Enhanced notifications** for success and error states
- **Native VS Code integration** using standard save dialogues and UI patterns

#### 📋 Template Management

- **Visual template selection** with icons, descriptions, and use cases
- **Template-specific filenames** following established naming conventions
- **Support for both extensions** (.yaml and .yml)
- **Comprehensive template library** covering all Sentinel rule scenarios

[View Full Changelog](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Change-Log)

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

## 📋 Available Templates

| Template | Complexity | Use Case | Target Audience |
|----------|------------|----------|-----------------|
| **[Minimal](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Rule-Templates#minimal-template)** | ![Low](https://img.shields.io/badge/complexity-low-green) | Quick prototyping | New users, rapid testing |
| **[Standard](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Rule-Templates#standard-template)** | ![Medium](https://img.shields.io/badge/complexity-medium-yellow) | General detection | SOC analysts, security engineers |
| **[Advanced](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Rule-Templates#advanced-template)** | ![High](https://img.shields.io/badge/complexity-high-orange) | Complex correlation | Senior analysts, threat hunters |
| **[NRT](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Rule-Templates#near-real-time-template)** | ![Medium](https://img.shields.io/badge/complexity-medium-yellow) | Real-time alerts | Critical asset monitoring |
| **[Anomaly Detection](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Rule-Templates#anomaly-detection-template)** | ![High](https://img.shields.io/badge/complexity-high-orange) | Behavioural analysis | Advanced threat hunting |

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

For comprehensive configuration options, see: **[Configuration Guide](https://github.com/noodlemctwoodle/SentinelCodeGuard/wiki/Configuration-Guide#advanced-conversion-settings)**

---

## 🆘 Support & Troubleshooting

### Resources

- **[Microsoft Sentinel Docs](https://docs.microsoft.com/azure/sentinel/)** - Official documentation
- **[MITRE ATT&CK](https://attack.mitre.org/)** - Framework reference
- **[KQL Reference](https://docs.microsoft.com/azure/data-explorer/kusto/query/)** - Query language docs

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](https://github.com/noodlemctwoodle/SentinelCodeGuard/blob/main/LICENSE.txt) for details.

---

**SentinelCodeGuard** - A development toolkit for Microsoft Sentinel Analytics Rules
