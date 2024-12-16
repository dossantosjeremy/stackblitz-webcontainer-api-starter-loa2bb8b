// Tag management functionality
export class TagManager {
  constructor() {
    this.allTags = new Set();
  }

  async createTag(clipId, tag, videoPath) {
    try {
      const newTag = await window.ipcRenderer.invoke('create-tag', { 
        clipId, 
        tag, 
        videoPath 
      });
      this.allTags.add(tag);
      return newTag;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  async deleteTag(tagId, videoPath) {
    try {
      await window.ipcRenderer.invoke('delete-tag', { tagId, videoPath });
      // Update allTags after deletion
      await this.updateAllTags(videoPath);
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }

  async updateAllTags(videoPath) {
    try {
      const { tags } = await window.ipcRenderer.invoke('get-clips-and-tags', videoPath);
      this.allTags.clear();
      tags.forEach(tag => this.allTags.add(tag.tag));
      this.updateTagFilterSelect();
    } catch (error) {
      console.error('Error updating tags:', error);
      throw error;
    }
  }

  updateTagFilterSelect() {
    const tagFilterSelect = document.getElementById('tag-filter');
    const currentSelection = tagFilterSelect.value;

    // Clear existing options except the first one
    while (tagFilterSelect.options.length > 1) {
      tagFilterSelect.remove(1);
    }

    // Add sorted tags as options
    Array.from(this.allTags)
      .sort()
      .forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilterSelect.appendChild(option);
      });

    // Restore selection if it still exists
    if (this.allTags.has(currentSelection)) {
      tagFilterSelect.value = currentSelection;
    }
  }

  clear() {
    this.allTags.clear();
    this.updateTagFilterSelect();
  }
}