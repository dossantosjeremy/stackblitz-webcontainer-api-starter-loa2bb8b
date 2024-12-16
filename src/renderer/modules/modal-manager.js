// Modal management functionality
export class ModalManager {
  constructor() {
    this.modals = {
      addTag: document.getElementById('addTagModal'),
      editTag: document.getElementById('editTagModal'),
      renameVideo: document.getElementById('renameVideoModal')
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
      Object.entries(this.modals).forEach(([key, modal]) => {
        if (event.target === modal) {
          this.hideModal(key);
        }
      });
    });

    // Close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        Object.keys(this.modals).forEach(key => this.hideModal(key));
      });
    });
  }

  showModal(modalKey, data = {}) {
    const modal = this.modals[modalKey];
    if (!modal) return;

    // Set modal data if provided
    if (data.input) {
      const input = modal.querySelector('input');
      if (input) input.value = data.input;
    }

    modal.style.display = 'block';
  }

  hideModal(modalKey) {
    const modal = this.modals[modalKey];
    if (!modal) return;

    modal.style.display = 'none';
  }

  hideAllModals() {
    Object.values(this.modals).forEach(modal => {
      modal.style.display = 'none';
    });
  }

  getModalInput(modalKey) {
    const modal = this.modals[modalKey];
    if (!modal) return null;

    const input = modal.querySelector('input');
    return input ? input.value.trim() : null;
  }
}