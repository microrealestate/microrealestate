import { mergeAttributes, Node } from '@tiptap/core';

const TemplateNode = Node.create({
  name: 'template',
  group: 'inline',

  inline: true,
  priority: 1000,
  selectable: false,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      renderLabel({ node }) {
        return node.attrs.label;
      },
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-template-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }

          return {
            'data-template-id': attributes.id,
          };
        },
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-template-label'),
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {};
          }
          return {
            'data-template-label': attributes.label,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': this.name },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      this.options.renderLabel({
        options: this.options,
        node,
      }),
    ];
  },

  renderText({ node }) {
    return this.options.renderLabel({
      options: this.options,
      node,
    });
  },

  addCommands() {
    return {
      addTemplate:
        (id, label) =>
        ({ commands }) => {
          return commands.insertContent([
            {
              type: this.name,
              attrs: {
                id,
                label,
              },
            },
            {
              type: 'text',
              text: ' ',
            },
          ]);
        },
    };
  },
});

export default TemplateNode;
