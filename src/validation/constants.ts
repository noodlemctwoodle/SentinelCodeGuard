/**
 * Microsoft Sentinel Analytics Rules - Validation Constants
 * 
 * This file contains constant values used for validating Sentinel analytics rules.
 * Entity types are based on the official Microsoft documentation:
 * https://learn.microsoft.com/en-us/azure/sentinel/entities-reference
 */

// ============================================================================
// ENTITY TYPES
// ============================================================================
// Complete list based on Microsoft Sentinel entities reference
export const VALID_ENTITY_TYPES = [
    // Core Identity & Access
    'Account',
    'SecurityGroup',
    
    // Infrastructure
    'Host',
    'IP',
    'DNS',
    'URL',
    'NetworkConnection',
    'IoTDevice',
    
    // Files & Processes
    'File',
    'FileHash',
    'Process',
    'RegistryKey',
    'RegistryValue',
    
    // Cloud & Applications
    'AzureResource',
    'CloudApplication',
    
    // Communication
    'MailboxConfiguration',
    'MailMessage',
    'SubmissionMail',
    'MailCluster',
    
    // Security & Hunting
    'Malware',
    'Bookmark',
    'HuntingBookmark'
];

// ============================================================================
// SEVERITY LEVELS
// ============================================================================
// Supported alert severity levels in Microsoft Sentinel
export const VALID_SEVERITIES = [
    'Informational',
    'Low', 
    'Medium',
    'High'
];

// ============================================================================
// FIELD ORDERING
// ============================================================================
// Expected field order for Sentinel Analytics Rules (based on Microsoft best practices)
export const EXPECTED_ORDER = [
    // Rule Identity
    'id',
    'name', 
    'description',
    
    // Rule Configuration
    'severity',
    'requiredDataConnectors',
    'queryFrequency',
    'queryPeriod',
    'triggerOperator',
    'triggerThreshold',
    'status',
    
    // MITRE ATT&CK Framework
    'tactics',
    'techniques',
    'relevantTechniques',
    
    // Additional Metadata
    'tags',
    
    // Core Logic
    'query',
    
    // Entity & Incident Configuration
    'entityMappings',
    'incidentConfiguration',
    'eventGroupingSettings',
    
    // Suppression & Alerts
    'suppressionDuration',
    'suppressionEnabled',
    'alertDetailsOverride',
    'customDetails',
    
    // Rule Metadata
    'version',
    'kind'
];

// ============================================================================
// REQUIRED FIELDS
// ============================================================================
// Common fields required for all rule types
export const COMMON_REQUIRED_FIELDS = [
    // Essential Identity
    'id',
    'name',
    'description',
    
    // Rule Configuration (Common)
    'severity',
    'requiredDataConnectors',
    
    // MITRE Classification (Required)
    'tactics',
    
    // Core Detection Logic
    'query',
    
    // Entity Mapping (Required for proper alerting)
    'entityMappings',
    
    // Rule Metadata (Required)
    'version',
    'kind',
];

// Additional fields required specifically for Scheduled rules
export const SCHEDULED_REQUIRED_FIELDS = [
    'queryFrequency',
    'queryPeriod',
    'triggerOperator',
    'triggerThreshold',
];

// Additional fields required specifically for NRT rules
export const NRT_REQUIRED_FIELDS = [
    // NRT rules don't require queryFrequency, queryPeriod, triggerOperator, or triggerThreshold
];

/**
 * Get required fields for a specific rule kind
 */
export function getRequiredFieldsForKind(kind: string): string[] {
    const commonFields = [...COMMON_REQUIRED_FIELDS];
    
    switch (kind?.toLowerCase()) {
        case 'scheduled':
            return [...commonFields, ...SCHEDULED_REQUIRED_FIELDS];
        case 'nrt':
            return [...commonFields, ...NRT_REQUIRED_FIELDS];
        default:
            // Default to Scheduled rules for unknown kinds
            return [...commonFields, ...SCHEDULED_REQUIRED_FIELDS];
    }
}

// Legacy export for backward compatibility (defaults to Scheduled rules)
export const REQUIRED_FIELDS = [
    ...COMMON_REQUIRED_FIELDS,
    ...SCHEDULED_REQUIRED_FIELDS
];

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================
// Regular expressions for validating field formats

