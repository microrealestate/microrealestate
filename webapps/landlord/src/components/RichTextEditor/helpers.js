let A4_HEIGHT;
let WRAPPER_ELEMENT;
let EDITOR_ELEMENT;

function _init(editor) {
  WRAPPER_ELEMENT = editor.options.element;
  if (WRAPPER_ELEMENT.getAttribute('class')) {
    // already initiated
    return;
  }
  WRAPPER_ELEMENT.setAttribute('class', 'editor-wrapper');
  EDITOR_ELEMENT = WRAPPER_ELEMENT.getElementsByClassName('ProseMirror')[0];
  A4_HEIGHT = _getStyleValue(EDITOR_ELEMENT, 'min-height');
}

function _getStyleValue(element, style) {
  // const devicePixelRatio = window.devicePixelRatio || 1;
  const value = Number(
    window.getComputedStyle(element).getPropertyValue(style).replace('px', '')
  );
  // * devicePixelRatio;

  return value;
}

function _removeAllPageBreaks() {
  const pageBreakElements = WRAPPER_ELEMENT.querySelectorAll('.page-break');
  pageBreakElements.forEach((pageBreakElement) => pageBreakElement.remove());
}

export function handlePageBreaks(editor) {
  _init(editor);

  // Remove all page breaks
  _removeAllPageBreaks();

  // reset editor min-height to one page to recompute it later
  EDITOR_ELEMENT.style.minHeight = window
    .getComputedStyle(document.body)
    .getPropertyValue('--tiptap-page-height');

  const editorHeight = _getStyleValue(EDITOR_ELEMENT, 'height');
  const editorTopMargin = _getStyleValue(
    document.body,
    '--tiptap-page-margin-top'
  );
  const pageCount = Math.ceil(editorHeight / A4_HEIGHT);
  const pageBreakHeight = _getStyleValue(
    document.body,
    '--tiptap-page-break-height'
  );

  // Add the page breaks
  if (pageCount > 1) {
    EDITOR_ELEMENT.style.minHeight = `${pageCount * A4_HEIGHT}px`;
    for (let i = 1; i < pageCount; i++) {
      const top = i * A4_HEIGHT - pageBreakHeight / 2 + editorTopMargin;
      const pageBreakElement = document.createElement('div');
      pageBreakElement.setAttribute('class', 'page-break');
      pageBreakElement.style.top = `${top}px`;
      WRAPPER_ELEMENT.append(pageBreakElement);
    }
  }
}

export async function handlePrint(editor) {
  _init(editor);

  const clonededitorElement = WRAPPER_ELEMENT.cloneNode(true);

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  const printDocument = iframe.contentWindow.document;
  const links = document.head.getElementsByTagName('link');
  const styles = document.head.getElementsByTagName('style');
  let linkHTML = '';
  for (let i = 0, len = links.length; i < len; i++) {
    linkHTML += links[i].outerHTML;
  }
  for (let i = 0, len = styles.length; i < len; i++) {
    if (styles[i].getAttribute('data-jss') !== '') {
      linkHTML += styles[i].outerHTML;
    }
  }
  printDocument.write(`
  <!DOCTYPE html>
  <html>
    <head>
      ${linkHTML}
      <style>
        @page {
          margin:0 !important;
          margin-top:0 !important;
          padding: 0 !important;
        }
        
        @media print {
          body {
            margin:0 !important;
            margin-top:0 !important;
            padding: 0 !important;
          }
        }

        body {
          margin:0;
          padding: 0;
          font-size: 0.875rem;
          font-family: "Roboto", "Helvetica", "Arial", sans-serif;
          font-weight: 400;
          line-height: 1.43;
          letter-spacing: 0.01071em;
        }

        .ProseMirror {
          margin-top: 0;
          box-shadow: none;
          background: none;
          border: none;
        }

        .editor-wrapper {
          position: relative;
          padding: 0;
          margin: 0;
          top: unset;
          overflow: unset;
        }

        .page-break {
          display: none;
        }
      </style>
    </head>
    <body>
    <div class='editor-wrapper'>
      ${clonededitorElement.innerHTML}
    </div>
    </body>
  </html>
  `);
  setTimeout(function () {
    try {
      iframe.focus();
      // TODO: support of IE and EDGE
      // try {
      //   // IE or Edge
      //   iframe.contentWindow.document.execCommand('print', false, null);
      // } catch (e) {
      iframe.contentWindow.print();
      // }
    } catch (error) {
      console.error(error);
    } finally {
      iframe.parentNode.removeChild(iframe);
    }
  }, 1000);
}
