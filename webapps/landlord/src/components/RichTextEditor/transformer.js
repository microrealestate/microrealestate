import * as htmlparser2 from 'htmlparser2';

export function toHandlebars(html) {
  return new Promise(function (resolve, reject) {
    let result = '';
    let ignore = false;
    const parser = new htmlparser2.Parser({
      onopentag(tagname, attributes) {
        /*
         * This fires when a new tag is opened.
         *
         * If you don't need an aggregated `attributes` object,
         * have a look at the `onopentagname` and `onattribute` events.
         */
        if (tagname === 'code') {
          result += attributes['data-marker'];
          ignore = true;
        } else if (!ignore) {
          result += `<${tagname} ${Object.entries(attributes)
            .filter(([name]) => name !== 'contenteditable')
            .reduce((acc, [name, value]) => {
              acc += `${name}='${value}'`;
              return acc;
            }, '')}>`;
        }
      },
      ontext(text) {
        /*
         * Fires whenever a section of text was processed.
         *
         * Note that this can fire at any point within text and you might
         * have to stich together multiple pieces.
         */
        if (!ignore) {
          result += text;
        }
      },
      onclosetag(tagname) {
        /*
         * Fires when a tag is closed.
         *
         * You can rely on this event only firing when you have received an
         * equivalent opening tag before. Closing tags without corresponding
         * opening tags will be ignored.
         */
        if (tagname === 'code') {
          ignore = false;
        } else if (!ignore) {
          result += `</${tagname}>`;
        }
      },
      onend() {
        resolve(result);
      },
      onerror(error) {
        reject(error);
      },
    });
    parser.write(html);
    parser.end();
  });
}