export const VALIDATION_PATTERNS = {
    // GUID format for rule IDs
    GUID: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    
    // Semantic version format (e.g., 1.0.0)
    VERSION: /^[0-9]+\.[0-9]+\.[0-9]+$/,
    
    // ISO 8601 duration format (e.g., PT5M, P1D)
    ISO_DURATION: /^P(?:(?:[0-9]+D)?(?:T(?:[0-9]+H)?(?:[0-9]+M)?(?:[0-9]+S)?)?|(?:[0-9]+W))$/,
    
    // MITRE ATT&CK technique format (e.g., T1566, T1566.001)
    MITRE_TECHNIQUE: /^T[0-9]{4}(?:\.[0-9]{3})?$/,
    
    // Valid tactic name format (PascalCase)
    TACTIC_NAME: /^[A-Z][a-zA-Z]{2,30}$/,
    
    // Valid entity type format (PascalCase)
    ENTITY_TYPE: /^[A-Z][a-zA-Z0-9]*$/,
    
    // Valid connector ID format
    CONNECTOR_ID: /^[A-Za-z][A-Za-z0-9]*$/
} as const;

// ============================================================================
// RULE KINDS
// ============================================================================
// Rule types that users can actually create in Microsoft Sentinel
export const VALID_RULE_KINDS = [
    'Scheduled',    // Custom KQL-based detection rules (most common)
    'NRT'          // Near Real-Time rules (sub-minute latency)
] as const;

// System-managed rule types (read-only, cannot be created by users)
export const SYSTEM_RULE_KINDS = [
    'MicrosoftSecurityIncidentCreation',  // Auto-generated from Microsoft security products
    'MLBehaviorAnalytics',               // Microsoft's machine learning behavioral rules
    'Fusion',                            // AI multistage attack detection
    'ThreatIntelligence'                 // Microsoft threat intelligence matching
] as const;

// ============================================================================
// TRIGGER OPERATORS
// ============================================================================
// Valid operators for trigger conditions
export const VALID_TRIGGER_OPERATORS = [
    'gt',    // Greater than
    'lt',    // Less than
    'eq',    // Equal to
    'ne'     // Not equal to
] as const;

// ============================================================================
// DURATION CONVERSION PATTERNS
// ============================================================================
// Common duration format patterns for auto-correction to ISO 8601
export const DURATION_CONVERSION_PATTERNS = [
    { regex: /^(\d+)h$/i, replacement: 'PT$1H' },          // 5h -> PT5H
    { regex: /^(\d+)m$/i, replacement: 'PT$1M' },          // 30m -> PT30M
    { regex: /^(\d+)s$/i, replacement: 'PT$1S' },          // 60s -> PT60S
    { regex: /^(\d+)d$/i, replacement: 'P$1D' },           // 1d -> P1D
    { regex: /^(\d+):(\d+):(\d+)$/i, replacement: 'PT$1H$2M$3S' }, // 1:30:00 -> PT1H30M0S
] as const;

// Special case pattern for weeks (needs calculation)
export const WEEKS_PATTERN = /^(\d+)w$/i;

// ============================================================================
// SENTINEL RULE DETECTION
// ============================================================================
// Fields that indicate this is likely a Sentinel analytics rule
export const SENTINEL_RULE_INDICATORS = [
    // Core Sentinel-specific fields
    'tactics',
    'techniques', 
    'queryFrequency',
    'queryPeriod',
    'triggerOperator',
    'triggerThreshold',
    'entityMappings',
    'requiredDataConnectors',
    
    // Additional Sentinel fields
    'suppressionDuration',
    'alertDetailsOverride',
    'incidentConfiguration',
    'eventGroupingSettings'
] as const;

// Minimum number of indicators required to consider it a Sentinel rule
export const MIN_SENTINEL_INDICATORS = 3;

// ============================================================================
// EXPORTS
// ============================================================================
// Export type definitions for better TypeScript support
export type EntityType = typeof VALID_ENTITY_TYPES[number];
export type Severity = typeof VALID_SEVERITIES[number];
export type RuleKind = typeof VALID_RULE_KINDS[number];
export type TriggerOperator = typeof VALID_TRIGGER_OPERATORS[number];