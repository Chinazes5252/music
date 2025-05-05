// app.js (исправленный)
class MusicPlayer {
    constructor() {
        this.userId = null;
        this.player = new Audio();
        this.initWebApp();
        this.initEventListeners();
    }

    initWebApp() {
        if (Telegram.WebApp.initDataUnsafe?.user?.id) {
            this.userId = Telegram.WebApp.initDataUnsafe.user.id;
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
    }

    initEventListeners() {
        document.getElementById('search-btn').addEventListener('click', () => this.search());
        document.getElementById('search-input').addEventListener('keypress', e => {
            if (e.key === 'Enter') this.search();
        });

        document.addEventListener('click', e => {
            const card = e.target.closest('.track-card');
            if (!card) return;

            if (e.target.classList.contains('save-btn')) {
                this.saveTrack(card.dataset.id);
            }
            if (e.target.classList.contains('play-btn')) {
                this.playTrack(card.dataset.id);
            }
        });
    }

    async search() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;
        
        this.showLoader();
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`, {
                headers: {'X-Telegram-Init-Data': Telegram.WebApp.initData}
            });
            
            if (!response.ok) throw new Error(`Ошибка ${response.status}`);
            
            this.displayResults(await response.json());
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoader();
        }
    }

    async playTrack(videoId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/stream?id=${videoId}`, {
                headers: {'X-Telegram-Init-Data': Telegram.WebApp.initData}
            });
            this.player.src = await response.text();
            this.player.play();
        } catch (error) {
            this.showError('Ошибка воспроизведения: ' + error.message);
        }
    }

    displayResults(items) {
        const container = document.getElementById('results');
        container.innerHTML = items.map(item => `
            <div class="track-card" data-id="${item.id}">
                <img src="${item.thumbnail}">
                <div class="track-info">
                    <h3>${item.title}</h3>
                    <p>${item.channel}</p>
                    <button class="play-btn">▶ Play</button>
                    <button class="save-btn">💾 Save</button>
                </div>
            </div>
        `).join('');
    }

    async saveTrack(trackId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-Init-Data': Telegram.WebApp.initData
                },
                body: JSON.stringify({
                    user_id: this.userId,
                    track_id: trackId
                })
            });
            
            const result = await response.json();
            result.status === 'saved' 
                ? this.showNotification('✅ Трек сохранен!') 
                : this.showNotification('⚠️ Уже в библиотеке');
        } catch (error) {
            this.showError('❌ Ошибка сохранения: ' + error.message);
        }
    }

    showNotification(msg) {
        Telegram.WebApp.showAlert(msg);
    }

    showError(msg) {
        const el = document.createElement('div');
        el.className = 'error-message';
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    showLoader() {
        document.body.classList.add('loading');
    }

    hideLoader() {
        document.body.classList.remove('loading');
    }
}

window.player = new MusicPlayer();