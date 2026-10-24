export type PageBreakPoint = {
  pos: number;
  height: number;
  kind: 'gap' | 'manual' | 'collapsed' | 'tail';
  to?: number;
  extra: number;
};

export type MeasuredBlock = {
  pos: number;
  endPos: number;
  isPageBreak: boolean;
  top: number;
  bottom: number;
  marginTop: number;
};

export type PageGeometry = {
  contentHeight: number;
  gapHeight: number;
};

export function computeBreakPoints(
  blocks: MeasuredBlock[],
  docSize: number,
  { contentHeight, gapHeight }: PageGeometry
): PageBreakPoint[] {
  const breakPoints: PageBreakPoint[] = [];
  let pageStart = 0;
  let lastBottom = 0;

  blocks.forEach((block, index) => {
    const { pos, endPos, isPageBreak, top, bottom, marginTop } = block;

    if (isPageBreak) {
      // A break opening the document ends nothing: there is no content above it
      // to close a sheet with, and Chrome drops a `break-before` at the very
      // start of the flow, so counting it would manufacture a leading blank
      // sheet the paper never has. Only this case — two *consecutive* breaks do
      // each produce a page in Chrome, verified against a rendered PDF, so they
      // must not be collapsed.
      if (index === 0) {
        breakPoints.push({
          pos,
          to: endPos,
          height: 0,
          kind: 'collapsed',
          extra: -gapHeight
        });
        return;
      }

      // Clamped, never gated: a break that ends a page must always be emitted,
      // or the page count is lost. A negative fill only means the boundary has
      // already been passed — the preceding block's trailing margin straddles
      // it — and dropping the break there loses a whole page.
      const fill = Math.max(0, pageStart + contentHeight - top);

      breakPoints.push({
        pos,
        to: endPos,
        height: fill + gapHeight,
        kind: 'manual',
        extra: fill
      });

      // Derived, never measured: this node's own decoration inflates its
      // measured height while `appliedBefore` deliberately excludes that extra
      // so its `top` stays recoverable. Before any stretch it is `gapHeight`
      // tall, and the next block's margin box starts there.
      const naturalBottom = top + gapHeight;
      pageStart = naturalBottom;
      lastBottom = naturalBottom;
      return;
    }

    // A page begins at the block's MARGIN box, not its border box. Once a
    // spacer sits above the block its top margin no longer collapses, so that
    // margin is drawn at the top of the new sheet and spends the page's budget.
    const marginBoxTop = top - marginTop;

    if (bottom - pageStart > contentHeight && marginBoxTop > pageStart) {
      const fill = Math.max(0, pageStart + contentHeight - marginBoxTop);
      breakPoints.push({
        pos,
        height: fill + gapHeight,
        kind: 'gap',
        extra: fill + gapHeight
      });
      // A node taller than a whole page overflows its sheet rather than being
      // split; the `marginBoxTop > pageStart` guard keeps that from looping.
      pageStart = marginBoxTop;
    }

    lastBottom = bottom;
  });

  const tail = pageStart + contentHeight - lastBottom;
  if (breakPoints.length && tail > 0) {
    breakPoints.push({ pos: docSize, height: tail, kind: 'tail', extra: tail });
  }

  return breakPoints;
}

export function appliedBefore(applied: PageBreakPoint[], pos: number): number {
  return applied.reduce((total, breakPoint) => {
    // A stretched `pageBreak` node never shifts its own rect, so it counts only
    // for the blocks after it; a widget sits before its block and counts for
    // that block too.
    const isNode =
      breakPoint.kind === 'manual' || breakPoint.kind === 'collapsed';
    const counts = isNode ? breakPoint.pos < pos : breakPoint.pos <= pos;
    return counts ? total + breakPoint.extra : total;
  }, 0);
}

export function signature(breakPoints: PageBreakPoint[]): string {
  return breakPoints
    .map(
      ({ pos, to, height, kind }) =>
        `${kind}:${pos}:${to ?? pos}:${Math.round(height)}`
    )
    .join('|');
}
