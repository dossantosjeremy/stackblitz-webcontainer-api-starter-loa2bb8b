// Context menu functionality
export class ContextMenu {
  constructor() {
    this.menu = document.getElementById('context-menu');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Hide context menu when clicking outside
    document.addEventListener('click', (event) => {
      if (event.target.closest('#context-menu') === null) {
        this.hide();
      }
    });

    // Prevent default context menu
    document.addEventListener('contextmenu', (event) => {
      if (!event.target.closest('.video-item')) {
        event.preventDefault();
        this.hide();
      }
    });
  }

  show(x, y) {
    this.menu.style.display = 'block';
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;
  }

  hide() {
    this.menu.style.display = 'none';
  }

  addMenuItem(label, handler) {
    const item = document.createElement('div');
    item.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer';
    item.textContent = label;
    item.addEventListener('click', () => {
      handler();
      this.hide();
    });
    this.menu.appendChild(item);
  }

  clearMenuItems() {
    this.menu.innerHTML = '';
  }
}