const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();
}

function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]');
  }
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('import-video', async (event, filePath) => {
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
  });

  ipcMain.handle('get-transcription-path', (event, videoPath) => {
    const transcriptionPath = videoPath.replace(/\.[^/.]+$/, "_transcription.csv");
    return fs.existsSync(transcriptionPath) ? transcriptionPath : null;
  });

  // Replace the entire transcribe-video handler with this version
  ipcMain.handle('transcribe-video', async (event, { videoPath, language }) => {
      return new Promise((resolve, reject) => {
          console.log('Starting transcription process for:', videoPath);
          const pythonProcess = spawn('python3', ['transcribe.py', videoPath, language]);

          let stdoutData = '';
          let stderrData = '';

          pythonProcess.stdout.on('data', (data) => {
              stdoutData += data.toString();
              console.log('Python stdout:', data.toString());
              event.sender.send('transcription-progress', data.toString());
          });

          pythonProcess.stderr.on('data', (data) => {
              stderrData += data.toString();
              console.error('Python stderr:', data.toString());
          });

          pythonProcess.on('close', (code) => {
              console.log(`Python process exited with code ${code}`);
              if (code !== 0) {
                  console.error('Transcription failed. Error:', stderrData);
                  reject(new Error(`Transcription failed with exit code ${code}. Error: ${stderrData}`));
              } else {
                  const transcriptionPath = videoPath.replace(/\.[^/.]+$/, "_transcription.csv");
                  console.log('Checking for transcription file:', transcriptionPath);
                  if (fs.existsSync(transcriptionPath)) {
                      console.log('Transcription file found. Resolving promise.');
                      resolve(transcriptionPath);
                  } else {
                      console.error('Transcription file not found. Python output:', stdoutData);
                      reject(new Error(`Transcription file not found. Python output: ${stdoutData}`));
                  }
              }
          });
      });
  });

  ipcMain.handle('create-clip', async (event, { start, end, text, videoPath }) => {
    console.log('Creating clip:', { start, end, text, videoPath });
    const clipsPath = path.join(app.getPath('userData'), `clips_${path.basename(videoPath)}.json`);
    ensureFileExists(clipsPath);
    const clips = JSON.parse(fs.readFileSync(clipsPath, 'utf8'));
    const newClip = { id: Date.now().toString(), start, end, text };
    clips.push(newClip);
    fs.writeFileSync(clipsPath, JSON.stringify(clips));
    return newClip;
  });

  ipcMain.handle('create-tag', async (event, { clipId, tag, videoPath }) => {
    console.log('Creating tag:', { clipId, tag, videoPath });
    const tagsPath = path.join(app.getPath('userData'), `tags_${path.basename(videoPath)}.json`);
    ensureFileExists(tagsPath);
    const tags = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
    const newTag = { id: Date.now().toString(), clipId, tag };
    tags.push(newTag);
    fs.writeFileSync(tagsPath, JSON.stringify(tags));
    return newTag;
  });

  ipcMain.handle('get-clips-and-tags', async (event, videoPath) => {
    console.log('Fetching clips and tags for:', videoPath);
    const clipsPath = path.join(app.getPath('userData'), `clips_${path.basename(videoPath)}.json`);
    const tagsPath = path.join(app.getPath('userData'), `tags_${path.basename(videoPath)}.json`);

    ensureFileExists(clipsPath);
    ensureFileExists(tagsPath);

    const clips = JSON.parse(fs.readFileSync(clipsPath, 'utf8'));
    const tags = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
    return { clips, tags };
  });

  ipcMain.handle('download-clip', async (event, { clipId, videoPath }) => {
    console.log('Downloading clip:', clipId);
    const clipsPath = path.join(app.getPath('userData'), `clips_${path.basename(videoPath)}.json`);
    ensureFileExists(clipsPath);
    const clips = JSON.parse(fs.readFileSync(clipsPath, 'utf8'));
    const clip = clips.find(c => c.id === clipId);

    if (!clip) {
      throw new Error('Clip not found');
    }

    const saveDialog = await dialog.showSaveDialog({
      title: 'Save Clip',
      defaultPath: `clip_${clipId}.mp4`,
      filters: [{ name: 'MP4', extensions: ['mp4'] }]
    });

    if (saveDialog.canceled) {
      return;
    }

    await cutVideo(videoPath, clip.start, clip.end, saveDialog.filePath);
  });

  ipcMain.handle('download-all-clips', async (event, videoPath) => {
    console.log('Downloading all clips');
    const clipsPath = path.join(app.getPath('userData'), `clips_${path.basename(videoPath)}.json`);
    ensureFileExists(clipsPath);
    const clips = JSON.parse(fs.readFileSync(clipsPath, 'utf8'));

    const saveDialog = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Folder to Save All Clips'
    });

    if (saveDialog.canceled) {
      return;
    }

    const saveDir = saveDialog.filePaths[0];

    for (const clip of clips) {
      const outputPath = path.join(saveDir, `clip_${clip.id}.mp4`);
      await cutVideo(videoPath, clip.start, clip.end, outputPath);
    }
  });

  ipcMain.handle('download-filtered-clips', async (event, { clipIds, videoPath }) => {
    console.log('Downloading filtered clips');
    const clipsPath = path.join(app.getPath('userData'), `clips_${path.basename(videoPath)}.json`);
    ensureFileExists(clipsPath);
    const allClips = JSON.parse(fs.readFileSync(clipsPath, 'utf8'));
    const filteredClips = allClips.filter(clip => clipIds.includes(clip.id));

    const saveDialog = await dialog.showSaveDialog({
      title: 'Save Filtered Clips',
      defaultPath: 'filtered_clips.mp4',
      filters: [{ name: 'MP4', extensions: ['mp4'] }]
    });

    if (saveDialog.canceled) {
      return;
    }

    await concatenateClips(videoPath, filteredClips, saveDialog.filePath);
  });

  ipcMain.handle('export-tags', async (event, videoPath) => {
    const clipsPath = path.join(app.getPath('userData'), `clips_${path.basename(videoPath)}.json`);
    const tagsPath = path.join(app.getPath('userData'), `tags_${path.basename(videoPath)}.json`);

    ensureFileExists(clipsPath);
    ensureFileExists(tagsPath);

    const clips = JSON.parse(fs.readFileSync(clipsPath, 'utf8'));
    const tags = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));

    const exportData = clips.map(clip => {
      const clipTags = tags.filter(tag => tag.clipId === clip.id).map(tag => tag.tag).join(', ');
      return `${clip.start},${clip.end},"${clip.text.replace(/"/g, '""')}","${clipTags}"`;
    });

    const csvContent = 'Start,End,Text,Tags\n' + exportData.join('\n');

    const saveDialog = await dialog.showSaveDialog({
      title: 'Export Tags',
      defaultPath: 'exported_tags.csv',
      filters: [
        { name: 'CSV', extensions: ['csv'] },
        { name: 'Text', extensions: ['txt'] }
      ]
    });

    if (saveDialog.canceled) {
      return;
    }

    fs.writeFileSync(saveDialog.filePath, csvContent, 'utf8');
  });

  ipcMain.handle('delete-clip', async (event, { clipId, videoPath }) => {
    console.log('Deleting clip:', clipId);
    const clipsPath = path.join(app.getPath('userData'), `clips_${path.basename(videoPath)}.json`);
    const tagsPath = path.join(app.getPath('userData'), `tags_${path.basename(videoPath)}.json`);

    ensureFileExists(clipsPath);
    ensureFileExists(tagsPath);

    let clips = JSON.parse(fs.readFileSync(clipsPath, 'utf8'));
    let tags = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));

    clips = clips.filter(clip => clip.id !== clipId);
    tags = tags.filter(tag => tag.clipId !== clipId);

    fs.writeFileSync(clipsPath, JSON.stringify(clips));
    fs.writeFileSync(tagsPath, JSON.stringify(tags));
  });

  ipcMain.handle('delete-tag', async (event, { tagId, videoPath }) => {
    console.log('Deleting tag:', tagId);
    const tagsPath = path.join(app.getPath('userData'), `tags_${path.basename(videoPath)}.json`);

    ensureFileExists(tagsPath);

    let tags = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
    tags = tags.filter(tag => tag.id !== tagId);

    fs.writeFileSync(tagsPath, JSON.stringify(tags));
  });

  ipcMain.handle('clear-all-tags', async (event, videoPath) => {
    console.log('Clearing all tags');
    const tagsPath = path.join(app.getPath('userData'), `tags_${path.basename(videoPath)}.json`);

    fs.writeFileSync(tagsPath, '[]');
  });

  ipcMain.handle('edit-tag', async (event, { tagId, newTag, videoPath }) => {
    console.log('Editing tag:', { tagId, newTag });
    const tagsPath = path.join(app.getPath('userData'), `tags_${path.basename(videoPath)}.json`);

    ensureFileExists(tagsPath);

    let tags = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
    const tagIndex = tags.findIndex(tag => tag.id === tagId);

    if (tagIndex !== -1) {
      tags[tagIndex].tag = newTag;
      fs.writeFileSync(tagsPath, JSON.stringify(tags));
    } else {
      throw new Error('Tag not found');
    }
  });

  ipcMain.handle('delete-all-clips', async (event, videoPath) => {
    console.log('Deleting all clips');
    const clipsPath = path.join(app.getPath('userData'), `clips_${path.basename(videoPath)}.json`);
    const tagsPath = path.join(app.getPath('userData'), `tags_${path.basename(videoPath)}.json`);

    fs.writeFileSync(clipsPath, '[]');
    fs.writeFileSync(tagsPath, '[]');
  });

  ipcMain.handle('save-transcript', async (event, { videoPath, transcript }) => {
    const transcriptionPath = videoPath.replace(/\.[^/.]+$/, "_transcription.csv");
    const csvContent = "Start,End,Text\n" + transcript.map(segment =>
      `${segment.start},${segment.end},"${segment.text.replace(/"/g, '""')}"`
    ).join('\n');

    fs.writeFileSync(transcriptionPath, csvContent, 'utf8');
    console.log('Transcript saved:', transcriptionPath);
    return true;
  });

  ipcMain.handle('synthesize-clips', async (event, { text, type, template }) => {
    return new Promise((resolve, reject) => {
      console.log('Starting synthesis process');
      const pythonProcess = spawn('python3', ['synthesize.py'], { stdio: ['pipe', 'pipe', 'pipe'] });

      let stdoutData = '';
      let stderrData = '';

      const input = JSON.stringify({ text, type, template });
      pythonProcess.stdin.write(input);
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.error('Python stderr:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Synthesis failed. Error:', stderrData);
          reject(new Error(`Synthesis failed with exit code ${code}. Error: ${stderrData}`));
        } else {
          console.log('Synthesis complete. Output:', stdoutData);
          resolve(stdoutData);
        }
      });
    });
  });
});

