// Clip management functionality
export class ClipManager {
  constructor() {
    this.clips = [];
    this.filteredClips = [];
    this.currentSelection = null;
  }

  async createClip(videoPath, selection, tags) {
    try {
      const clip = await window.ipcRenderer.invoke('create-clip', { 
        ...selection, 
        videoPath 
      });
      
      this.clips.push(clip);
      
      // Create tags if provided
      for (const tag of tags) {
        await window.ipcRenderer.invoke('create-tag', { 
          clipId: clip.id, 
          tag, 
          videoPath 
        });
      }
      
      return clip;
    } catch (error) {
      console.error('Error creating clip:', error);
      throw error;
    }
  }

  async deleteClip(clipId, videoPath) {
    try {
      await window.ipcRenderer.invoke('delete-clip', { clipId, videoPath });
      this.clips = this.clips.filter(clip => clip.id !== clipId);
      this.updateFilteredClips();
    } catch (error) {
      console.error('Error deleting clip:', error);
      throw error;
    }
  }

  async downloadClip(clipId, videoPath) {
    try {
      await window.ipcRenderer.invoke('download-clip', { clipId, videoPath });
    } catch (error) {
      console.error('Error downloading clip:', error);
      throw error;
    }
  }

  updateFilteredClips(selectedTag = '') {
    this.filteredClips = selectedTag ? 
      this.clips.filter(clip => clip.tags.includes(selectedTag)) : 
      [...this.clips];
  }

  clear() {
    this.clips = [];
    this.filteredClips = [];
    this.currentSelection = null;
  }
}