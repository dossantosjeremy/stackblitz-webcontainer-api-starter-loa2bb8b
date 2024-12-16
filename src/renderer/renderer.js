const { ipcRenderer } = require('electron');

// Element references
const selectVideoBtn = document.getElementById('selectVideo');
const transcribeVideoBtn = document.getElementById('transcribeVideo');
const videoPlayer = document.getElementById('videoPlayer');
const transcriptDiv = document.getElementById('transcript');
const clipsAndTagsDiv = document.getElementById('clips-and-tags');
const downloadAllClipsBtn = document.getElementById('downloadAllClips');
const downloadFilteredClipsBtn = document.getElementById('downloadFilteredClips');
const createClipBtn = document.getElementById('createClipBtn');
const tagInput = document.getElementById('tagInput');
const tagFilterSelect = document.getElementById('tag-filter');
const resetFiltersBtn = document.getElementById('reset-filters');
const exportTagsBtn = document.getElementById('export-tags');
const clearAllTagsBtn = document.getElementById('clear-all-tags');
const deleteAllClipsBtn = document.getElementById('delete-all-clips');
const synthesizeClipsBtn = document.getElementById('synthesize-clips');
const synthesisOutput = document.getElementById('synthesis-output');

// Video Explorer elements
const importVideoBtn = document.getElementById('importVideo');
const videoList = document.getElementById('video-list');
const clearAllVideosBtn = document.getElementById('clearAllVideos');
const contextMenu = document.getElementById('context-menu');
const renameVideoMenuItem = document.getElementById('rename-video');
const deleteVideoMenuItem = document.getElementById('delete-video');
const renameVideoModal = document.getElementById('renameVideoModal');
const renameVideoInput = document.getElementById('renameVideoInput');
const confirmRenameVideoBtn = document.getElementById('confirmRenameVideo');

// Add/Edit Tag Modal elements
const addTagModal = document.getElementById('addTagModal');
const editTagModal = document.getElementById('editTagModal');
const newTagInput = document.getElementById('newTagInput');
const editTagInput = document.getElementById('editTagInput');
const confirmAddTagBtn = document.getElementById('confirmAddTag');
const confirmEditTagBtn = document.getElementById('confirmEditTag');

// Drag and drop functionality
const dragDropArea = document.getElementById('drag-drop-area');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// Transcript editing
const editTranscriptBtn = document.getElementById('editTranscriptBtn');
const saveTranscriptBtn = document.getElementById('saveTranscriptBtn');

let currentVideoPath = '';
let transcriptData = [];
let currentSelection = null;
let allTags = new Set();
let clips = [];
let filteredClips = [];
let importedVideos = [];
let selectedVideo = null;
let currentEditingClipId = null;
let currentEditingTagId = null;
let isTranscriptEditable = false;

if (transcribeVideoBtn) {
    transcribeVideoBtn.addEventListener('click', async () => {
        if (!currentVideoPath) return;

        const languageSelect = document.getElementById('languageSelect');
        const selectedLanguage = languageSelect ? languageSelect.value : 'en';

        transcribeVideoBtn.disabled = true;
        showLoading('Transcribing video...');

        try {
            const transcriptionPath = await ipcRenderer.invoke('transcribe-video', {
                videoPath: currentVideoPath,
                language: selectedLanguage
            });
            const response = await fetch(`file://${transcriptionPath}`);
            const csvText = await response.text();
            transcriptData = parseCSV(csvText);
            displayTranscript(transcriptData);
        } catch (error) {
            console.error('Transcription error:', error);
            if (transcriptDiv) {
                transcriptDiv.textContent = `Error during transcription: ${error.message}`;
            }
            alert(`Transcription failed: ${error.message}`);
        } finally {
            transcribeVideoBtn.disabled = false;
            hideLoading();
        }
    });
}

