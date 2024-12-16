// Main application initialization
import { EventHandlers } from './event-handlers';
import { StateManager } from './state-manager';
import { UIManager } from './ui-manager';

export class App {
  constructor() {
    this.stateManager = new StateManager();
    this.uiManager = new UIManager();
    this.eventHandlers = new EventHandlers(this.stateManager, this.uiManager);
  }

  initialize() {
    // Initialize application state
    this.stateManager.initialize();
    
    // Set up event handlers
    this.eventHandlers.setupEventListeners();
    
    // Initialize UI components
    this.uiManager.initialize();
    
    // Set up IPC listeners
    this.setupIPCListeners();
  }

  setupIPCListeners() {
    window.ipcRenderer.on('transcription-progress', (event, message) => {
      console.log('Transcription progress:', message);
      this.uiManager.updateLoadingText(`Transcribing: ${message}`);
    });
  }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.initialize();
});