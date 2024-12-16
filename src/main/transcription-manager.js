const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TranscriptionManager {
  getTranscriptionPath(videoPath) {
    const transcriptionPath = videoPath.replace(/\.[^/.]+$/, "_transcription.csv");
    return fs.existsSync(transcriptionPath) ? transcriptionPath : null;
  }

  async transcribeVideo(videoPath, language, event) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', ['transcribe.py', videoPath, language]);

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
        event.sender.send('transcription-progress', data.toString());
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Transcription failed with exit code ${code}. Error: ${stderrData}`));
        } else {
          const transcriptionPath = this.getTranscriptionPath(videoPath);
          if (fs.existsSync(transcriptionPath)) {
            resolve(transcriptionPath);
          } else {
            reject(new Error(`Transcription file not found. Python output: ${stdoutData}`));
          }
        }
      });
    });
  }
}

module.exports = { TranscriptionManager };