import { Extension } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view';
import {
  appliedBefore,
  computeBreakPoints,
  type MeasuredBlock,
  type PageBreakPoint,
  signature
} from './pagebreaks';

/**
 * Measuring depends on the layout that the previous pass produced, so a pass can
 * in principle disagree with the one before it. Convergence happens on the
 * second pass in practice; this only stops a pathological document from looping.
 */
const MAX_PASSES = 4;

const paginationPluginKey = new PluginKey<DecorationSet>('pagination');

function buildDecorations(
  breakPoints: PageBreakPoint[],
  doc: EditorState['doc']
) {
  if (!breakPoints.length) {
    return DecorationSet.empty;
  }

  return DecorationSet.create(
    doc,
    breakPoints.map(({ pos, to, height, kind, extra }) => {
      if (kind === 'manual' || kind === 'collapsed') {
        return Decoration.node(
          pos,
          to as number,
          {
            style: `height: ${height}px`,
            ...(kind === 'collapsed' ? { class: 'page-break-collapsed' } : {})
          },
          { height, kind, extra }
        );
      }

      return Decoration.widget(
        pos,
        () => {
          const element = document.createElement('div');
          element.className = kind === 'gap' ? 'page-gap' : 'page-tail';
          element.style.height = `${height}px`;
          element.setAttribute('contenteditable', 'false');
          return element;
        },
        {
          side: kind === 'gap' ? -1 : 1,
          key: `page-${kind}-${pos}-${Math.round(height)}`,
          ignoreSelection: true,
          height,
          kind,
          extra
        }
      );
    })
  );
}

class PaginationView {
  private view: EditorView;
  private frame: number | null = null;
  private observer: ResizeObserver | null = null;
  private passes = 0;
  private destroyed = false;

  constructor(view: EditorView) {
    this.view = view;

    if (typeof ResizeObserver !== 'undefined') {
      // Catches page format, orientation and margin changes as well as content
      // growing a line. Deliberately does not reset the pass counter: our own
      // spacers resize the element too.
      this.observer = new ResizeObserver(() => this.schedule());
      this.observer.observe(view.dom);
    }

    // Measuring before the web fonts land puts every break in the wrong place.
    document.fonts?.ready.then(() => {
      this.passes = 0;
      this.schedule();
    });

    this.schedule();
  }

  update(view: EditorView, previousState: EditorState) {
    this.view = view;
    const { doc } = view.state;
    if (doc.eq(previousState.doc) && doc.attrs === previousState.doc.attrs) {
      return;
    }
    this.passes = 0;
    this.schedule();
  }

  destroy() {
    this.destroyed = true;
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
    }
    this.observer?.disconnect();
  }

  private schedule() {
    if (this.destroyed || this.frame !== null) {
      return;
    }
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.measure();
    });
  }

  private measure() {
    if (this.destroyed || this.passes >= MAX_PASSES) {
      return;
    }

    const dom = this.view.dom as HTMLElement;
    if (!dom.isConnected) {
      return;
    }

    const style = getComputedStyle(dom);
    const pageHeight = Number.parseFloat(style.minHeight);
    const paddingTop = Number.parseFloat(style.paddingTop);
    const paddingBottom = Number.parseFloat(style.paddingBottom);
    const contentHeight = pageHeight - paddingTop - paddingBottom;
    const gapHeight = paddingBottom + paddingTop;

    if (!Number.isFinite(contentHeight) || contentHeight <= 0) {
      return;
    }

    // The applied set is read back from the plugin, not from a local copy: its
    // positions have been mapped through every edit since, so they match the
    // spacers actually present in the DOM being measured.
    const applied = this.appliedBreakPoints();
    const contentTop = dom.getBoundingClientRect().top + paddingTop;

    const blocks: MeasuredBlock[] = [];
    this.view.state.doc.forEach((node, offset) => {
      const nodeDom = this.view.nodeDOM(offset);
      if (!(nodeDom instanceof HTMLElement)) {
        return;
      }
      const rect = nodeDom.getBoundingClientRect();
      const shift = appliedBefore(applied, offset) + contentTop;
      const marginTop = Number.parseFloat(getComputedStyle(nodeDom).marginTop);
      blocks.push({
        pos: offset,
        endPos: offset + node.nodeSize,
        isPageBreak: node.type.name === 'pageBreak',
        top: rect.top - shift,
        bottom: rect.bottom - shift,
        marginTop: Number.isFinite(marginTop) ? marginTop : 0
      });
    });

    const breakPoints = computeBreakPoints(
      blocks,
      this.view.state.doc.content.size,
      { contentHeight, gapHeight }
    );

    if (signature(breakPoints) === signature(applied)) {
      return;
    }

    this.passes += 1;
    this.view.dispatch(
      this.view.state.tr
        .setMeta(paginationPluginKey, breakPoints)
        .setMeta('addToHistory', false)
    );
    this.schedule();
  }

  private appliedBreakPoints(): PageBreakPoint[] {
    const decorations = paginationPluginKey.getState(this.view.state);
    if (!decorations) {
      return [];
    }
    return decorations.find().map((decoration) => {
      const spec = decoration.spec as {
        height?: number;
        kind?: PageBreakPoint['kind'];
        extra?: number;
      };
      const height = spec.height ?? 0;
      return {
        pos: decoration.from,
        to: decoration.to,
        height,
        kind: spec.kind ?? 'gap',
        extra: spec.extra ?? height
      };
    });
  }
}

const Pagination = Extension.create({
  name: 'pagination',

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: paginationPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, previous) {
            const breakPoints = tr.getMeta(paginationPluginKey) as
              | PageBreakPoint[]
              | undefined;
            if (breakPoints) {
              return buildDecorations(breakPoints, tr.doc);
            }
            return tr.docChanged ? previous.map(tr.mapping, tr.doc) : previous;
          }
        },
        props: {
          decorations(state) {
            return paginationPluginKey.getState(state);
          }
        },
        view: (view) => new PaginationView(view)
      })
    ];
  }
});

export default Pagination;
