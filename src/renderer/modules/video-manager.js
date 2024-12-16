// Video management functionality
export class VideoManager {
  constructor() {
    this.importedVideos = [];
    this.selectedVideo = null;
    this.currentVideoPath = '';
  }

  async importVideo() {
    const result = await window.ipcRenderer.invoke('import-video');
    if (result) {
      this.importedVideos.push(result);
      this.updateVideoList();
    }
  }

  updateVideoList() {
    const videoList = document.getElementById('video-list');
    videoList.innerHTML = this.importedVideos.map((video, index) => `
      <div class="video-item p-2 mb-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer" data-index="${index}">
        ${video.name}
      </div>
    `).join('');

    const videoItems = videoList.querySelectorAll('.video-item');
    videoItems.forEach(item => {
      item.addEventListener('click', this.selectVideo.bind(this));
      item.addEventListener('contextmenu', this.showContextMenu.bind(this));
    });
  }

  async selectVideo(event) {
    const index = event.target.dataset.index;
    this.selectedVideo = this.importedVideos[index];
    this.currentVideoPath = this.selectedVideo.path;
    
    // Update UI
    const videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.src = `file://${this.currentVideoPath}`;
    
    // Update video items highlighting
    const videoItems = document.querySelectorAll('.video-item');
    videoItems.forEach(item => item.classList.remove('bg-blue-200'));
    event.target.classList.add('bg-blue-200');

    return this.currentVideoPath;
  }

  showContextMenu(event) {
    event.preventDefault();
    const index = event.target.dataset.index;
    this.selectedVideo = this.importedVideos[index];

    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;
  }

  clearAll() {
    this.importedVideos = [];
    this.selectedVideo = null;
    this.currentVideoPath = '';
    this.updateVideoList();
  }
}