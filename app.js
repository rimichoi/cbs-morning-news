'use strict';

// Constants & Configuration
const CONFIG = {
    API_URL: 'https://www.cbs.co.kr/board/list/cbs_P000250_relisten?sort=field.broadDate&order=desc&limit=50&returnType=ajax&page=1',
    SPEEDS: [1.0, 1.25, 1.5, 2.0],
    PROGRESS_SAVE_INTERVAL: 5000,
    MIN_RESUME_TIME: 3
};

const ICONS = {
    PLAY: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
    PAUSE: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
};

// Application State
const state = {
    podcasts: [],
    currentIndex: -1,
    currentSpeed: 1.25,
    lastSaveTime: 0,
    isLoading: false
};

// DOM Elements Cache
let UI = null;

// Initialize DOM references
function initUI() {
    UI = {
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
        refreshBtn: document.getElementById('refreshBtn'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn')
    };
}

// --- Core Logic ---

async function loadPodcasts() {
    if (state.isLoading) return;
    
    state.isLoading = true;
    UI.loading.classList.add('active');
    UI.error.style.display = 'none';
    UI.podcastList.style.opacity = '0.5';

    try {
        const response = await fetch(CONFIG.API_URL);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        state.podcasts = data.items || [];
        
        if (state.podcasts.length === 0) {
            showError('팟캐스트 목록이 비어있습니다.');
            return;
        }
        
        renderPodcasts();
    } catch (error) {
        console.error('Load podcasts error:', error);
        if (!navigator.onLine) {
            showError('인터넷 연결을 확인해주세요. (오프라인)');
        } else {
            showError(`팟캐스트를 불러오는데 실패했습니다: ${error.message}`);
        }
    } finally {
        state.isLoading = false;
        UI.loading.classList.remove('active');
        UI.podcastList.style.opacity = '1';
    }
}

function renderPodcasts() {
    UI.podcastList.innerHTML = '';
    
    state.podcasts.forEach((podcast, index) => {
        const li = document.createElement('li');
        li.className = 'podcast-item';
        li.dataset.index = index;
        if (index === state.currentIndex) li.classList.add('playing');
        
        const date = podcast.field.broadDate;
        const progressPercent = getProgressPercent(podcast);
        const progress = getProgress(podcast);
        
        // Button state logic
        const isCurrent = index === state.currentIndex;
        const isPlaying = isCurrent && !UI.audioPlayer.paused;
        const btnContent = isPlaying ? ICONS.PAUSE : ICONS.PLAY;
        const btnClass = isPlaying ? 'play-button playing' : 'play-button';

        let progressHTML = '';
        if (progressPercent > 0 && progress) {
            progressHTML = `
                <div class="episode-progress-bar">
                    <div class="episode-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="episode-progress-text">${formatTime(progress.currentTime)} / ${formatTime(progress.duration)}</div>
            `;
        }

        li.innerHTML = `
            <div class="podcast-info">
                <div class="podcast-date">${formatDate(date)}</div>
                ${progressHTML}
            </div>
            <button class="${btnClass}" data-action="play" data-index="${index}" aria-label="${isPlaying ? '일시정지' : '재생'}">
                ${btnContent}
            </button>
        `;
        
        UI.podcastList.appendChild(li);
    });
}

async function playPodcast(index) {
    if (!isValidIndex(index)) {
        console.warn('Invalid podcast index:', index);
        return;
    }
    
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
    updateItemUI(index, true);
    
    // Audio Setup
    const audioUrl = normalizeAudioUrl(podcast.field.audioUrl);
    if (!audioUrl) {
        showError('오디오 URL이 없습니다.');
        updateItemUI(index, false);
        return;
    }
    
    UI.audioPlayer.src = audioUrl;
    
    try {
        // Load saved progress
        const savedProgress = getProgress(podcast);
        if (savedProgress && savedProgress.currentTime > CONFIG.MIN_RESUME_TIME) {
            UI.audioPlayer.currentTime = savedProgress.currentTime;
        }
        
        await UI.audioPlayer.play();
        UI.audioPlayer.playbackRate = state.currentSpeed;
        
        // Show Controls
        showPlayerControls(podcast);
        
    } catch (error) {
        console.error('Play error:', error);
        showError(`재생할 수 없습니다: ${error.message}`);
        updateItemUI(index, false);
    }
}

function showPlayerControls(podcast) {
    UI.playerControls.classList.add('active');
    UI.currentDate.textContent = formatDate(podcast.field.broadDate);
    document.body.style.paddingBottom = `${UI.playerControls.offsetHeight + 20}px`;
}

function normalizeAudioUrl(url) {
    if (!url) return null;
    return url.startsWith('http:') ? url.replace('http:', 'https:') : url;
}

function isValidIndex(index) {
    return index >= 0 && index < state.podcasts.length;
}

async function togglePlayback(index) {
    try {
        if (UI.audioPlayer.paused) {
            await UI.audioPlayer.play();
            updateItemUI(index, true);
        } else {
            UI.audioPlayer.pause();
            updateItemUI(index, false);
        }
    } catch (error) {
        console.error('Toggle playback error:', error);
        showError(`재생 오류: ${error.message}`);
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

function isValidIndex(index) {
    return index >= 0 && index < state.podcasts.length;
}

async function playPrevious() {
    const nextIndex = state.currentIndex + 1;
    if (isValidIndex(nextIndex)) {
        await playPodcast(nextIndex);
    }
}

async function playNext() {
    const nextIndex = state.currentIndex - 1;
    if (isValidIndex(nextIndex)) {
        await playPodcast(nextIndex);
    }
}

// --- Progress Tracking ---

function getProgressKey(podcast) {
    if (!podcast?.field?.broadDate) {
        return null;
    }
    return `progress_${podcast.field.broadDate}`;
}

function saveProgress(podcast, currentTime, duration) {
    const key = getProgressKey(podcast);
    if (!key) return;
    
    try {
        const data = {
            currentTime,
            duration,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Save progress error:', error);
    }
}

function getProgress(podcast) {
    const key = getProgressKey(podcast);
    if (!key) return null;
    
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Get progress error:', error);
        return null;
    }
}

function getProgressPercent(podcast) {
    const progress = getProgress(podcast);
    if (progress && progress.duration > 0) {
        return Math.min(100, (progress.currentTime / progress.duration) * 100);
    }
    return 0;
}

function clearProgress(podcast) {
    const key = getProgressKey(podcast);
    if (!key) return;
    
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Clear progress error:', error);
    }
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

// --- Event Handlers ---

function handlePodcastClick(e) {
    const btn = e.target.closest('.play-button');
    if (btn) {
        const index = parseInt(btn.dataset.index, 10);
        if (!isNaN(index)) {
            playPodcast(index).catch(err => {
                console.error('Play podcast error:', err);
            });
        }
    }
}

function handleAudioTimeUpdate() {
    if (!UI.audioPlayer.duration) return;
    
    const progress = (UI.audioPlayer.currentTime / UI.audioPlayer.duration) * 100;
    UI.progressFill.style.width = `${progress}%`;
    
    UI.timeDisplay.textContent = 
        `${formatTime(UI.audioPlayer.currentTime)} / ${formatTime(UI.audioPlayer.duration)}`;
    
    // Save progress periodically
    const now = Date.now();
    if (isValidIndex(state.currentIndex) && now - state.lastSaveTime > CONFIG.PROGRESS_SAVE_INTERVAL) {
        saveProgress(
            state.podcasts[state.currentIndex],
            UI.audioPlayer.currentTime,
            UI.audioPlayer.duration
        );
        state.lastSaveTime = now;
    }
}

async function handleAudioEnded() {
    try {
        // Clear progress when episode is fully watched
        if (isValidIndex(state.currentIndex)) {
            clearProgress(state.podcasts[state.currentIndex]);
        }
        
        // Auto-play next episode
        const nextIndex = state.currentIndex - 1;
        if (isValidIndex(nextIndex)) {
            await playPodcast(nextIndex);
        } else {
            updateItemUI(state.currentIndex, false);
            UI.podcastList.children[state.currentIndex]?.classList.remove('playing');
        }
        
        // Refresh list to update progress bars
        renderPodcasts();
    } catch (error) {
        console.error('Audio ended error:', error);
    }
}

function handleProgressBarClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedValue = x / rect.width;
    
    if (UI.audioPlayer.duration) {
        UI.audioPlayer.currentTime = clickedValue * UI.audioPlayer.duration;
    }
}

function setupEventListeners() {
    // Podcast List
    UI.podcastList.addEventListener('click', handlePodcastClick);
    
    // Controls
    UI.speedBtn.addEventListener('click', toggleSpeed);
    UI.refreshBtn.addEventListener('click', () => {
        loadPodcasts().catch(err => {
            console.error('Refresh error:', err);
        });
    });
    UI.prevBtn.addEventListener('click', () => {
        playPrevious().catch(err => {
            console.error('Play previous error:', err);
        });
    });
    UI.nextBtn.addEventListener('click', () => {
        playNext().catch(err => {
            console.error('Play next error:', err);
        });
    });
    
    // Audio Player Events
    UI.audioPlayer.addEventListener('timeupdate', handleAudioTimeUpdate);
    UI.audioPlayer.addEventListener('ended', () => {
        handleAudioEnded().catch(err => {
            console.error('Handle audio ended error:', err);
        });
    });
    
    // Progress Bar
    UI.progressBar.addEventListener('click', handleProgressBarClick);
}

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker registered');
        } catch (error) {
            console.warn('Service Worker registration failed:', error);
        }
    }
}

// --- Initialization ---

async function init() {
    try {
        initUI();
        console.log('UI initialized');
        setupEventListeners();
        console.log('Event listeners setup');
        await loadPodcasts();
        await registerServiceWorker();
    } catch (error) {
        console.error('Initialization error:', error);
        if (UI) {
            showError('앱 초기화 중 오류가 발생했습니다.');
        }
    }
}

// Start App
document.addEventListener('DOMContentLoaded', () => {
    init().catch(err => {
        console.error('App start error:', err);
    });
});
