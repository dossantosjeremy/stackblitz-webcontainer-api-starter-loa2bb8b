// Event handlers for the application
import { VideoManager } from './video-manager';
import { TranscriptManager } from './transcript-manager';
import { ClipManager } from './clip-manager';
import { TagManager } from './tag-manager';
import { SynthesisManager } from './synthesis-manager';
import { UIManager } from './ui-manager';

export class EventHandlers {
  constructor() {
    this.videoManager = new VideoManager();
    this.transcriptManager = new TranscriptManager();
    this.clipManager = new ClipManager();
    this.tagManager = new TagManager();
    this.synthesisManager = new SynthesisManager();
    this.uiManager = new UIManager();

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Video import events
    document.getElementById('importVideo').addEventListener('click', () => this.videoManager.importVideo());
    document.getElementById('clearAllVideos').addEventListener('click', () => this.videoManager.clearAll());

    // Transcription events
    document.getElementById('transcribeVideo').addEventListener('click', () => this.handleTranscription());
    
    // Clip events
    document.getElementById('createClipBtn').addEventListener('click', () => this.handleClipCreation());
    document.getElementById('downloadAllClips').addEventListener('click', () => this.handleDownloadAllClips());
    
    // Tag events
    document.getElementById('tag-filter').addEventListener('change', () => this.handleTagFilter());
    document.getElementById('clear-all-tags').addEventListener('click', () => this.handleClearAllTags());
    
    // Synthesis events
    document.getElementById('synthesize-transcript').addEventListener('click', () => this.handleSynthesisTranscript());
    document.getElementById('synthesize-clips').addEventListener('click', () => this.handleSynthesisClips());
  }

  async handleTranscription() {
    const videoPath = this.videoManager.getCurrentVideoPath();
    if (!videoPath) return;

    const languageSelect = document.getElementById('languageSelect');
    const language = languageSelect ? languageSelect.value : 'en';

    this.uiManager.showLoading('Transcribing video...');
    try {
      await this.transcriptManager.transcribeVideo(videoPath, language);
    } catch (error) {
      this.uiManager.showError(`Transcription failed: ${error.message}`);
    } finally {
      this.uiManager.hideLoading();
    }
  }

  // Add other event handlers...
}