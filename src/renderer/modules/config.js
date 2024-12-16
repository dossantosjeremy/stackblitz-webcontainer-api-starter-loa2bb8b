// Application configuration
export const config = {
  transcription: {
    defaultLanguage: 'en',
    supportedFormats: ['.mp4', '.mov', '.wav', '.mp3', '.m4a']
  },
  synthesis: {
    temperature: 0.7,
    topP: 0.9,
    topK: 40
  },
  ui: {
    maxClipsPerPage: 10,
    autoScrollThreshold: 100,
    loadingOverlayDelay: 300
  }
};