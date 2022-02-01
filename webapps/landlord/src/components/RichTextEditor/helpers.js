const A4 = {
  heightMM: 297,
  widthMM: 209.9,
};

const PAGE_BREAK_HEIGHT = 40; // px

let INITIALIZED = false;
let DPI;
let WRAPPER_ELEMENT;
let EDITOR_ELEMENT;

function _init(editor) {
  DPI = _computeDPI();

  A4.height = (A4.heightMM * DPI.y) / 25.4; // 25.4 inch in mm
  A4.width = (A4.widthMM * DPI.x) / 25.4;

  WRAPPER_ELEMENT = editor.options.element;
  WRAPPER_ELEMENT.setAttribute('class', 'editor-wrapper');
  EDITOR_ELEMENT = WRAPPER_ELEMENT.getElementsByClassName('ProseMirror')[0];

  // TODO optimized call of _init
  // INITIALIZED = true;
}

function _computeDPI() {
  const dpi = {};
  if (window.screen.deviceXDPI != undefined) {
    dpi.x = window.screen.deviceXDPI;
    dpi.y = window.screen.deviceYDPI;
  } else {
    const tmpNode = document.createElement('div');
    tmpNode.style.cssText =
      'width:1in;height:1in;position:absolute;left:0px;top:0px;z-index:99;visibility:hidden';
    document.body.appendChild(tmpNode);
    dpi.x = parseInt(tmpNode.offsetWidth);
    dpi.y = parseInt(tmpNode.offsetHeight);
    tmpNode.parentNode.removeChild(tmpNode);
  }
  return dpi;
}

const _removeAllPageBreaks = () => {
  const pageBreakElements = WRAPPER_ELEMENT.querySelectorAll('.page-break');
  pageBreakElements.forEach((pageBreakElement) => pageBreakElement.remove());
};

export const handlePageBreaks = (editor) => {
  if (!INITIALIZED) {
    _init(editor);
  }

  // get editor height in pixels
  const editorHeight = Number(
    window
      .getComputedStyle(EDITOR_ELEMENT)
      .getPropertyValue('height')
      .replace('px', '')
  );

  // Remove all page breaks
  _removeAllPageBreaks();

  // Add the page breaks
  const pageCount = editorHeight / A4.height;
  for (let i = 1; i <= pageCount; i++) {
    const pageBreakElement = document.createElement('div');
    pageBreakElement.setAttribute('class', 'page-break');
    pageBreakElement.style.top = `${
      (i * A4.heightMM * DPI.y) / 25.4 - PAGE_BREAK_HEIGHT / 2
    }px`;
    WRAPPER_ELEMENT.append(pageBreakElement);
  }
};

export const handlePrint = async (editor) => {
  if (!INITIALIZED) {
    _init(editor);
  }

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
          box-shadow: none;
          background: none;
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
};
