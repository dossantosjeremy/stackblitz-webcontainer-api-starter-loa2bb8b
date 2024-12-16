const { ipcMain, dialog } = require('electron');
const { VideoManager } = require('./video-manager');
const { TranscriptionManager } = require('./transcription-manager');
const { ClipManager } = require('./clip-manager');
const { TagManager } = require('./tag-manager');
const { SynthesisManager } = require('./synthesis-manager');

function setupIpcHandlers() {
  const videoManager = new VideoManager();
  const transcriptionManager = new TranscriptionManager();
  const clipManager = new ClipManager();
  const tagManager = new TagManager();
  const synthesisManager = new SynthesisManager();

  // Video handlers
  ipcMain.handle('import-video', async (event, filePath) => {
    return await videoManager.importVideo(filePath);
  });

  // Transcription handlers
  ipcMain.handle('transcribe-video', async (event, { videoPath, language }) => {
    return await transcriptionManager.transcribeVideo(videoPath, language, event);
  });

  ipcMain.handle('get-transcription-path', (event, videoPath) => {
    return transcriptionManager.getTranscriptionPath(videoPath);
  });

  // Clip handlers
  ipcMain.handle('create-clip', async (event, clipData) => {
    return await clipManager.createClip(clipData);
  });

  ipcMain.handle('download-clip', async (event, clipData) => {
    return await clipManager.downloadClip(clipData);
  });

  // Tag handlers
  ipcMain.handle('create-tag', async (event, tagData) => {
    return await tagManager.createTag(tagData);
  });

  ipcMain.handle('get-clips-and-tags', async (event, videoPath) => {
    const clips = await clipManager.getClips(videoPath);
    const tags = await tagManager.getTags(videoPath);
    return { clips, tags };
  });

  // Synthesis handlers
  ipcMain.handle('synthesize-clips', async (event, data) => {
    return await synthesisManager.synthesizeClips(data);
  });
}

module.exports = { setupIpcHandlers };