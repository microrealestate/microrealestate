import Quill from 'quill';
import TemplateField from './TemplateField';

const Block = Quill.import('blots/block');

class TemplateLoopBlock extends Block {
  static create(value) {
    const domNode = super.create(value);
    domNode.classList.add('template-loop-block');
    domNode.setAttribute('data-loop-id', value.id);
    domNode.setAttribute('data-marker', value.marker);
    domNode.setAttribute('data-title', value.title);
    domNode.setAttribute('data-type', value.type);
    return domNode;
  }

  static formats(domNode) {
    return {
      id: domNode.getAttribute('data-loop-id'),
      type: domNode.getAttribute('data-type'),
      marker: domNode.getAttribute('data-marker'),
      title: domNode.getAttribute('data-title'),
    };
  }

  constructor(domNode) {
    super(domNode);
    this.loopId = domNode.getAttribute('data-loop-id');
    this.type = domNode.getAttribute('data-type');
    this.marker = domNode.getAttribute('data-marker');
    this.title = domNode.getAttribute('data-title');
    domNode.removeAttribute('contenteditable');
    domNode.removeAttribute('data-begin-loop');
    domNode.removeAttribute('data-end-loop');
  }

  insertBefore(blot, ref) {
    super.insertBefore(blot, ref);

    // TODO: check if this code is following quill/parchment best practices
    const domLoopRows = this.parent
      ? Array.from(
          this.parent.domNode.querySelectorAll(
            `.template-loop-block[data-loop-id='${this.loopId}']`
          )
        )
      : [];
    if (domLoopRows.length) {
      domLoopRows.forEach((domRow, index) => {
        let rowWithLoopData = false;
        if (index === 0) {
          domRow.setAttribute('data-begin-loop', true);
          domRow.setAttribute('contenteditable', false);
          domRow.removeAttribute('data-end-loop');
          rowWithLoopData = true;
        }
        if (index === domLoopRows.length - 1) {
          domRow.setAttribute('data-end-loop', true);
          rowWithLoopData = true;
        }
        if (!rowWithLoopData) {
          domRow.removeAttribute('data-begin-loop');
          domRow.removeAttribute('data-end-loop');
        }
      });
    }
  }
}
TemplateLoopBlock.blotName = 'template-loop-block';
TemplateLoopBlock.tagName = 'DIV';
TemplateLoopBlock.allowedChildren.push(TemplateField);
Quill.register(TemplateLoopBlock, true);
