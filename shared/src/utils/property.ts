import {
  PROPERTY_KIND_CHILDREN,
  type PropertyKind
} from '../entities/property';

export function canContain(
  parentKind: PropertyKind | undefined,
  childKind: PropertyKind | undefined
): boolean {
  if (!parentKind || !childKind) {
    return false;
  }
  return PROPERTY_KIND_CHILDREN[parentKind]?.includes(childKind) ?? false;
}

/**
 * one key per label, shared by every property: "Année de construction" -> "annee_de_construction"
 */
export function customFieldKey(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function customFieldMarker(key: string): string {
  return `{{properties.list.[0].customField.[${key}]}}`;
}

export function customFieldNameKey(label: string): string {
  return customFieldKey(label) || label.trim().toLowerCase();
}
