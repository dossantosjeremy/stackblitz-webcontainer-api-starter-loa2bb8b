// Synthesis functionality
export class SynthesisManager {
  constructor() {
    this.synthesisTypes = {
      summary: "Chapter Summary",
      minutes: "Meeting Minutes",
      actions: "Action Items & Deadlines",
      title: "Title Suggestions",
      outline: "Content Outline",
      "key-points": "Key Discussion Points"
    };

    this.templateTypes = {
      meeting: "Meeting",
      lecture: "Lecture",
      interview: "Interview",
      general: "General"
    };
  }

  async synthesizeTranscript(transcriptData) {
    const synthesisType = document.getElementById('synthesis-type').value;
    const templateType = document.getElementById('template-type').value;

    try {
      const fullText = transcriptData.map(segment => segment.text).join(' ');
      const synthesis = await window.ipcRenderer.invoke('synthesize-clips', {
        text: fullText,
        type: synthesisType,
        template: templateType
      });
      return synthesis;
    } catch (error) {
      console.error('Error synthesizing transcript:', error);
      throw error;
    }
  }

  async synthesizeClips(clips) {
    const synthesisType = document.getElementById('synthesis-type').value;
    const templateType = document.getElementById('template-type').value;

    if (clips.length === 0) {
      throw new Error('No clips selected');
    }

    try {
      const clipsText = clips.map(clip => {
        const tagTexts = clip.tags.join(', ');
        return `[Clip ${clip.start}-${clip.end}${tagTexts ? ` Tags: ${tagTexts}` : ''}]\n${clip.text}`;
      }).join('\n\n');

      const synthesis = await window.ipcRenderer.invoke('synthesize-clips', {
        text: clipsText,
        type: synthesisType,
        template: templateType
      });
      return synthesis;
    } catch (error) {
      console.error('Error synthesizing clips:', error);
      throw error;
    }
  }
}