// Video player functionality
export class VideoPlayer {
  constructor() {
    this.player = document.getElementById('videoPlayer');
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.player.addEventListener('timeupdate', this.handleTimeUpdate.bind(this));
    this.player.addEventListener('play', this.handlePlay.bind(this));
    this.player.addEventListener('pause', this.handlePause.bind(this));
  }

  handleTimeUpdate() {
    const currentTime = this.player.currentTime;
    this.highlightCurrentTranscriptLine(currentTime);
  }

  handlePlay() {
    // Handle play event
  }

  handlePause() {
    // Handle pause event
  }

  setSource(path) {
    this.player.src = `file://${path}`;
  }

  play() {
    this.player.play();
  }

  pause() {
    this.player.pause();
  }

  seek(time) {
    this.player.currentTime = time;
  }

  playClip(startTime, endTime) {
    this.seek(startTime);
    this.play();
    setTimeout(() => {
      this.pause();
    }, (endTime - startTime) * 1000);
  }

  highlightCurrentTranscriptLine(currentTime) {
    // Implementation moved from renderer.js
    const transcriptLines = document.querySelectorAll('.transcript-line');
    
    transcriptLines.forEach(line => {
      const startTime = this.parseTimeToSeconds(line.dataset.start);
      const endTime = this.parseTimeToSeconds(line.dataset.end);

      if (currentTime >= startTime && currentTime < endTime) {
        line.classList.add('current-word');
        if (!this.isElementInViewport(line)) {
          line.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        line.classList.remove('current-word');
      }
    });
  }

  parseTimeToSeconds(timeString) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  isElementInViewport(el) {
    const transcriptDiv = document.getElementById('transcript');
    const rect = el.getBoundingClientRect();
    const containerRect = transcriptDiv.getBoundingClientRect();
    return (
      rect.top >= containerRect.top &&
      rect.left >= containerRect.left &&
      rect.bottom <= containerRect.bottom &&
      rect.right <= containerRect.right
    );
  }
}