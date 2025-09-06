// Native JavaScript Component System inspired by shadcn/ui

class UIComponents {
  constructor() {
    this.activeDropdowns = new Set();
    this.init();
  }

  init() {
    // Initialize component behaviors
    this.initializeDropdowns();
    this.initializeSelects();
    this.initializeTooltips();
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      this.handleOutsideClick(e);
    });

    // Handle escape key for dropdowns
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllDropdowns();
      }
    });
  }

  // Button Component
  createButton({
    text = '',
    variant = 'default',
    size = '',
    icon = '',
    iconPosition = 'left',
    disabled = false,
    onClick = null,
    className = ''
  }) {
    const button = document.createElement('button');
    button.className = `btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`.trim();
    
    if (disabled) {
      button.disabled = true;
    }

    let content = '';
    if (icon && iconPosition === 'left') {
      content += `<i class="${icon} mr-2"></i>`;
    }
    content += text;
    if (icon && iconPosition === 'right') {
      content += `<i class="${icon} ml-2"></i>`;
    }

    button.innerHTML = content;

    if (onClick) {
      button.addEventListener('click', onClick);
    }

    return button;
  }

  // Input Component
  createInput({
    type = 'text',
    placeholder = '',
    value = '',
    disabled = false,
    className = '',
    onChange = null
  }) {
    const input = document.createElement('input');
    input.type = type;
    input.className = `input ${className}`.trim();
    input.placeholder = placeholder;
    input.value = value;

    if (disabled) {
      input.disabled = true;
    }

    if (onChange) {
      input.addEventListener('input', (e) => onChange(e.target.value, e));
    }

    return input;
  }

  // Select Component
  createSelect({
    options = [],
    placeholder = 'Select option...',
    value = '',
    disabled = false,
    className = '',
    onChange = null
  }) {
    const container = document.createElement('div');
    container.className = `select ${className}`.trim();

    const trigger = document.createElement('button');
    trigger.className = 'select-trigger';
    trigger.type = 'button';
    
    const triggerContent = document.createElement('span');
    triggerContent.textContent = placeholder;
    
    const chevron = document.createElement('i');
    chevron.className = 'fi fi-rr-angle-small-down ml-auto';
    
    trigger.appendChild(triggerContent);
    trigger.appendChild(chevron);

    const content = document.createElement('div');
    content.className = 'select-content hidden animate-slide-down';

    // Create options
    options.forEach(option => {
      const item = document.createElement('div');
      item.className = 'select-item';
      item.textContent = option.label || option;
      item.dataset.value = option.value || option;

      if ((option.value || option) === value) {
        item.dataset.selected = 'true';
        triggerContent.textContent = option.label || option;
      }

      item.addEventListener('click', () => {
        // Update selection
        content.querySelectorAll('.select-item').forEach(i => i.dataset.selected = 'false');
        item.dataset.selected = 'true';
        triggerContent.textContent = item.textContent;
        
        // Close dropdown
        content.classList.add('hidden');
        chevron.style.transform = 'rotate(0deg)';
        this.activeDropdowns.delete(container);

        if (onChange) {
          onChange(item.dataset.value, item);
        }
      });

      content.appendChild(item);
    });

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !content.classList.contains('hidden');
      
      if (isOpen) {
        content.classList.add('hidden');
        chevron.style.transform = 'rotate(0deg)';
        this.activeDropdowns.delete(container);
      } else {
        this.closeAllDropdowns();
        content.classList.remove('hidden');
        chevron.style.transform = 'rotate(180deg)';
        this.activeDropdowns.add(container);
      }
    });

    if (disabled) {
      trigger.disabled = true;
    }

    container.appendChild(trigger);
    container.appendChild(content);

    return container;
  }

  // Card Component
  createCard({ title = '', description = '', content = '', footer = '', className = '' }) {
    const card = document.createElement('div');
    card.className = `card ${className}`.trim();

    if (title || description) {
      const header = document.createElement('div');
      header.className = 'card-header';

      if (title) {
        const titleEl = document.createElement('h3');
        titleEl.className = 'card-title';
        titleEl.textContent = title;
        header.appendChild(titleEl);
      }

      if (description) {
        const descEl = document.createElement('p');
        descEl.className = 'card-description';
        descEl.textContent = description;
        header.appendChild(descEl);
      }

      card.appendChild(header);
    }

    if (content) {
      const contentEl = document.createElement('div');
      contentEl.className = 'card-content';
      if (typeof content === 'string') {
        contentEl.innerHTML = content;
      } else {
        contentEl.appendChild(content);
      }
      card.appendChild(contentEl);
    }

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'card-footer';
      if (typeof footer === 'string') {
        footerEl.innerHTML = footer;
      } else {
        footerEl.appendChild(footer);
      }
      card.appendChild(footerEl);
    }

    return card;
  }

  // Badge Component
  createBadge({ text = '', variant = 'default', className = '' }) {
    const badge = document.createElement('span');
    badge.className = `badge badge-${variant} ${className}`.trim();
    badge.textContent = text;
    return badge;
  }

  // Separator Component
  createSeparator({ orientation = 'horizontal', className = '' }) {
    const separator = document.createElement('div');
    separator.className = `separator ${orientation === 'vertical' ? 'separator-vertical' : ''} ${className}`.trim();
    return separator;
  }

  // Dropdown Component
  createDropdown({
    trigger = '',
    items = [],
    className = '',
    align = 'left'
  }) {
    const container = document.createElement('div');
    container.className = `dropdown ${className}`.trim();

    const triggerEl = document.createElement('button');
    triggerEl.className = 'btn btn-ghost btn-icon';
    if (typeof trigger === 'string') {
      triggerEl.innerHTML = trigger;
    } else {
      triggerEl.appendChild(trigger);
    }

    const content = document.createElement('div');
    content.className = `dropdown-content hidden animate-slide-down`;
    if (align === 'right') {
      content.style.right = '0';
      content.style.left = 'auto';
    }

    items.forEach(item => {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.className = 'dropdown-separator';
        content.appendChild(sep);
      } else {
        const itemEl = document.createElement('div');
        itemEl.className = 'dropdown-item';
        
        if (item.icon) {
          const icon = document.createElement('i');
          icon.className = `${item.icon} mr-2`;
          itemEl.appendChild(icon);
        }
        
        const text = document.createElement('span');
        text.textContent = item.text || item.label;
        itemEl.appendChild(text);

        if (item.onClick) {
          itemEl.addEventListener('click', (e) => {
            item.onClick(e);
            this.closeDropdown(container);
          });
        }

        content.appendChild(itemEl);
      }
    });

    triggerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !content.classList.contains('hidden');
      
      if (isOpen) {
        this.closeDropdown(container);
      } else {
        this.closeAllDropdowns();
        content.classList.remove('hidden');
        this.activeDropdowns.add(container);
      }
    });

    container.appendChild(triggerEl);
    container.appendChild(content);

    return container;
  }

  // Toast Component
  createToast({ 
    title = '', 
    description = '', 
    variant = 'default', 
    duration = 5000,
    action = null 
  }) {
    const toast = document.createElement('div');
    toast.className = `card border shadow-lg p-4 mb-2 animate-slide-up`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 100;
      min-width: 300px;
      max-width: 400px;
    `;

    let variantClass = '';
    switch (variant) {
      case 'destructive':
        variantClass = 'border-red-500 bg-red-50';
        break;
      case 'success':
        variantClass = 'border-green-500 bg-green-50';
        break;
      default:
        variantClass = 'bg-card';
    }
    toast.className += ` ${variantClass}`;

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-2';

    if (title) {
      const titleEl = document.createElement('h4');
      titleEl.className = 'font-semibold text-sm';
      titleEl.textContent = title;
      header.appendChild(titleEl);
    }

    const closeBtn = this.createButton({
      text: '',
      variant: 'ghost',
      size: 'sm',
      icon: 'fi fi-rr-cross-small',
      onClick: () => this.removeToast(toast)
    });
    closeBtn.className += ' btn-icon';
    header.appendChild(closeBtn);

    toast.appendChild(header);

    if (description) {
      const descEl = document.createElement('p');
      descEl.className = 'text-sm text-muted-foreground';
      descEl.textContent = description;
      toast.appendChild(descEl);
    }

    if (action) {
      const actionEl = document.createElement('div');
      actionEl.className = 'mt-2';
      actionEl.appendChild(action);
      toast.appendChild(actionEl);
    }

    document.body.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast);
      }, duration);
    }

    return toast;
  }

  // Alert Dialog Component
  createAlertDialog({
    title = '',
    description = '',
    confirmText = 'OK',
    cancelText = 'Cancel',
    variant = 'default',
    onConfirm = null,
    onCancel = null
  }) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'card shadow-xl animate-slide-up';
    dialog.style.cssText = `
      min-width: 300px;
      max-width: 500px;
      margin: 20px;
    `;

    const header = document.createElement('div');
    header.className = 'card-header';

    if (title) {
      const titleEl = document.createElement('h2');
      titleEl.className = 'card-title';
      titleEl.textContent = title;
      header.appendChild(titleEl);
    }

    if (description) {
      const descEl = document.createElement('p');
      descEl.className = 'card-description';
      descEl.textContent = description;
      header.appendChild(descEl);
    }

    dialog.appendChild(header);

    const footer = document.createElement('div');
    footer.className = 'card-footer justify-end space-x-2';

    if (cancelText) {
      const cancelBtn = this.createButton({
        text: cancelText,
        variant: 'outline',
        onClick: () => {
          document.body.removeChild(overlay);
          if (onCancel) onCancel();
        }
      });
      footer.appendChild(cancelBtn);
    }

    const confirmBtn = this.createButton({
      text: confirmText,
      variant: variant === 'destructive' ? 'destructive' : 'default',
      onClick: () => {
        document.body.removeChild(overlay);
        if (onConfirm) onConfirm();
      }
    });
    footer.appendChild(confirmBtn);

    dialog.appendChild(footer);
    overlay.appendChild(dialog);

    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        if (onCancel) onCancel();
      }
    });

    return overlay;
  }

  // Utility methods
  removeToast(toast) {
    if (toast && toast.parentNode) {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }

  closeDropdown(container) {
    const content = container.querySelector('.dropdown-content, .select-content');
    if (content) {
      content.classList.add('hidden');
      this.activeDropdowns.delete(container);
      
      // Reset chevron for selects
      const chevron = container.querySelector('.fi-rr-angle-small-down');
      if (chevron) {
        chevron.style.transform = 'rotate(0deg)';
      }
    }
  }

  closeAllDropdowns() {
    this.activeDropdowns.forEach(container => {
      this.closeDropdown(container);
    });
    this.activeDropdowns.clear();
  }

  handleOutsideClick(e) {
    let clickedInside = false;
    this.activeDropdowns.forEach(container => {
      if (container.contains(e.target)) {
        clickedInside = true;
      }
    });

    if (!clickedInside) {
      this.closeAllDropdowns();
    }
  }

  initializeDropdowns() {
    // Auto-initialize existing dropdowns in the DOM
    document.querySelectorAll('.dropdown').forEach(dropdown => {
      if (!dropdown.dataset.initialized) {
        dropdown.dataset.initialized = 'true';
        // Add event listeners for existing dropdowns
      }
    });
  }

  initializeSelects() {
    // Auto-initialize existing selects in the DOM
    document.querySelectorAll('.select').forEach(select => {
      if (!select.dataset.initialized) {
        select.dataset.initialized = 'true';
        // Add event listeners for existing selects
      }
    });
  }

  initializeTooltips() {
    // Initialize tooltips
    document.querySelectorAll('[data-tooltip]').forEach(element => {
      if (!element.dataset.tooltipInitialized) {
        element.dataset.tooltipInitialized = 'true';
        
        element.addEventListener('mouseenter', (e) => {
          this.showTooltip(e.target, e.target.dataset.tooltip);
        });

        element.addEventListener('mouseleave', (e) => {
          this.hideTooltip();
        });
      }
    });
  }

  showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      pointer-events: none;
      white-space: nowrap;
    `;

    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
    tooltip.style.left = (rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';

    this.activeTooltip = tooltip;
  }

  hideTooltip() {
    if (this.activeTooltip) {
      this.activeTooltip.remove();
      this.activeTooltip = null;
    }
  }
}

// Create global instance
window.UI = new UIComponents();

// Helper functions for easier component creation
window.createButton = (options) => window.UI.createButton(options);
window.createInput = (options) => window.UI.createInput(options);
window.createSelect = (options) => window.UI.createSelect(options);
window.createCard = (options) => window.UI.createCard(options);
window.createBadge = (options) => window.UI.createBadge(options);
window.createSeparator = (options) => window.UI.createSeparator(options);
window.createDropdown = (options) => window.UI.createDropdown(options);
window.showToast = (options) => window.UI.createToast(options);
window.showAlert = (options) => window.UI.createAlertDialog(options);