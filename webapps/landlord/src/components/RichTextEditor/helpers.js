import { getPageGeometry, normalizePageSetup } from './extensions/PageSetup';

const PRINT_FALLBACK_DELAY = 3000;

function buildPageRules(geometry) {
  const { margins } = geometry;

  // Explicit dimensions, never a paper name: a named size can lose to the print
  // destination's own paper, which silently prints an A4 document onto whatever
  // the destination defaults to while the editor lays out A4. The orientation
  // swap is already baked into widthMm/heightMm, so no keyword is needed.
  //
  // The margins declared here repeat on every sheet — unlike the editor
  // padding, which only ever applies once to the top of the document.
  return `
    @page {
      size: ${geometry.widthMm}mm ${geometry.heightMm}mm;
      /* Zero, deliberately. The browser draws its own header and footer — URL,
         date, page number — inside the page margin, and there is no API to turn
         that off, so the only way to suppress it is to leave no margin for it to
         occupy. The document's own margins are reinstated below, using exactly
         the model the editor uses on screen: padding for the first and last
         sheet, and the inter-page spacer for every boundary in between. */
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
      .page-frame {
        width: 100%;
      }
      .ProseMirror {
        /* Pinned rather than inferred: width auto would leave the column at the
           mercy of the frame's containing block, which is what made the printed
           text wrap differently from the editor. 100% is the page content box,
           whatever the frame does. */
        width: 100%;
        min-height: 0;
        padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm
          ${margins.left}mm;
        border-radius: 0;
        outline: none;
        /* The sheet edge is a painted background; without this it prints on
           every page. */
        background-image: none;
      }
      .page-gap,
      .page-break {
        height: var(--page-margin-top) !important;
        break-before: page;
        page-break-before: always;
      }
      .page-gap::after,
      .page-break::after {
        display: none;
      }
      .page-tail {
        display: none;
      }
    }
  `;
}

export async function handlePrint(editor) {
  const editorElement = document.querySelector('.ProseMirror');
  if (!editorElement) {
    return;
  }
  const clonedEditorElement = editorElement.cloneNode(true);
  const setup = normalizePageSetup(editor?.state?.doc?.attrs);
  const geometry = getPageGeometry(setup);

  // Off-screen rather than `display: none`: a frame that is never laid out has
  // no initial containing block to print from, and sizing it to the page keeps
  // the document's geometry right before `print()` switches to print media.
  // The width/height *attributes* are pixel-only, so the previous `'100%'` was
  // invalid and left the frame at its 300x150 default.
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = `
    position: fixed;
    left: -10000px;
    top: 0;
    width: ${geometry.widthMm}mm;
    height: ${geometry.heightMm}mm;
    border: 0;
  `;

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
  // The clone has to keep its page frame, or every `--page-*` custom property
  // is undefined in the iframe and the sheet's width, min-height and padding
  // all fall back to their initial values.
  const frameStyle = [
    `--page-width: ${geometry.widthMm}mm`,
    `--page-height: ${geometry.heightMm}mm`,
    `--page-margin-top: ${geometry.margins.top}mm`,
    `--page-margin-right: ${geometry.margins.right}mm`,
    `--page-margin-bottom: ${geometry.margins.bottom}mm`,
    `--page-margin-left: ${geometry.margins.left}mm`
  ].join('; ');

  const printableHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      ${linkHTML}
      <style>${buildPageRules(geometry)}</style>
    </head>
    <body>
      <div class="page-frame" style="${frameStyle}">
        ${clonedEditorElement.outerHTML}
      </div>
    </body>
  </html>
  `;

  // Printing before the copied stylesheets have loaded produces an unstyled
  // document, so wait for the iframe instead of guessing a delay.
  let printed = false;
  const print = () => {
    if (printed) {
      return;
    }
    printed = true;
    try {
      iframe.focus();
      iframe.contentWindow.print();
    } catch (error) {
      console.error(error);
    } finally {
      iframe.parentNode?.removeChild(iframe);
    }
  };

  iframe.addEventListener('load', print);
  // The load event does not fire in every browser for a document.write()
  // iframe; this keeps the button from doing nothing at all.
  setTimeout(print, PRINT_FALLBACK_DELAY);

  printDocument.open();
  printDocument.write(printableHTML);
  printDocument.close();
}