// Video Explorer functionality
importVideoBtn.addEventListener('click', async () => {
    const result = await ipcRenderer.invoke('import-video');
    if (result) {
        importedVideos.push(result);
        updateVideoList();
    }
});

// Drag and drop functionality
dragDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDropArea.classList.add('bg-blue-100');
});

dragDropArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDropArea.classList.remove('bg-blue-100');
});

dragDropArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDropArea.classList.remove('bg-blue-100');

    const files = Array.from(e.dataTransfer.files);
const mediaFiles = files.filter(file =>
    file.type.startsWith('video/') ||
    file.type.startsWith('audio/') ||
    ['.mov', '.wav', '.mp3', '.m4a'].some(ext => file.name.toLowerCase().endsWith(ext))
);

    for (const file of mediaFiles) {
        const result = await ipcRenderer.invoke('import-video', file.path);
        if (result) {
            importedVideos.push(result);
        }
    }

    updateVideoList();
});

function updateVideoList() {
    videoList.innerHTML = importedVideos.map((video, index) => `
        <div class="video-item p-2 mb-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer" data-index="${index}">
            ${video.name}
        </div>
    `).join('');

    const videoItems = videoList.querySelectorAll('.video-item');
    videoItems.forEach(item => {
        item.addEventListener('click', selectVideo);
        item.addEventListener('contextmenu', showContextMenu);
    });
}

async function selectVideo(event) {
    const index = event.target.dataset.index;
    selectedVideo = importedVideos[index];
    currentVideoPath = selectedVideo.path;
    videoPlayer.src = `file://${currentVideoPath}`;
    transcribeVideoBtn.disabled = false;

    const videoItems = videoList.querySelectorAll('.video-item');
    videoItems.forEach(item => item.classList.remove('bg-blue-200'));
    event.target.classList.add('bg-blue-200');

    // Clear previous transcript and clips
    clearTranscript();
    clipsAndTagsDiv.innerHTML = '';
    synthesisOutput.value = '';
    clips = [];
    filteredClips = [];

    // Load transcript if it exists
    showLoading('Loading transcript...');
    try {
        await loadTranscript(currentVideoPath);
    } finally {
        hideLoading();
    }
}

function clearTranscript() {
    transcriptDiv.innerHTML = '';
    transcriptData = [];
    editTranscriptBtn.textContent = 'Edit Transcript';
    saveTranscriptBtn.classList.add('hidden');
    isTranscriptEditable = false;
}

async function loadTranscript(videoPath) {
    try {
        const transcriptionPath = await ipcRenderer.invoke('get-transcription-path', videoPath);
        if (transcriptionPath) {
            const response = await fetch(`file://${transcriptionPath}`);
            const csvText = await response.text();
            transcriptData = parseCSV(csvText);
            displayTranscript(transcriptData);
            await updateClipsAndTags();
        } else {
            clearTranscript();
        }
    } catch (error) {
        console.error('Error loading transcript:', error);
        clearTranscript();
    }
}

function showContextMenu(event) {
    event.preventDefault();
    const index = event.target.dataset.index;
    selectedVideo = importedVideos[index];

    contextMenu.style.display = 'block';
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;
}

renameVideoMenuItem.addEventListener('click', showRenameVideoModal);
deleteVideoMenuItem.addEventListener('click', deleteSelectedVideo);

function showRenameVideoModal() {
    renameVideoInput.value = selectedVideo.name;
    renameVideoModal.style.display = 'block';
}

confirmRenameVideoBtn.addEventListener('click', () => {
    const newName = renameVideoInput.value.trim();
    if (newName) {
        selectedVideo.name = newName;
        updateVideoList();
        renameVideoModal.style.display = 'none';
    }
});

function deleteSelectedVideo() {
    const index = importedVideos.findIndex(video => video.path === selectedVideo.path);
    if (index !== -1) {
        importedVideos.splice(index, 1);
        updateVideoList();
        if (currentVideoPath === selectedVideo.path) {
            currentVideoPath = '';
            videoPlayer.src = '';
            transcribeVideoBtn.disabled = true;
            clearTranscript();
        }
    }
    contextMenu.style.display = 'none';
}

clearAllVideosBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all imported videos?')) {
        importedVideos = [];
        updateVideoList();
        currentVideoPath = '';
        videoPlayer.src = '';
        transcribeVideoBtn.disabled = true;
        clearTranscript();
    }
});

// Hide context menu when clicking outside
document.addEventListener('click', (event) => {
    if (event.target.closest('#context-menu') === null) {
        contextMenu.style.display = 'none';
    }
});

// Function to show loading overlay
function showLoading(message) {
    loadingText.textContent = message;
    loadingOverlay.classList.remove('hidden');
}

// Function to hide loading overlay
function hideLoading() {
    loadingOverlay.classList.add('hidden');
}


function parseCSV(csvText) {
    const lines = csvText.split('\n');
    return lines.slice(1).map(line => {
        const [start, end, ...textParts] = line.split(',');
        const text = textParts.join(',').trim().replace(/^"(.*)"$/, '$1');
        return { start, end, text };
    }).filter(item => item.start && item.end && item.text);
}

// Handle clicks on transcript lines
function handleTranscriptClick(event) {
    const line = event.target.closest('.transcript-line');
    if (line) {
        const startTime = parseTimeToSeconds(line.dataset.start);
        videoPlayer.currentTime = startTime;
    }
}

function displayTranscript(data) {
    transcriptDiv.innerHTML = data.map((segment, index) => `
        <div class="transcript-line" data-index="${index}" data-start="${segment.start}" data-end="${segment.end}">
            <span class="transcript-timestamp">[${segment.start}]</span>
            <span class="transcript-text">${segment.text}</span>
        </div>
    `).join('');

    // Add click event listener to transcript container
    transcriptDiv.addEventListener('click', handleTranscriptClick);
    transcriptDiv.addEventListener('mouseup', handleTextSelection);
}

function highlightCurrentTranscriptLine() {
    const currentTime = videoPlayer.currentTime;
    const transcriptLines = transcriptDiv.querySelectorAll('.transcript-line');

    transcriptLines.forEach(line => {
        const startTime = parseTimeToSeconds(line.dataset.start);
        const endTime = parseTimeToSeconds(line.dataset.end);

        if (currentTime >= startTime && currentTime < endTime) {
            line.classList.add('current-word');
            if (!isElementInViewport(line)) {
                line.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            line.classList.remove('current-word');
        }
    });
}

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    const containerRect = transcriptDiv.getBoundingClientRect();
    return (
        rect.top >= containerRect.top &&
        rect.left >= containerRect.left &&
        rect.bottom <= containerRect.bottom &&
        rect.right <= containerRect.right
    );
}

// Add timeupdate event listener to video player
videoPlayer.addEventListener('timeupdate', highlightCurrentTranscriptLine);

function handleTextSelection() {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
        const range = selection.getRangeAt(0);
        const startNode = range.startContainer.parentNode.closest('.transcript-line');
        const endNode = range.endContainer.parentNode.closest('.transcript-line');

        if (startNode && endNode) {
            const startTime = startNode.dataset.start;
            const endTime = endNode.dataset.end;

            videoPlayer.currentTime = parseTimeToSeconds(startTime);

            currentSelection = {
                start: startTime,
                end: endTime,
                text: selection.toString()
            };
            createClipBtn.disabled = false;
        }
    } else {
        currentSelection = null;
        createClipBtn.disabled = true;
    }
}

createClipBtn.addEventListener('click', async () => {
    if (!currentSelection) return;

    showLoading('Creating clip...');

    try {
        const clip = await ipcRenderer.invoke('create-clip', { ...currentSelection, videoPath: currentVideoPath });
        clips.push(clip);
        const tags = tagInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        for (const tag of tags) {
            await ipcRenderer.invoke('create-tag', { clipId: clip.id, tag, videoPath: currentVideoPath });
        }
        highlightClip(clip);
        await updateClipsAndTags();
        tagInput.value = '';
        currentSelection = null;
        createClipBtn.disabled = true;
    } catch (error) {
        console.error('Error creating clip:', error);
        alert(`Failed to create clip: ${error.message}`);
    } finally {
        hideLoading();
    }
});