function cutVideo(inputPath, start, end, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(start)
      .setDuration(parseTimeToSeconds(end) - parseTimeToSeconds(start))
      .output(outputPath)
      .outputOptions('-c:v libx264')  // Use H.264 codec
      .outputOptions('-c:a aac')      // Use AAC for audio
      .outputOptions('-f mp4')        // Force MP4 container
      .on('end', () => {
        console.log('Finished processing clip');
        resolve();
      })
      .on('error', (err) => {
        console.error('Error processing clip:', err);
        reject(err);
      })
      .run();
  });
}

function concatenateClips(inputPath, clips, outputPath) {
  return new Promise((resolve, reject) => {
    const filter = clips.map((clip, index) => {
      return `[0:v]trim=start=${parseTimeToSeconds(clip.start)}:end=${parseTimeToSeconds(clip.end)},setpts=PTS-STARTPTS[v${index}];` +
             `[0:a]atrim=start=${parseTimeToSeconds(clip.start)}:end=${parseTimeToSeconds(clip.end)},asetpts=PTS-STARTPTS[a${index}];`;
    }).join('');

    const concat = clips.map((clip, index) => `[v${index}][a${index}]`).join('') +
                   `concat=n=${clips.length}:v=1:a=1[outv][outa]`;

    ffmpeg(inputPath)
      .complexFilter(filter + concat, ['outv', 'outa'])
      .output(outputPath)
      .outputOptions('-c:v libx264')  // Use H.264 codec
      .outputOptions('-c:a aac')      // Use AAC for audio
      .outputOptions('-f mp4')        // Force MP4 container
      .on('end', () => {
        console.log('Finished concatenating clips');
        resolve();
      })
      .on('error', (err) => {
        console.error('Error concatenating clips:', err);
        reject(err);
      })
      .run();
  });
}

function parseTimeToSeconds(timeString) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
