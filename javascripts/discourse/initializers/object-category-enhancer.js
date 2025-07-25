import { withPluginApi } from "discourse/lib/plugin-api";
import { ajax } from "discourse/lib/ajax";

export default {
  name: "object-category-enhancer",
  
  initialize() {
    withPluginApi("0.11.1", (api) => {
      let categories = [];
      
      // Load categories
      ajax("/site.json").then((siteData) => {
        categories = siteData.categories.map(cat => {
          const parent = siteData.categories.find(p => p.id === cat.parent_category_id);
          return {
            id: cat.id,
            slug: cat.slug,
            name: cat.name,
            fullName: parent ? `${parent.name} > ${cat.name}` : cat.name
          };
        }).sort((a, b) => a.fullName.localeCompare(b.fullName));
      });
      
      function enhanceObjectCategoryFields() {
        if (!categories.length) return;
        if (!window.location.pathname.includes('/admin/customize/themes/')) return;
        
        // Find object editor category fields
        const objectInputs = document.querySelectorAll('.objects-list .object-field input[type="text"]');
        
        objectInputs.forEach(input => {
          // Check if this is a category field
          const fieldLabel = input.closest('.object-field')?.querySelector('label')?.textContent || '';
          if (!fieldLabel.toLowerCase().includes('categories')) return;
          
          if (input.dataset.categoryEnhanced) return;
          input.dataset.categoryEnhanced = 'true';
          
          // Create select button
          const selectBtn = document.createElement('button');
          selectBtn.type = 'button';
          selectBtn.className = 'btn btn-default btn-small';
          selectBtn.textContent = '📋 Select';
          selectBtn.style.cssText = 'margin-left: 8px; font-size: 12px; padding: 4px 8px;';
          
          // Create modal
          const modal = document.createElement('div');
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
          `;
          
          const modalContent = document.createElement('div');
          modalContent.style.cssText = `
            background: var(--secondary, white);
            border-radius: 8px;
            padding: 20px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          `;
          
          modalContent.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 15px;">Select Categories</h3>
            <div style="margin-bottom: 15px;">
              <input type="text" placeholder="Search categories..." class="category-search" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div class="category-list" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
              ${categories.map(cat => `
                <label style="display: block; padding: 6px 0; cursor: pointer;" data-category="${cat.fullName.toLowerCase()}">
                  <input type="checkbox" value="${cat.id}" style="margin-right: 8px;">
                  <span>${cat.fullName}</span>
                  <small style="color: #666; margin-left: 8px;">(ID: ${cat.id})</small>
                </label>
              `).join('')}
            </div>
            <div style="margin-top: 15px; text-align: right;">
              <button type="button" class="btn btn-default cancel-btn" style="margin-right: 8px;">Cancel</button>
              <button type="button" class="btn btn-primary apply-btn">Apply Selection</button>
            </div>
          `;
          
          modal.appendChild(modalContent);
          document.body.appendChild(modal);
          
          // Insert button after input
          input.parentNode.insertBefore(selectBtn, input.nextSibling);
          
          // Search functionality
          const searchInput = modal.querySelector('.category-search');
          const categoryLabels = modal.querySelectorAll('.category-list label');
          
          searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            categoryLabels.forEach(label => {
              const categoryName = label.dataset.category;
              label.style.display = categoryName.includes(searchTerm) ? 'block' : 'none';
            });
          });
          
          // Event handlers
          selectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Update checkboxes based on current input value
            const currentIds = input.value.split(',').map(s => s.trim()).filter(s => s);
            modal.querySelectorAll('input[type="checkbox"]').forEach(cb => {
              cb.checked = currentIds.includes(cb.value);
            });
            
            // Reset search
            searchInput.value = '';
            categoryLabels.forEach(label => label.style.display = 'block');
            
            modal.style.display = 'flex';
          });
          
          modal.querySelector('.apply-btn').addEventListener('click', () => {
            const selected = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked'))
              .map(cb => cb.value);
            
            input.value = selected.join(',');
            
            // Trigger change events for the object editor
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            modal.style.display = 'none';
          });
          
          modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.style.display = 'none';
          });
          
          // Close on backdrop click
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              modal.style.display = 'none';
            }
          });
        });
      }
      
      // Enhanced timing for object editor
      function tryEnhanceObjects() {
        setTimeout(enhanceObjectCategoryFields, 500);  // Quick check
        setTimeout(enhanceObjectCategoryFields, 1500); // Medium delay
        setTimeout(enhanceObjectCategoryFields, 3000); // Long delay
      }
      
      // Watch for object editor opening
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length > 0) {
            const hasObjectEditor = Array.from(mutation.addedNodes).some(node => 
              node.nodeType === 1 && (
                (node.querySelector && node.querySelector('.objects-list')) ||
                (node.classList && node.classList.contains('objects-list')) ||
                (node.querySelector && node.querySelector('.object-field'))
              )
            );
            if (hasObjectEditor) {
              setTimeout(enhanceObjectCategoryFields, 200);
            }
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // On page change
      api.onPageChange(() => {
        if (window.location.pathname.includes('/admin/customize/themes/')) {
          tryEnhanceObjects();
        }
      });
      
      // Initial load
      if (window.location.pathname.includes('/admin/customize/themes/')) {
        tryEnhanceObjects();
      }
    });
  }
};