function highlightClip(clip) {
    const startIndex = transcriptData.findIndex(segment => segment.start === clip.start);
    const endIndex = transcriptData.findIndex(segment => segment.end === clip.end);

    for (let i = startIndex; i <= endIndex; i++) {
        const paragraph = transcriptDiv.querySelector(`div[data-index="${i}"]`);
        if (paragraph) {
            paragraph.classList.add('highlighted-clip');
        }
    }
}

tagInput.addEventListener('mousedown', (e) => {
    e.preventDefault();
    tagInput.focus();
});

tagFilterSelect.addEventListener('change', updateClipsAndTags);

resetFiltersBtn.addEventListener('click', () => {
    tagFilterSelect.value = '';
    synthesisOutput.value = '';
    updateClipsAndTags();
});

function updateTagFilterSelect() {
    // Store current selection
    const currentSelection = tagFilterSelect.value;

    // Clear existing options except the first one (All Tags)
    while (tagFilterSelect.options.length > 1) {
        tagFilterSelect.remove(1);
    }

    // Get all unique tags and sort them
    const allTagsArray = Array.from(allTags).sort();

    // Add options for each tag
    allTagsArray.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilterSelect.appendChild(option);
    });

    // Restore selection if it still exists in the new options
    if (allTagsArray.includes(currentSelection)) {
        tagFilterSelect.value = currentSelection;
    }
}

// Update the reset filters function
resetFiltersBtn.addEventListener('click', () => {
    tagFilterSelect.value = '';
    synthesisOutput.value = '';
    updateClipsAndTags();
});

// Add an event listener for tag filter changes
tagFilterSelect.addEventListener('change', () => {
    updateClipsAndTags();
});

async function updateClipsAndTags() {
    try {
        const { clips: fetchedClips, tags } = await ipcRenderer.invoke('get-clips-and-tags', currentVideoPath);
        clips = fetchedClips;

        // Update allTags Set with all unique tags
        allTags.clear(); // Clear existing tags
        tags.forEach(tag => {
            allTags.add(tag.tag);
        });

        // Update the filter dropdown while preserving the selected value
        const selectedTag = tagFilterSelect.value;
        updateTagFilterSelect();
        tagFilterSelect.value = selectedTag; // Restore the selected value

        // Filter clips based on the selected tag
        filteredClips = clips.filter(clip => {
            if (selectedTag === '') {
                return true; // Show all clips when no tag is selected
            }
            const clipTags = tags.filter(tag => tag.clipId === clip.id).map(tag => tag.tag);
            return clipTags.includes(selectedTag);
        });

        displayClipsAndTags(filteredClips, tags);
    } catch (error) {
        console.error('Error updating clips and tags:', error);
        clipsAndTagsDiv.innerHTML = '<p>No clips or tags available. Create a clip to get started.</p>';
    }
}

