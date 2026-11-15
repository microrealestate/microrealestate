import {
  canContain,
  PROPERTY_KIND_CHILDREN,
  type PropertyKind
} from '@microrealestate/shared';

export type Unit = {
  _id: string;
  name: string;
  type?: PropertyKind;
  parentId?: string;
  availableForRent: boolean;
  status?: string;
  price?: number;
};

// The select field cannot hold an empty value, so "no parent" has its own.
export const NO_PARENT = 'none';

export const NOT_FOR_RENT = 'notforrent';

// Colors of a status, shared by the stacking plan tiles and its legend.
export const STATUS_CLASSES: Record<string, string> = {
  vacant: 'border-success bg-success/10',
  occupied: 'bg-secondary',
  [NOT_FOR_RENT]: 'border-dashed bg-card'
};

export function ancestors<T extends Unit>(unit: T, units: T[]): T[] {
  const unitsById = new Map(units.map((u) => [u._id, u]));
  const path: T[] = [];
  const visited = new Set([unit._id]);
  let parent = unit.parentId ? unitsById.get(unit.parentId) : undefined;
  while (parent && !visited.has(parent._id)) {
    path.unshift(parent);
    visited.add(parent._id);
    parent = parent.parentId ? unitsById.get(parent.parentId) : undefined;
  }
  return path;
}

export function parentPath(unit: Unit, units: Unit[]): string[] {
  return ancestors(unit, units).map(({ name }) => name);
}

function descendantIds(unitId: string, units: Unit[]): Set<string> {
  const ids = new Set<string>();
  const queue = [unitId];
  while (queue.length) {
    const id = queue.shift();
    for (const u of units) {
      if (u.parentId === id && !ids.has(u._id)) {
        ids.add(u._id);
        queue.push(u._id);
      }
    }
  }
  return ids;
}

export function parentCandidates(
  unitId: string | undefined,
  kind: PropertyKind | undefined,
  units: Unit[]
): Unit[] {
  const excluded = unitId ? descendantIds(unitId, units) : new Set<string>();
  return units.filter(
    (u) => u._id !== unitId && !excluded.has(u._id) && canContain(u.type, kind)
  );
}

export function canHaveParent(kind: PropertyKind | undefined): boolean {
  return (
    !!kind &&
    Object.values(PROPERTY_KIND_CHILDREN).some((kinds) => kinds.includes(kind))
  );
}

export function canHaveChildren(kind: PropertyKind | undefined): boolean {
  return !!kind && PROPERTY_KIND_CHILDREN[kind].length > 0;
}

export function hasStructure(unit: Unit, units: Unit[]): boolean {
  return (
    canHaveChildren(unit.type) ||
    parentCandidates(unit._id, unit.type, units).length > 0
  );
}

export function attachCandidates(unit: Unit, units: Unit[]): Unit[] {
  const ancestorIds = new Set(ancestors(unit, units).map(({ _id }) => _id));
  return units.filter(
    (u) =>
      !u.parentId &&
      u._id !== unit._id &&
      !ancestorIds.has(u._id) &&
      canContain(unit.type, u.type)
  );
}

export function canMove(unit: Unit, units: Unit[]): boolean {
  return (
    !!unit.parentId || parentCandidates(unit._id, unit.type, units).length > 0
  );
}

export function childUnits(unitId: string, units: Unit[]): Unit[] {
  return units.filter((u) => u.parentId === unitId);
}

export function defaultChildKind(
  parent: Unit,
  units: Unit[]
): PropertyKind | undefined {
  const kinds = parent.type ? PROPERTY_KIND_CHILDREN[parent.type] : [];
  const counts = new Map<PropertyKind, number>();
  for (const { type } of childUnits(parent._id, units)) {
    if (type && kinds.includes(type)) {
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
  }
  let best: PropertyKind | undefined = kinds[0];
  let bestCount = 0;
  for (const [kind, count] of counts) {
    if (count > bestCount) {
      best = kind;
      bestCount = count;
    }
  }
  return best;
}

// The status shown and filtered on: a vacant unit kept only to group others
// is not vacant stock.
export function displayStatus(unit: Unit): string | undefined {
  return unit.status === 'vacant' && !unit.availableForRent
    ? NOT_FOR_RENT
    : unit.status;
}
