// Transcript management functionality
export class TranscriptManager {
  constructor() {
    this.transcriptData = [];
    this.isTranscriptEditable = false;
  }

  async transcribeVideo(videoPath, language) {
    try {
      const transcriptionPath = await window.ipcRenderer.invoke('transcribe-video', {
        videoPath,
        language
      });
      const response = await fetch(`file://${transcriptionPath}`);
      const csvText = await response.text();
      this.transcriptData = this.parseCSV(csvText);
      this.displayTranscript();
      return true;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  parseCSV(csvText) {
    const lines = csvText.split('\n');
    return lines.slice(1).map(line => {
      const [start, end, ...textParts] = line.split(',');
      const text = textParts.join(',').trim().replace(/^"(.*)"$/, '$1');
      return { start, end, text };
    }).filter(item => item.start && item.end && item.text);
  }

  displayTranscript() {
    const transcriptDiv = document.getElementById('transcript');
    transcriptDiv.innerHTML = this.transcriptData.map((segment, index) => `
      <div class="transcript-line" data-index="${index}" data-start="${segment.start}" data-end="${segment.end}">
        <span class="transcript-timestamp">[${segment.start}]</span>
        <span class="transcript-text">${segment.text}</span>
      </div>
    `).join('');
  }

  toggleEditing() {
    const transcriptDiv = document.getElementById('transcript');
    const editTranscriptBtn = document.getElementById('editTranscriptBtn');
    const saveTranscriptBtn = document.getElementById('saveTranscriptBtn');

    this.isTranscriptEditable = !this.isTranscriptEditable;
    transcriptDiv.contentEditable = this.isTranscriptEditable;
    transcriptDiv.classList.toggle('editable-transcript', this.isTranscriptEditable);
    editTranscriptBtn.textContent = this.isTranscriptEditable ? 'Cancel Editing' : 'Edit Transcript';
    saveTranscriptBtn.classList.toggle('hidden', !this.isTranscriptEditable);
  }

  async saveTranscript(videoPath) {
    const transcriptDiv = document.getElementById('transcript');
    const newTranscript = transcriptDiv.innerText;
    const words = newTranscript.split(/\s+/);

    const newTranscriptData = this.transcriptData.map((segment, index) => {
      const wordCount = segment.text.split(/\s+/).length;
      const newText = words.splice(0, wordCount).join(' ');
      return { ...segment, text: newText };
    });

    this.transcriptData = newTranscriptData;
    this.displayTranscript();
    this.toggleEditing();

    try {
      await window.ipcRenderer.invoke('save-transcript', { 
        videoPath, 
        transcript: this.transcriptData 
      });
    } catch (error) {
      console.error('Error saving transcript:', error);
      throw error;
    }
  }

  clear() {
    this.transcriptData = [];
    this.isTranscriptEditable = false;
    this.displayTranscript();
  }
}