function displayClipsAndTags(clips, tags) {
    if (clips.length === 0) {
        clipsAndTagsDiv.innerHTML = '<p class="text-gray-500">No clips available. Create a clip to get started.</p>';
        return;
    }

    clipsAndTagsDiv.innerHTML = clips.map(clip => {
        const clipTags = tags.filter(tag => tag.clipId === clip.id);
        const tagsHtml = clipTags.map(tag =>
            `<span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2">
                <span class="cursor-pointer" onclick="showEditTagModal('${tag.id}', '${tag.tag}')">${tag.tag}</span>
                <span class="ml-1 text-red-500 cursor-pointer" onclick="deleteTag('${tag.id}')">×</span>
            </span>`
        ).join(' ');

        return `
            <div class="clip-item bg-white p-4 rounded-lg shadow mb-4">
                <div class="flex justify-between items-center mb-2">
                    <strong class="text-lg">[${clip.start} - ${clip.end}]</strong>
                    <div>
                        <button class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 mr-2" onclick="deleteClip('${clip.id}')">Delete</button>
                        <button class="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600" onclick="playClip('${clip.id}')">Play</button>
                    </div>
                </div>
                <p class="mb-2"><strong>Text:</strong> ${clip.text}</p>
                <div class="mb-2">
                    <strong>Tags:</strong> ${tagsHtml}
                    <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="showAddTagModal('${clip.id}')">Add Tag</button>
                </div>
                <button class="bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600" onclick="downloadClip('${clip.id}')">Download Clip</button>
            </div>
        `;
    }).join('');
}

async function deleteClip(clipId) {
    if (confirm('Are you sure you want to delete this clip?')) {
        showLoading('Deleting clip...');
        try {
            await ipcRenderer.invoke('delete-clip', { clipId, videoPath: currentVideoPath });
            await updateClipsAndTags();
            removeClipHighlight(clipId);
        } catch (error) {
            console.error('Error deleting clip:', error);
            alert(`Failed to delete clip: ${error.message}`);
        } finally {
            hideLoading();
        }
    }
}

function removeClipHighlight(clipId) {
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
        const startIndex = transcriptData.findIndex(segment => segment.start === clip.start);
        const endIndex = transcriptData.findIndex(segment => segment.end === clip.end);

        for (let i = startIndex; i <= endIndex; i++) {
            const line = transcriptDiv.querySelector(`div[data-index="${i}"]`);
            if (line) {
                line.classList.remove('highlighted-clip');
            }
        }
    }
}

async function deleteTag(tagId) {
    if (confirm('Are you sure you want to delete this tag?')) {
        showLoading('Deleting tag...');
        try {
            await ipcRenderer.invoke('delete-tag', { tagId, videoPath: currentVideoPath });
            await updateClipsAndTags();
        } catch (error) {
            console.error('Error deleting tag:', error);
            alert(`Failed to delete tag: ${error.message}`);
        } finally {
            hideLoading();
        }
    }
}

function showAddTagModal(clipId) {
    currentEditingClipId = clipId;
    newTagInput.value = '';
    addTagModal.style.display = 'block';
}

function showEditTagModal(tagId, currentTag) {
    currentEditingTagId = tagId;
    editTagInput.value = currentTag;
    editTagModal.style.display = 'block';
}

// Update the addTag function to refresh the tag list
async function addTag() {
    const newTag = newTagInput.value.trim();
    if (newTag && currentEditingClipId) {
        showLoading('Adding tag...');
        try {
            await ipcRenderer.invoke('create-tag', { clipId: currentEditingClipId, tag: newTag, videoPath: currentVideoPath });
            await updateClipsAndTags();
            addTagModal.style.display = 'none';
        } catch (error) {
            console.error('Error adding tag:', error);
            alert(`Failed to add tag: ${error.message}`);
        } finally {
            hideLoading();
        }
    }
}

// Update the editTag function to refresh the tag list
async function editTag() {
    const newTag = editTagInput.value.trim();
    if (newTag && currentEditingTagId) {
        showLoading('Editing tag...');
        try {
            await ipcRenderer.invoke('edit-tag', { tagId: currentEditingTagId, newTag, videoPath: currentVideoPath });
            await updateClipsAndTags();
            editTagModal.style.display = 'none';
        } catch (error) {
            console.error('Error editing tag:', error);
            alert(`Failed to edit tag: ${error.message}`);
        } finally {
            hideLoading();
        }
    }
}

clearAllTagsBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all tags? This action cannot be undone.')) {
        showLoading('Clearing all tags...');
        try {
            await ipcRenderer.invoke('clear-all-tags', currentVideoPath);
            await updateClipsAndTags();
            alert('All tags have been cleared.');
        } catch (error) {
            console.error('Error clearing all tags:', error);
            alert(`Failed to clear all tags: ${error.message}`);
        } finally {
            hideLoading();
        }
    }
});

deleteAllClipsBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete all clips? This action cannot be undone.')) {
        showLoading('Deleting all clips...');
        try {
            await ipcRenderer.invoke('delete-all-clips', currentVideoPath);
            await updateClipsAndTags();
            removeAllClipHighlights();
            alert('All clips have been deleted.');
        } catch (error) {
            console.error('Error deleting all clips:', error);
            alert(`Failed to delete all clips: ${error.message}`);
        } finally {
            hideLoading();
        }
    }
});

function removeAllClipHighlights() {
    const highlightedLines = transcriptDiv.querySelectorAll('.highlighted-clip');
    highlightedLines.forEach(line => {
        line.classList.remove('highlighted-clip');
    });
}

async function downloadClip(clipId) {
    showLoading('Downloading clip...');
    try {
        await ipcRenderer.invoke('download-clip', { clipId, videoPath: currentVideoPath });
        alert('Clip downloaded successfully!');
    } catch (error) {
        console.error('Error downloading clip:', error);
        alert(`Failed to download clip: ${error.message}`);
    } finally {
        hideLoading();
    }
}

downloadAllClipsBtn.addEventListener('click', async () => {
    showLoading('Downloading all clips...');
    try {
        await ipcRenderer.invoke('download-all-clips', currentVideoPath);
        alert('All clips downloaded successfully!');
    } catch (error) {
        console.error('Error downloading all clips:', error);
        alert(`Failed to download all clips: ${error.message}`);
    } finally {
        hideLoading();
    }
});

downloadFilteredClipsBtn.addEventListener('click', async () => {
    showLoading('Downloading filtered clips...');
    try {
        const filteredClipIds = filteredClips.map(clip => clip.id);
        await ipcRenderer.invoke('download-filtered-clips', { clipIds: filteredClipIds, videoPath: currentVideoPath });
        alert('Filtered clips downloaded successfully!');
    } catch (error) {
        console.error('Error downloading filtered clips:', error);
        alert(`Failed to download filtered clips: ${error.message}`);
    } finally {
        hideLoading();
    }
});

function playClip(clipId) {
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
        videoPlayer.currentTime = parseTimeToSeconds(clip.start);
        videoPlayer.play();
        setTimeout(() => {
            videoPlayer.pause();
        }, (parseTimeToSeconds(clip.end) - parseTimeToSeconds(clip.start)) * 1000);
    }
}

exportTagsBtn.addEventListener('click', async () => {
    showLoading('Exporting tags...');
    try {
        await ipcRenderer.invoke('export-tags', currentVideoPath);
        alert('Tags exported successfully!');
    } catch (error) {
        console.error('Error exporting tags:', error);
        alert(`Failed to export tags: ${error.message}`);
    } finally {
        hideLoading();
    }
});

// Transcript editing
editTranscriptBtn.addEventListener('click', toggleTranscriptEditing);
saveTranscriptBtn.addEventListener('click', saveTranscript);

function toggleTranscriptEditing() {
    isTranscriptEditable = !isTranscriptEditable;
    transcriptDiv.contentEditable = isTranscriptEditable;
    transcriptDiv.classList.toggle('editable-transcript', isTranscriptEditable);
    editTranscriptBtn.textContent = isTranscriptEditable ? 'Cancel Editing' : 'Edit Transcript';
    saveTranscriptBtn.classList.toggle('hidden', !isTranscriptEditable);
}

