const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const ffmpeg = require('fluent-ffmpeg');
const { FileUtils } = require('./utils/file-utils');
const { TimeUtils } = require('./utils/time-utils');

class ClipManager {
  constructor() {
    this.fileUtils = new FileUtils();
    this.timeUtils = new TimeUtils();
  }

  async createClip({ start, end, text, videoPath }) {
    const clipsPath = path.join(app.getPath('userData'), `clips_${path.basename(videoPath)}.json`);
    this.fileUtils.ensureFileExists(clipsPath);
    
    const clips = JSON.parse(fs.readFileSync(clipsPath, 'utf8'));
    const newClip = { id: Date.now().toString(), start, end, text };
    clips.push(newClip);
    fs.writeFileSync(clipsPath, JSON.stringify(clips));
    
    return newClip;
  }

  async getClips(videoPath) {
    const clipsPath = path.join(app.getPath('userData'), `clips_${path.basename(videoPath)}.json`);
    this.fileUtils.ensureFileExists(clipsPath);
    return JSON.parse(fs.readFileSync(clipsPath, 'utf8'));
  }

  async downloadClip({ clipId, videoPath }) {
    const clips = await this.getClips(videoPath);
    const clip = clips.find(c => c.id === clipId);
    
    if (!clip) {
      throw new Error('Clip not found');
    }

    const outputPath = path.join(app.getPath('downloads'), `clip_${clipId}.mp4`);
    await this.cutVideo(videoPath, clip.start, clip.end, outputPath);
    
    return outputPath;
  }

  cutVideo(inputPath, start, end, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(start)
        .setDuration(this.timeUtils.parseTimeToSeconds(end) - this.timeUtils.parseTimeToSeconds(start))
        .output(outputPath)
        .outputOptions('-c:v libx264')
        .outputOptions('-c:a aac')
        .outputOptions('-f mp4')
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }
}

module.exports = { ClipManager };