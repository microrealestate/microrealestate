import { PAGE_SIZES_MM, PX_TO_MM_RATIO } from './pagesizes';

function removeAllPageBreaks(editorElement) {
  const pageBreakElements = editorElement.querySelectorAll('.page-break');
  pageBreakElements.forEach((pageBreakElement) => {
    pageBreakElement.remove();
  });
}

export function handlePageBreaks() {
  // todo passed as argument when editor will handle page sizes
  const pageConfig = {
    ...PAGE_SIZES_MM.A4,
    pageBreakHeight: 8 * PX_TO_MM_RATIO
  };

  // Remove all page breaks
  const editorElement = document.querySelector('.ProseMirror').parentElement;
  editorElement.style.position = 'relative';
  removeAllPageBreaks(editorElement);

  const editorHeight = editorElement.offsetHeight * PX_TO_MM_RATIO;

  const pageCount = Math.round(editorHeight / pageConfig.height);

  // Add the page breaks
  if (pageCount > 1) {
    editorElement.children[0].style.minHeight = `${pageCount * pageConfig.height}mm`;
    // don't add page break on last page
    for (let i = 1; i < pageCount; i++) {
      const top = i * pageConfig.height - pageConfig.pageBreakHeight - 5;
      const pageBreakElement = document.createElement('div');
      pageBreakElement.setAttribute('class', 'page-break');
      pageBreakElement.style.top = `${top}mm`;
      pageBreakElement.style.height = `${pageConfig.pageBreakHeight}mm`;
      pageBreakElement.style.width = `100%`;
      editorElement.append(pageBreakElement);
    }
  } else {
    editorElement.children[0].style.minHeight = `${pageConfig.height}mm`;
  }
}

export async function handlePrint() {
  const clonedEditorElement = document
    .querySelector('.ProseMirror')
    .cloneNode(true);

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.width = '100%';
  iframe.height = '100%';

  document.body.appendChild(iframe);
  const printDocument = iframe.contentWindow.document;
  const links = document.head.getElementsByTagName('link');
  const styles = document.head.getElementsByTagName('style');
  let linkHTML = '';
  for (let i = 0, len = links.length; i < len; i++) {
    linkHTML += links[i].outerHTML;
  }
  for (let i = 0, len = styles.length; i < len; i++) {
    linkHTML += styles[i].outerHTML;
  }
  const printableHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      ${linkHTML}
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        @media print {  
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
          }
          .ProseMirror {
            border: none;
          }
        }
      </style>
    </head>
    <body>
      ${clonedEditorElement.outerHTML}
    </body>
  </html>
  `;
  printDocument.write(printableHTML);

  setTimeout(() => {
    try {
      iframe.focus();
      iframe.contentWindow.print();
    } catch (error) {
      console.error(error);
    } finally {
      iframe.parentNode.removeChild(iframe);
    }
  }, 1000);
}
