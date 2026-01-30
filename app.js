'use strict';

// Constants & Configuration
const CONFIG = {
    API_URL: 'https://www.cbs.co.kr/board/list/cbs_P000250_relisten?sort=field.broadDate&order=desc&limit=50&returnType=ajax&page=1',
    SPEEDS: [1.0, 1.25, 1.5, 2.0]
};

const ICONS = {
    PLAY: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
    PAUSE: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
};

// Application State
const state = {
    podcasts: [],
    currentIndex: -1,
    currentSpeed: 1.25
};

// DOM Elements Cache
const UI = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    podcastList: document.getElementById('podcastList'),
    audioPlayer: document.getElementById('audioPlayer'),
    playerControls: document.getElementById('playerControls'),
    progressFill: document.getElementById('progressFill'),
    progressBar: document.getElementById('progressBar'),
    timeDisplay: document.getElementById('timeDisplay'),
    currentDate: document.getElementById('currentDate'),
    speedBtn: document.getElementById('speedBtn'),
    refreshBtn: document.getElementById('refreshBtn')
};

// --- Core Logic ---

async function loadPodcasts() {
    UI.loading.classList.add('active');
    UI.error.style.display = 'none';
    UI.podcastList.style.opacity = '0.5';

    try {
        const response = await fetch(CONFIG.API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        state.podcasts = data.items || [];
        
        if (state.podcasts.length === 0) {
            showError('팟캐스트 목록이 비어있습니다.');
            return;
        }
        
        renderPodcasts();
    } catch (error) {
        console.error('Fetch error:', error);
        if (!navigator.onLine) {
            showError('인터넷 연결을 확인해주세요. (오프라인)');
        } else {
            showError('팟캐스트를 불러오는데 실패했습니다.');
        }
    } finally {
        UI.loading.classList.remove('active');
        UI.podcastList.style.opacity = '1';
    }
}

function renderPodcasts() {
    UI.podcastList.innerHTML = '';
    
    state.podcasts.forEach((podcast, index) => {
        const li = document.createElement('li');
        li.className = 'podcast-item';
        li.dataset.index = index; // for easier selection
        if (index === state.currentIndex) li.classList.add('playing');
        
        const date = podcast.field.broadDate;
        
        // Button state logic
        const isCurrent = index === state.currentIndex;
        const isPlaying = isCurrent && !UI.audioPlayer.paused;
        const btnContent = isPlaying ? ICONS.PAUSE : ICONS.PLAY;
        const btnClass = isPlaying ? 'play-button playing' : 'play-button';

        li.innerHTML = `
            <div class="podcast-info">
                <div class="podcast-date">${formatDate(date)}</div>
            </div>
            <button class="${btnClass}" data-action="play" data-index="${index}" aria-label="${isPlaying ? '일시정지' : '재생'}">
                ${btnContent}
            </button>
        `;
        
        UI.podcastList.appendChild(li);
    });
}

async function playPodcast(index) {
    if (state.currentIndex === index) {
        togglePlayback(index);
        return;
    }
    
    const prevIndex = state.currentIndex;
    state.currentIndex = index;
    const podcast = state.podcasts[index];
    
    // UI Update for Previous Item
    updateItemUI(prevIndex, false);
    
    // UI Update for Current Item
    updateItemUI(index, true); // Mark as playing initially
    
    // Audio Setup
    let audioUrl = podcast.field.audioUrl;
    if (audioUrl && audioUrl.startsWith('http:')) {
        audioUrl = audioUrl.replace('http:', 'https:');
    }
    UI.audioPlayer.src = audioUrl;
    
    try {
        await UI.audioPlayer.play();
        UI.audioPlayer.playbackRate = state.currentSpeed;
        
        // Show Controls
        UI.playerControls.classList.add('active');
        UI.currentDate.textContent = formatDate(podcast.field.broadDate);
        document.body.style.paddingBottom = (UI.playerControls.offsetHeight + 20) + 'px';
        
    } catch (error) {
        console.error(error);
        showError('재생할 수 없습니다: ' + error.message);
        updateItemUI(index, false); // Revert UI if fail
    }
}

function togglePlayback(index) {
    if (UI.audioPlayer.paused) {
        UI.audioPlayer.play()
            .then(() => updateItemUI(index, true))
            .catch(e => console.error(e));
    } else {
        UI.audioPlayer.pause();
        updateItemUI(index, false);
    }
}

function updateItemUI(index, isPlaying) {
    if (index === -1) return;
    
    const items = UI.podcastList.children;
    if (index >= items.length) return;
    
    const li = items[index];
    const btn = li.querySelector('.play-button');
    
    // List Item Style
    if (isPlaying || index === state.currentIndex) {
        li.classList.add('playing');
    } else {
        li.classList.remove('playing');
    }

    // Button Style
    if (btn) {
        btn.innerHTML = isPlaying ? ICONS.PAUSE : ICONS.PLAY;
        btn.setAttribute('aria-label', isPlaying ? '일시정지' : '재생');
        if (isPlaying) btn.classList.add('playing');
        else btn.classList.remove('playing');
    }
}

function toggleSpeed() {
    let idx = CONFIG.SPEEDS.indexOf(state.currentSpeed);
    idx = (idx + 1) % CONFIG.SPEEDS.length;
    state.currentSpeed = CONFIG.SPEEDS[idx];
    
    UI.speedBtn.textContent = state.currentSpeed + 'x';
    UI.audioPlayer.playbackRate = state.currentSpeed;
}

// --- Helpers ---

function showError(message) {
    UI.error.textContent = message;
    UI.error.style.display = 'block';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${year}.${month}.${day}(${days[date.getDay()]})`;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

// --- Event Listeners ---

function init() {
    loadPodcasts();

    // Event Delegation for Podcast List
    UI.podcastList.addEventListener('click', (e) => {
        const btn = e.target.closest('.play-button');
        if (btn) {
            const index = parseInt(btn.dataset.index, 10);
            playPodcast(index);
        }
    });

    // Controls
    UI.speedBtn.addEventListener('click', toggleSpeed);
    UI.refreshBtn.addEventListener('click', loadPodcasts);

    // Audio Player Events
    UI.audioPlayer.addEventListener('timeupdate', () => {
        if (!UI.audioPlayer.duration) return;
        const progress = (UI.audioPlayer.currentTime / UI.audioPlayer.duration) * 100;
        UI.progressFill.style.width = progress + '%';
        
        UI.timeDisplay.textContent = 
            `${formatTime(UI.audioPlayer.currentTime)} / ${formatTime(UI.audioPlayer.duration)}`;
    });

    UI.audioPlayer.addEventListener('ended', async () => {
        if (state.currentIndex > 0) {
            await playPodcast(state.currentIndex - 1);
        } else {
            updateItemUI(state.currentIndex, false);
            UI.podcastList.children[state.currentIndex]?.classList.remove('playing');
        }
    });

    // Progress Bar Click
    UI.progressBar.addEventListener('click', (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const clickedValue = x / rect.width;
        if (UI.audioPlayer.duration) {
            UI.audioPlayer.currentTime = clickedValue * UI.audioPlayer.duration;
        }
    });

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('SW Registered'))
            .catch(err => console.log('SW Failed:', err));
    }
}

// Start App
document.addEventListener('DOMContentLoaded', init);
