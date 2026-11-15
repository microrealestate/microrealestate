import type { PropertyKind } from '@microrealestate/shared';
import { canHaveChildren, childUnits, type Unit } from './composition';

const STRUCTURAL_KINDS: readonly PropertyKind[] = [
  'estate',
  'building',
  'floor'
];

export type RowItem =
  | { kind: 'tile'; unit: Unit }
  | { kind: 'cluster'; unit: Unit; tiles: Unit[] };
export type Row = {
  kind: 'row';
  key: string;
  label?: Unit;
  other?: boolean;
  items: RowItem[];
};
export type Block = {
  kind: 'block';
  key: string;
  group?: Unit;
  content: (Row | Block)[];
};

export function rowTiles(row: Row) {
  return row.items.flatMap((item) =>
    item.kind === 'tile' ? [item.unit] : item.tiles
  );
}

const collator = new Intl.Collator(undefined, { numeric: true });

export function sortUnits(units: Unit[]) {
  return [...units].sort((a, b) =>
    a.type === 'floor' && b.type === 'floor'
      ? collator.compare(b.name, a.name)
      : collator.compare(a.name, b.name)
  );
}

// A group can include others and already includes some, or is not let itself
// and drawn as an empty container until it does. An empty estate, building
// or floor stays a tile: a labelled row with nothing in it says less than the
// tile itself. Everything else is a tile.
export function isGroup(unit: Unit, units: Unit[]) {
  if (!unit.type || !canHaveChildren(unit.type)) {
    return false;
  }
  if (childUnits(unit._id, units).length > 0) {
    return true;
  }
  return !unit.availableForRent && !STRUCTURAL_KINDS.includes(unit.type);
}

function isStructural(unit: Unit, units: Unit[]) {
  return (
    !!unit.type && STRUCTURAL_KINDS.includes(unit.type) && isGroup(unit, units)
  );
}

export function tilesIn(group: Unit, units: Unit[]): Unit[] {
  return childUnits(group._id, units).flatMap((child) =>
    isGroup(child, units) ? tilesIn(child, units) : [child]
  );
}

function narrow(group: Unit, scope?: Set<string>) {
  return scope?.has(group._id) ? undefined : scope;
}

function inScope(unit: Unit, scope?: Set<string>) {
  return !scope || scope.has(unit._id);
}

function rowItems(group: Unit, units: Unit[], scope?: Set<string>) {
  const items: RowItem[] = [];
  for (const child of sortUnits(childUnits(group._id, units))) {
    if (isStructural(child, units)) {
      continue;
    }
    if (isGroup(child, units)) {
      const clusterScope = narrow(child, scope);
      const tiles = sortUnits(tilesIn(child, units)).filter(
        ({ _id }) => !clusterScope || clusterScope.has(_id)
      );
      if (tiles.length || inScope(child, scope)) {
        items.push({ kind: 'cluster', unit: child, tiles });
      }
    } else if (inScope(child, scope)) {
      items.push({ kind: 'tile', unit: child });
    }
  }
  return items;
}

function blockContent(group: Unit, units: Unit[], matches?: Set<string>) {
  const scope = narrow(group, matches);
  const content: (Row | Block)[] = [];
  for (const child of sortUnits(childUnits(group._id, units))) {
    if (!isStructural(child, units)) {
      continue;
    }
    // a floor holding floors cannot happen (kinds matrix), but would nest
    const isRow =
      child.type === 'floor' &&
      !childUnits(child._id, units).some((unit) => isStructural(unit, units));
    if (!isRow) {
      const inner = blockContent(child, units, scope);
      if (inner.length || inScope(child, scope)) {
        content.push({
          kind: 'block',
          key: child._id,
          group: child,
          content: inner
        });
      }
    } else {
      const items = rowItems(child, units, narrow(child, scope));
      if (items.length || inScope(child, scope)) {
        content.push({ kind: 'row', key: child._id, label: child, items });
      }
    }
  }
  const own = rowItems(group, units, scope);
  if (own.length) {
    const key = `${group._id}-other`;
    const row: Row = { kind: 'row', key, items: own };
    if (content.some(({ kind }) => kind === 'block')) {
      content.push({ kind: 'block', key, content: [row] });
    } else {
      content.push(content.length ? { ...row, other: true } : row);
    }
  }
  return content;
}

export function stackingPlan(units: Unit[], matches?: Set<string>) {
  const ids = new Set(units.map(({ _id }) => _id));
  // a property whose parent is gone counts as part of nothing
  const roots = sortUnits(
    units.filter(({ parentId }) => !parentId || !ids.has(parentId))
  );
  const cards: Block[] = [];
  const others: Unit[] = [];
  for (const root of roots) {
    if (isStructural(root, units)) {
      const content = blockContent(root, units, matches);
      if (content.length || inScope(root, matches)) {
        cards.push({ kind: 'block', key: root._id, group: root, content });
      }
    } else if (isGroup(root, units)) {
      const scope = narrow(root, matches);
      const tiles = sortUnits(tilesIn(root, units)).filter(
        ({ _id }) => !scope || scope.has(_id)
      );
      if (tiles.length || inScope(root, matches)) {
        cards.push({
          kind: 'block',
          key: root._id,
          group: root,
          content: tiles.length
            ? [
                {
                  kind: 'row',
                  key: `${root._id}-other`,
                  items: tiles.map((unit) => ({ kind: 'tile', unit }))
                }
              ]
            : []
        });
      }
    } else if (inScope(root, matches)) {
      others.push(root);
    }
  }
  return { cards, others };
}
