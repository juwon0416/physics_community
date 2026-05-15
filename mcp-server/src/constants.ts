export const FIELD_IDS = [
    'classical',
    'quantum',
    'statistical',
    'electrodynamics',
    'mathematical-physics',
] as const;

export type FieldId = (typeof FIELD_IDS)[number];

export const MCP_SERVER_NAME = 'physics-community';
export const MCP_SERVER_VERSION = '0.1.0';
