export const ENTITY_COLORS = {
  PERSON: 'bg-blue-50 text-blue-600',
  ORG: 'bg-entity-tool-bg text-entity-tool-text',
  EVENT: 'bg-entity-sprint-bg text-entity-sprint-text',
  PRODUCT: 'bg-entity-issue-bg text-entity-issue-text',
  FEATURE: 'bg-rose-50 text-rose-600',
  SPRINT: 'bg-entity-sprint-bg text-entity-sprint-text',
  ISSUE_ID: 'bg-entity-issue-bg text-entity-issue-text',
  BUG: 'bg-entity-issue-bg text-entity-issue-text',
  TOOL: 'bg-entity-tool-bg text-entity-tool-text',
  DEFAULT: 'bg-gray-100 text-gray-600',
};

export function getEntityColor(label) {
  return ENTITY_COLORS[label] || ENTITY_COLORS.DEFAULT;
}
