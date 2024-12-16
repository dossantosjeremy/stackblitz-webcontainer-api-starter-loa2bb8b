const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { FileUtils } = require('./utils/file-utils');

class TagManager {
  constructor() {
    this.fileUtils = new FileUtils();
  }

  async createTag({ clipId, tag, videoPath }) {
    const tagsPath = path.join(app.getPath('userData'), `tags_${path.basename(videoPath)}.json`);
    this.fileUtils.ensureFileExists(tagsPath);
    
    const tags = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
    const newTag = { id: Date.now().toString(), clipId, tag };
    tags.push(newTag);
    fs.writeFileSync(tagsPath, JSON.stringify(tags));
    
    return newTag;
  }

  async getTags(videoPath) {
    const tagsPath = path.join(app.getPath('userData'), `tags_${path.basename(videoPath)}.json`);
    this.fileUtils.ensureFileExists(tagsPath);
    return JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
  }
}

module.exports = { TagManager };