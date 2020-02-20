import JSONEditor, { Node, JSONEditorOptions } from 'jsoneditor';
import { faNames } from './fontawesome-names';
import * as tasty from 'tasty.js';
import {MenuItemDefinition} from "tasty.js/dist/lib/interfaces/menu-item-definition";

export default class TastyBuilder {
  /**
     * @type {HTMLElement}
     */
  canvasContainer: HTMLElement;

  /**
     * @type {tasty.Menu}
     */
  menu: tasty.Menu | undefined;

  /**
     * Initial Menu Structure
     *
     * @type {Object}
     */
  _structure = {
    id: 'root',
    direction: 0,
    text: 'Main Menu',
    icon: 'bars',
    children: [],
  };

  /**
     * jsoneditor instance
     */
  editor: JSONEditor | undefined;

  /**
     * @type {HTMLElement}
     */
  editorContainer: HTMLElement;

  /**
     * Flag if json schema is valid for tasty.js
     *
     * @type {boolean}
     * @private
     */
  _isValidJson = false;

  /**
     * Update BTN
     *
     * @type {HTMLElement}
     */
  updateBtn: HTMLElement;

  /**
     * Warning container
     */
  warn: HTMLElement;

  constructor() {
    this.canvasContainer = <HTMLElement>document.getElementById('canvas');
    this.editorContainer = <HTMLElement>document.getElementById('output');

    this.updateBtn = <HTMLElement>document.getElementById('update');
    this.warn = <HTMLElement>document.getElementById('warn');

    this._initMenu();
    this._initEditor();
    this._displayMenu();

    // @ts-ignore
    this.updateBtn.addEventListener('click', () => {
      if (typeof this.editor === 'undefined') {
        return;
      }

      if (!this._checkStruct(this.editor.get())) {
        return;
      }

      if (!this._isValidJson) {
        this.warn.textContent = 'JSON is not valid.';
        return false;
      }

      this._structure = this.editor.get();

      (<HTMLTextAreaElement>document.getElementById('jsonOutput')).value = JSON.stringify(this.editor.get());
      this._displayMenu();
    });

    (<HTMLElement>document.getElementById('load')).addEventListener('click', () => {
      const fromJson = JSON.parse((<HTMLTextAreaElement>document.getElementById('jsonOutput')).value);
      if (fromJson !== '') {
        (<JSONEditor> this.editor).set(fromJson);

        if (!this._checkStruct(fromJson)) {
          return;
        }

        this._structure = (<JSONEditor> this.editor).get();
        this._displayMenu();
      }
    });
  }

  /**
     * Initializes tasty.js
     *
     * @private
     */
  _initMenu() {
    this.menu = new tasty.Menu('#canvas' /* The element to place the menu into */, {
      // Configuration object
      // These are the defaults
      main: {
        minDistance: 150,
        minTraceDistance: 175,
        animationDuration: 250,
        enableMaxClickRadius: false,
      },
    });

    this.menu.init();
  }

