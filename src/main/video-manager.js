const { dialog } = require('electron');
const path = require('path');

class VideoManager {
  async importVideo(filePath) {
    if (filePath) {
      return {
        path: filePath,
        name: path.basename(filePath)
      };
    }

    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Media Files', extensions: ['mp4', 'mov', 'wav', 'mp3', 'm4a'] },
        { name: 'Video Files', extensions: ['mp4', 'mov'] },
        { name: 'Audio Files', extensions: ['wav', 'mp3', 'm4a'] }
      ]
    });

    if (!result.canceled) {
      const filePath = result.filePaths[0];
      return {
        path: filePath,
        name: path.basename(filePath)
      };
    }
    return null;
  }
}

module.exports = { VideoManager };