async function saveTranscript() {
    const newTranscript = transcriptDiv.innerText;
    const words = newTranscript.split(/\s+/);

    // Distribute words across existing time segments
    const newTranscriptData = transcriptData.map((segment, index) => {
        const wordCount = segment.text.split(/\s+/).length;
        const newText = words.splice(0, wordCount).join(' ');
        return { ...segment, text: newText };
    });

    transcriptData = newTranscriptData;
    displayTranscript(transcriptData);
    toggleTranscriptEditing();

    // Save updated transcript
    try {
        await ipcRenderer.invoke('save-transcript', { videoPath: currentVideoPath, transcript: transcriptData });
    } catch (error) {
        console.error('Error saving transcript:', error);
        alert(`Failed to save transcript: ${error.message}`);
    }
}

function parseTimeToSeconds(timeString) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

// Synthesis functionality
// Add after the element references at the top
const synthesizeTranscriptBtn = document.getElementById('synthesize-transcript');

// Add the event listeners where the old synthesize listener was
synthesizeTranscriptBtn.addEventListener('click', async () => {
    const synthesisType = document.getElementById('synthesis-type').value;
    const templateType = document.getElementById('template-type').value;

    showLoading('Synthesizing full transcript...');
    try {
        // Join all transcript segments
        const fullText = transcriptData.map(segment => segment.text).join(' ');
        const synthesis = await ipcRenderer.invoke('synthesize-clips', {
            text: fullText,
            type: synthesisType,
            template: templateType
        });
        synthesisOutput.value = synthesis;
    } catch (error) {
        console.error('Error synthesizing transcript:', error);
        synthesisOutput.value = `Error synthesizing transcript: ${error.message}`;
    } finally {
        hideLoading();
    }
});

synthesizeClipsBtn.addEventListener('click', async () => {
    const synthesisType = document.getElementById('synthesis-type').value;
    const templateType = document.getElementById('template-type').value;

    if (filteredClips.length === 0) {
        alert('No clips selected. Please create or select clips first.');
        return;
    }

    showLoading('Synthesizing selected clips...');
    try {
        const clipsText = filteredClips.map(clip => {
            const tags = document.querySelectorAll(`[data-clip-id="${clip.id}"] .tag`);
            const tagTexts = Array.from(tags).map(tag => tag.textContent).join(', ');
            return `[Clip ${clip.start}-${clip.end}${tagTexts ? ` Tags: ${tagTexts}` : ''}]\n${clip.text}`;
        }).join('\n\n');

        const synthesis = await ipcRenderer.invoke('synthesize-clips', {
            text: clipsText,
            type: synthesisType,
            template: templateType
        });
        synthesisOutput.value = synthesis;
    } catch (error) {
        console.error('Error synthesizing clips:', error);
        synthesisOutput.value = `Error synthesizing clips: ${error.message}`;
    } finally {
        hideLoading();
    }
});

// Modal event listeners
confirmAddTagBtn.addEventListener('click', addTag);
confirmEditTagBtn.addEventListener('click', editTag);

// Close modals when clicking on <span> (x)
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        addTagModal.style.display = 'none';
        editTagModal.style.display = 'none';
        renameVideoModal.style.display = 'none';
    });
});

// Close modals when clicking outside of them
window.addEventListener('click', (event) => {
    if (event.target === addTagModal) {
        addTagModal.style.display = 'none';
    }
    if (event.target === editTagModal) {
        editTagModal.style.display = 'none';
    }
    if (event.target === renameVideoModal) {
        renameVideoModal.style.display = 'none';
    }
});

// Make these functions global so they can be called from HTML
window.deleteClip = deleteClip;
window.deleteTag = deleteTag;
window.downloadClip = downloadClip;
window.showAddTagModal = showAddTagModal;
window.showEditTagModal = showEditTagModal;
window.playClip = playClip;

// Progress updates
ipcRenderer.on('transcription-progress', (event, message) => {
    console.log('Transcription progress:', message);
    loadingText.textContent = `Transcribing: ${message}`;
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    tagInput.value = '';
    tagFilterSelect.value = '';
    synthesisOutput.value = '';
    updateVideoList();
    clearTranscript();
});
