import Quill from 'quill';

const Embed = Quill.import('blots/embed');

export default class TemplateField extends Embed {
  static create(value) {
    const domNode = super.create(value);
    domNode.innerHTML = value.title;
    domNode.setAttribute('data-type', value.type);
    domNode.setAttribute('data-marker', value.marker);
    domNode.setAttribute('data-title', value.title);
    return domNode;
  }

  static value(domNode) {
    return {
      type: domNode.getAttribute('data-type'),
      marker: domNode.getAttribute('data-marker'),
      title: domNode.getAttribute('data-title'),
    };
  }

  constructor(domNode) {
    super(domNode);
    this.type = domNode.getAttribute('data-type');
    this.marker = domNode.getAttribute('data-marker');
    this.title = domNode.getAttribute('data-title');
  }

  remove() {
    if (this.prev == null && this.next == null) {
      this.parent.remove();
    } else {
      super.remove();
    }
  }
}
TemplateField.blotName = 'template-field';
TemplateField.tagName = 'CODE';

Quill.register(TemplateField, true);
