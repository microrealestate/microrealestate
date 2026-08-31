import type { Chunk, DemoLeaseTemplate, Line } from './datasets/types.js';

type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string }[];
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function chunkToNode(chunk: Chunk): TipTapNode | null {
  if (typeof chunk === 'string') {
    // tiptap rejects empty text nodes
    return chunk ? { type: 'text', text: chunk } : null;
  }
  return {
    type: 'template',
    attrs: { id: chunk.field, label: chunk.label }
  };
}

function chunkToHtml(chunk: Chunk) {
  if (typeof chunk === 'string') {
    return escapeHtml(chunk);
  }
  return `<span data-type="template" class="template" data-template-id="${escapeHtml(chunk.field)}" data-template-label="${escapeHtml(chunk.label)}">${escapeHtml(chunk.label)}</span>`;
}

function paragraph(line: Line, textAlign?: string): TipTapNode {
  const content = line
    .map(chunkToNode)
    .filter((node): node is TipTapNode => node !== null);
  return {
    type: 'paragraph',
    attrs: { textAlign: textAlign ?? null },
    ...(content.length ? { content } : {})
  };
}

function heading(line: Line, level: number, textAlign?: string): TipTapNode {
  return {
    type: 'heading',
    attrs: { level, textAlign: textAlign ?? null },
    content: line
      .map(chunkToNode)
      .filter((node): node is TipTapNode => node !== null)
  };
}

function lineToHtml(line: Line, tag: string, style?: string) {
  const inner = line.map(chunkToHtml).join('');
  const attrs = style ? ` style="${style}"` : '';
  return `<${tag}${attrs}>${inner}</${tag}>`;
}

export function renderLeaseTemplate(template: DemoLeaseTemplate): {
  contents: Record<string, unknown>;
  html: string;
} {
  const nodes: TipTapNode[] = [heading(template.title, 1, 'center')];
  const htmlParts: string[] = [
    lineToHtml(template.title, 'h1', 'text-align: center')
  ];

  for (const line of template.intro) {
    nodes.push(paragraph(line));
    htmlParts.push(lineToHtml(line, 'p'));
  }

  template.clauses.forEach((clause, index) => {
    const headingLine: Line = [`${index + 1}. ${clause.heading}`];
    nodes.push(heading(headingLine, 2));
    htmlParts.push(lineToHtml(headingLine, 'h2'));
    for (const line of clause.lines) {
      nodes.push(paragraph(line));
      htmlParts.push(lineToHtml(line, 'p'));
    }
  });

  nodes.push(paragraph([]));
  htmlParts.push('<p></p>');

  for (const line of template.closing) {
    nodes.push(paragraph(line));
    htmlParts.push(lineToHtml(line, 'p'));
  }

  return {
    contents: { type: 'doc', content: nodes },
    html: htmlParts.join('')
  };
}
