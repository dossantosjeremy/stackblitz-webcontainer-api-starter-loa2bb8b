// Application state management
export class StateManager {
  constructor() {
    this.state = {
      currentVideoPath: '',
      selectedVideo: null,
      transcriptData: [],
      clips: [],
      filteredClips: [],
      tags: new Set(),
      isTranscriptEditable: false,
      currentSelection: null
    };
  }

  updateState(key, value) {
    this.state[key] = value;
    this.notifyListeners(key, value);
  }

  getState(key) {
    return this.state[key];
  }

  // Add state change listeners
  addListener(key, callback) {
    if (!this.listeners[key]) {
      this.listeners[key] = new Set();
    }
    this.listeners[key].add(callback);
  }

  removeListener(key, callback) {
    if (this.listeners[key]) {
      this.listeners[key].delete(callback);
    }
  }

  notifyListeners(key, value) {
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => callback(value));
    }
  }
}