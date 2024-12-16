// Application constants
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  pt: 'Portuguese'
};

export const SYNTHESIS_TYPES = {
  summary: 'Chapter Summary',
  minutes: 'Meeting Minutes',
  actions: 'Action Items & Deadlines',
  title: 'Title Suggestions',
  outline: 'Content Outline',
  'key-points': 'Key Discussion Points'
};

export const TEMPLATE_TYPES = {
  meeting: 'Meeting',
  lecture: 'Lecture',
  interview: 'Interview',
  general: 'General'
};

export const IPC_CHANNELS = {
  IMPORT_VIDEO: 'import-video',
  TRANSCRIBE_VIDEO: 'transcribe-video',
  GET_TRANSCRIPTION: 'get-transcription-path',
  CREATE_CLIP: 'create-clip',
  CREATE_TAG: 'create-tag',
  GET_CLIPS_AND_TAGS: 'get-clips-and-tags',
  DELETE_CLIP: 'delete-clip',
  DELETE_TAG: 'delete-tag',
  CLEAR_ALL_TAGS: 'clear-all-tags',
  DELETE_ALL_CLIPS: 'delete-all-clips',
  SYNTHESIZE_CLIPS: 'synthesize-clips'
};

export const UI_ELEMENTS = {
  VIDEO_LIST: 'video-list',
  TRANSCRIPT: 'transcript',
  CLIPS_AND_TAGS: 'clips-and-tags',
  LOADING_OVERLAY: 'loadingOverlay',
  LOADING_TEXT: 'loadingText',
  SYNTHESIS_OUTPUT: 'synthesis-output'
};