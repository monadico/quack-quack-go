class GameStateManager {
    constructor() {
        this.currentState = 'menu';
        this.gameEngine = null;
        this.uiManager = null;
        this.scores = {
            current: 0,
            high: localStorage.getItem('highScore') || 0,
            combo: 0,
            maxCombo: 0
        };
        this.stats = {
            perfect: 0,
            great: 0,
            good: 0,
            miss: 0,
            hold: 0
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.uiManager = new UIManager(this);
        this.gameEngine = new GameEngine(this);
        this.setState('menu');
        this.updateHighScore();
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.setState('settings');
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            this.setState('menu');
        });

        document.getElementById('back-from-settings-btn').addEventListener('click', () => {
            this.setState('menu');
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseGame();
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyInput(e);
        });

        document.addEventListener('keyup', (e) => {
            this.handleKeyInput(e);
        });

        this.setupMobileControls();
    }

    setupMobileControls() {
        const topLane = document.getElementById('top-lane');
        const bottomLane = document.getElementById('bottom-lane');

        if (topLane && bottomLane) {
            topLane.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.currentState === 'game') {
                    this.gameEngine.handleInput('top', 'press');
                }
            });

            topLane.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.currentState === 'game') {
                    this.gameEngine.handleInput('top', 'release');
                }
            });

            bottomLane.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.currentState === 'game') {
                    this.gameEngine.handleInput('bottom', 'press');
                }
            });

            bottomLane.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.currentState === 'game') {
                    this.gameEngine.handleInput('bottom', 'release');
                }
            });
        }
    }

    handleKeyInput(e) {
        if (this.currentState !== 'game') return;

        const key = e.key.toLowerCase();
        const action = e.type === 'keydown' ? 'press' : 'release';
        
        switch (key) {
            case 'd':
            case 'f':
                this.gameEngine.handleInput('top', action);
                break;
            case 'j':
            case 'k':
                this.gameEngine.handleInput('bottom', action);
                break;
            case 'escape':
                if (action === 'press') {
                    this.pauseGame();
                }
                break;
        }
    }

    setState(newState) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(`${newState}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentState = newState;
        }

        if (newState === 'menu') {
            this.resetGame();
        }
    }

    async startGame() {
        this.resetGame();
        this.setState('game');
        try {
            await this.gameEngine.startGame();
        } catch (error) {
            console.error('Failed to start game:', error);
            this.setState('menu');
        }
    }

    pauseGame() {
        if (this.currentState === 'game') {
            this.gameEngine.pauseGame();
        }
    }

    endGame() {
        this.setState('game-over');
        this.updateFinalStats();
        this.checkHighScore();
    }

    resetGame() {
        this.scores.current = 0;
        this.scores.combo = 0;
        this.scores.maxCombo = 0;
        this.stats = { perfect: 0, great: 0, good: 0, miss: 0, hold: 0 };
        this.uiManager.updateScore(0);
        this.uiManager.updateCombo(0);
        this.uiManager.updateProgress(0);
    }

    updateScore(points, judgment) {
        this.scores.current += points;
        this.stats[judgment]++;
        
        if (judgment !== 'miss') {
            this.scores.combo++;
            this.scores.maxCombo = Math.max(this.scores.maxCombo, this.scores.combo);
        } else {
            this.scores.combo = 0;
        }

        this.uiManager.updateScore(this.scores.current);
        this.uiManager.updateCombo(this.scores.combo);
        this.uiManager.showJudgment(judgment);
    }

    updateProgress(percentage) {
        this.uiManager.updateProgress(percentage);
    }

    updateFinalStats() {
        document.getElementById('final-score').textContent = this.scores.current;
        document.getElementById('perfect-count').textContent = this.stats.perfect;
        document.getElementById('great-count').textContent = this.stats.great;
        document.getElementById('good-count').textContent = this.stats.good;
        document.getElementById('miss-count').textContent = this.stats.miss;
        document.getElementById('max-combo').textContent = this.scores.maxCombo;

        const grade = this.calculateGrade();
        document.getElementById('grade').textContent = grade;
    }

    calculateGrade() {
        const total = this.stats.perfect + this.stats.great + this.stats.good + this.stats.miss;
        if (total === 0) return 'D';

        const accuracy = (this.stats.perfect + this.stats.great * 0.8 + this.stats.good * 0.5) / total;
        
        if (accuracy >= 0.95) return 'S';
        if (accuracy >= 0.90) return 'A';
        if (accuracy >= 0.80) return 'B';
        if (accuracy >= 0.70) return 'C';
        return 'D';
    }

    checkHighScore() {
        if (this.scores.current > this.scores.high) {
            this.scores.high = this.scores.current;
            localStorage.setItem('highScore', this.scores.high);
            this.updateHighScore();
        }
    }

    updateHighScore() {
        document.getElementById('high-score-value').textContent = this.scores.high;
    }
}

let gameStateManager;

document.addEventListener('DOMContentLoaded', () => {
    gameStateManager = new GameStateManager();
});