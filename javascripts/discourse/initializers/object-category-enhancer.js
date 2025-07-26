import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "object-category-enhancer",
  initialize() {
    withPluginApi("0.8.31", (api) => {
      api.modifyClass("component:admin-objects-setting", {
        pluginId: "object-category-enhancer",
        
        init() {
          this._super(...arguments);
          this.set("showSchemaModal", false);
        },

        actions: {
          addObject() {
            this._super(...arguments);
            this.updateCategoryFields();
          },

          removeObject(index) {
            this._super(...arguments);
            this.updateCategoryFields();
          }
        },

        updateCategoryFields() {
          // Use a timeout to ensure DOM has updated
          setTimeout(() => {
            const categoryFields = document.querySelectorAll('input[data-field-name$="_categories"]');
            categoryFields.forEach(field => {
              const wrapper = field.closest('.admin-object-setting-property');
              if (wrapper && !wrapper.querySelector('.category-helper')) {
                this.addCategoryHelper(wrapper, field);
              }
            });
          }, 100);
        },

        addCategoryHelper(wrapper, field) {
          const helper = document.createElement('div');
          helper.className = 'category-helper';
          helper.style.cssText = `
            margin-top: 8px; 
            padding: 8px; 
            background: #f8f9fa; 
            border-radius: 4px; 
            font-size: 12px; 
            color: #666;
          `;
          helper.innerHTML = `
            <strong>Category IDs Helper:</strong> Open browser console to see available category IDs and their names.
            <br>Format: Use comma-separated IDs like "90,110,118"
          `;
          wrapper.appendChild(helper);
        },

        didRender() {
          this._super(...arguments);
          this.updateCategoryFields();
        }
      });
    });
  }
};