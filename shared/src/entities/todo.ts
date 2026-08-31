export const TODO_TYPE = {
  SETUP_CONTRACT: 'setup_contract',
  SETUP_PROPERTY: 'setup_property',
  SETUP_TENANT: 'setup_tenant',
  SETUP_EMAIL: 'setup_email'
} as const;
export type TodoTypeKind = (typeof TODO_TYPE)[keyof typeof TODO_TYPE];

export const SETUP_TODO_TYPES = [
  TODO_TYPE.SETUP_CONTRACT,
  TODO_TYPE.SETUP_PROPERTY,
  TODO_TYPE.SETUP_TENANT,
  TODO_TYPE.SETUP_EMAIL
] as const;

export interface TodoType {
  _id: string;
  realmId: string;
  type: TodoTypeKind;
  blocked?: boolean;
}
