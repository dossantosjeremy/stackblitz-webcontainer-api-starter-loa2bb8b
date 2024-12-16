// DOM manipulation and UI updates
export class DOMManager {
  static updateVideoList(videos) {
    const videoList = document.getElementById('video-list');
    videoList.innerHTML = videos.map((video, index) => `
      <div class="video-item p-2 mb-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer" data-index="${index}">
        ${video.name}
      </div>
    `).join('');
  }

  static updateTranscript(segments) {
    const transcriptDiv = document.getElementById('transcript');
    transcriptDiv.innerHTML = segments.map((segment, index) => `
      <div class="transcript-line" data-index="${index}" data-start="${segment.start}" data-end="${segment.end}">
        <span class="transcript-timestamp">[${segment.start}]</span>
        <span class="transcript-text">${segment.text}</span>
      </div>
    `).join('');
  }

  static updateClipsAndTags(clips, tags) {
    const clipsContainer = document.getElementById('clips-and-tags');
    if (clips.length === 0) {
      clipsContainer.innerHTML = '<p class="text-gray-500">No clips available. Create a clip to get started.</p>';
      return;
    }

    clipsContainer.innerHTML = this.generateClipsHTML(clips, tags);
  }

  static generateClipsHTML(clips, tags) {
    return clips.map(clip => {
      const clipTags = tags.filter(tag => tag.clipId === clip.id);
      const tagsHtml = this.generateTagsHTML(clipTags);

      return `
        <div class="clip-item bg-white p-4 rounded-lg shadow mb-4">
          <div class="flex justify-between items-center mb-2">
            <strong class="text-lg">[${clip.start} - ${clip.end}]</strong>
            <div class="flex gap-2">
              <button onclick="window.handleDeleteClip('${clip.id}')" 
                      class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                Delete
              </button>
              <button onclick="window.handlePlayClip('${clip.id}')"
                      class="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                Play
              </button>
            </div>
          </div>
          <p class="mb-2"><strong>Text:</strong> ${clip.text}</p>
          <div class="mb-2">
            <strong>Tags:</strong> ${tagsHtml}
            <button onclick="window.handleAddTag('${clip.id}')"
                    class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
              Add Tag
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  static generateTagsHTML(tags) {
    return tags.map(tag => `
      <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2">
        <span class="cursor-pointer" onclick="window.handleEditTag('${tag.id}', '${tag.tag}')">
          ${tag.tag}
        </span>
        <span class="ml-1 text-red-500 cursor-pointer" onclick="window.handleDeleteTag('${tag.id}')">×</span>
      </span>
    `).join('');
  }
}