  /**
     * Initializes the JSON Editor
     *
     * @private
     */
  _initEditor() {
    const schema = {
      $id: 'action',
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'Action',
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Root id.',
          minLength: 1,
        },
        text: {
          type: 'string',
          description: 'Text visible on start.',
          minLength: 1,
        },
        icon: {
          type: 'string',
          description: "Font Awesome Icon Name without 'fa'.",
          minLength: 1,
        },
        direction: {
          type: 'integer',
          minimum: 0,
          maximum: 0,
        },
        children: {
          type: 'array',
          description: 'Zero or more Menu Items / Slider / Checkboxes / RadioGroups.',
          items: {
            $ref: 'item',
          },
        },
      },
      required: [
        'id', 'text', 'icon', 'direction',
      ],
    };

    const item = {
      title: 'Action',
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique item id. Used as identifier in menu events.',
          minLength: 1,
        },
        text: {
          type: 'string',
          description: 'Text visible on hover in parent menu.',
          minLength: 1,
        },
        icon: {
          type: 'string',
          description: "Font Awesome Icon Name without 'fa'. Optional.",
        },
        direction: {
          type: 'integer',
          description: 'Item angle in parent menu. Between 0 - 360. 0 = North, 90 East, ...',
          minimum: 0,
          maximum: 360,
        },
        children: {
          type: 'array',
          description: 'Zero or more Menu Items / Slider / Checkboxes.',
          items: {
            $ref: 'item',
          },
        },
        data: {
          type: 'object',
          description: 'Item configuration',
          properties: {
            // Only Checkbox
            selected: {
              type: 'boolean',
              description: 'Sets the initial checkbox state to selected.',
            },
            // Slider
            min: {
              type: 'number',
              description: 'Slider min. value. MUST be smaller than max.',
            },
            max: {
              type: 'number',
              description: 'Slider max. value. MUST be greater than min.',
            },
            initial: {
              type: 'number',
              description: 'Initial slider value. MUST NOT be outside the min/max range.',
            },
            stepSize: {
              type: 'number',
              description: 'Size between steps. E.g.: 2 = | -2 .. 0 .. 2 |. Should not be smaller than 10% of min or max.',
            },
            stepDist: {
              type: 'number',
              description: 'Distance in px between steps.',
            },
            precision: {
              type: 'number',
              description: 'Slider precision.',
              minimum: 0.01,
            },
          },
        },
      },
      required: [
        'id', 'text', 'direction',
      ],
    };

    const showButtons = () => {
      const expandable = 'jsoneditor-expandable';

      document.querySelectorAll('.jsoneditor-tree tbody > tr').forEach((node) => {
        const prev = <HTMLElement>node.previousSibling;
        const next = <HTMLElement>node.nextSibling;

        if (prev !== null && prev.classList.contains(expandable) && node.classList.contains(expandable)) {
          if (next.nextSibling === null || !(<HTMLElement>next.nextSibling).classList.contains(expandable)) {
            node.classList.add('showButton');
          }
        }
      });
    };

    this.editorContainer.addEventListener('click', showButtons);

    // @ts-ignore
    // @ts-ignore
    const options = {
      mode: 'tree',
      schema,
      schemaRefs: {
        item,
      },
      enableSort: false,
      enableTransform: false,
      mainMenuBar: true,
      history: false,
      navigationBar: false,
      statusBar: false,
      templates: [
        {
          text: 'Action',
          title: 'Insert a Menu Item Action',
          className: 'jsoneditor-type-object',
          field: 'MenuItem',
          value: {
            id: '',
            text: '',
            icon: '',
            direction: '',
            children: [],
          },
        },
        {
          text: 'Checkbox',
          title: 'Insert a Checkbox',
          className: 'jsoneditor-type-object',
          field: 'Checkbox',
          value: {
            id: '',
            text: '',
            icon: '',
            direction: '',
            type: 'checkbox',
            data: {
              selected: false,
            },
          },
        },
        {
          text: 'Slider',
          title: 'Insert a Slider',
          className: 'jsoneditor-type-object',
          field: 'Slider',
          value: {
            id: '',
            text: '',
            icon: '',
            direction: '',
            type: 'slider',
            data: {
              min: -1,
              max: 1,
              initial: 0,
              stepSize: 1,
              stepDist: 100,
              precision: 1,
            },
          },
        },
        {
          text: 'RadioGroup',
          title: 'Insert a Radio Group',
          className: 'jsoneditor-type-object',
          field: 'RadioGroup',
          value: {
            id: '',
            text: '',
            icon: '',
            direction: '',
            type: 'radio-group',
            children: [],
          },
        },
      ],
      autocomplete: {
        filter: 'contain',
        trigger: 'focus',
        getOptions: (_text:string, path:[]) => {
          if (path === null || path[path.length - 1] !== 'icon') {
            return null;
          }

          return faNames;
        },
      },
      onEditable: (node:Node) => ({
        field: node.field === 'MenuItem' || node.field === 'Checkbox' || node.field === 'Slider' || node.field === 'RadioGroup',
        value: true,
      }),
      // @ts-ignore
      onNodeName: (node: Node) => {
        // @ts-ignore
        if (node.path.length > 0 && node.path[0] === 'children' && node.type === 'object') {
          if (node.path[node.path.length - 1] === 'data') {
            return 'Settings';
          }

          return 'MenuItem';
        }
      },
      onCreateMenu: (items: Node[], node: Node) => {
        // @ts-ignore
        if (node.type === 'single' && (node.path.length === 1 || node.path[node.path.length - 1] === 'children')) {
          return [];
        }
        // @ts-ignore
        if (node.type === 'append' && node.path[node.path.length - 1] !== 'children') {
          return [];
        }

        const filtered = items.filter((item) =>
        // @ts-ignore
          item.text === 'Append' || item.text === 'Remove');

        filtered.forEach((entry, index, menu) => {
          // @ts-ignore
          if (entry.text !== 'Remove') {
            // @ts-ignore
            menu[index].click = null;
          }

          // @ts-ignore
          if (typeof menu[index].submenu !== 'undefined') {
            // @ts-ignore
            menu[index].submenu = menu[index].submenu.filter((item) => item.text === 'Action' || item.text === 'Slider' || item.text === 'Checkbox' || item.text === 'RadioGroup');
          }
        });

        return filtered;
      },
      onValidationError: (errors:[]) => {
        this._isValidJson = errors.length === 0;
      },
      onEvent: showButtons,
    };

    this.editor = new JSONEditor(this.editorContainer, <JSONEditorOptions><unknown>options);
    (<JSONEditor> this.editor).set(this._structure);
    (<JSONEditor> this.editor).expandAll();
    (<JSONEditor> this.editor).setName('Root');
  }

  /**
     * Checks a JSON structure and outputs errors to the page
     * @param {JSON} struct
     * @return {boolean}
     * @private
     */
  _checkStruct(struct: MenuItemDefinition) {
    const parser = new tasty.Parser();
    parser.parse(struct);
    if (parser.hasDuplicateIds()) {
      this.warn.textContent = `Duplicate IDs found: ${parser.duplicateIds.toString()}`;

      return false;
    }
    this.warn.textContent = '';


    return true;
  }

  /**
     * Parse the struct and display the menu centered
     * @private
     */
  _displayMenu() {
    // @ts-ignore
    (<tasty.Menu> this.menu)._scope.project.clear();
    (<tasty.Menu> this.menu).setStructure((new tasty.Parser()).parse(this._structure));
    (<tasty.Menu> this.menu).display({
      x: this.canvasContainer.offsetWidth / 2,
      y: this.canvasContainer.offsetHeight / 2,
    });
  }
}
