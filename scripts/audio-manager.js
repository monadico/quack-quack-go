class AudioManager {
    constructor() {
        this.audioContext = null;
        this.musicAudio = null;
        this.analyser = null;
        this.dataArray = null;
        this.isPlaying = false;
        this.startTime = 0;
        this.pausedTime = 0;
        this.currentTime = 0;
        this.bpm = 140; // Default BPM, will be detected or set
        this.beatInterval = (60 / this.bpm) * 1000; // milliseconds per beat
        this.lastBeatTime = 0;
        this.beatCallback = null;
        this.volume = {
            master: 1.0,
            music: 0.8,
            sfx: 1.0
        };
        this.gainNode = null;
        this.songUrl = null;
        
        this.initAudioContext();
    }

    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context initialized');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }

    async loadSong(songUrl) {
        try {
            this.songUrl = songUrl;
            console.log('Loading song:', songUrl);
            
            // Create audio element
            this.musicAudio = new Audio(songUrl);
            this.musicAudio.crossOrigin = 'anonymous';
            this.musicAudio.preload = 'auto';
            
            // Set up audio nodes for analysis
            if (this.audioContext) {
                const source = this.audioContext.createMediaElementSource(this.musicAudio);
                this.analyser = this.audioContext.createAnalyser();
                this.gainNode = this.audioContext.createGain();
                
                // Configure analyser for beat detection
                this.analyser.fftSize = 1024;
                this.analyser.smoothingTimeConstant = 0.8;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                
                // Connect audio graph: source -> gain -> analyser -> destination
                source.connect(this.gainNode);
                this.gainNode.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                // Set initial volume
                this.updateVolume();
            }

            // Wait for song to load
            return new Promise((resolve, reject) => {
                this.musicAudio.addEventListener('canplaythrough', () => {
                    console.log('Song loaded successfully');
                    console.log('Duration:', this.musicAudio.duration, 'seconds');
                    this.detectBPM();
                    resolve();
                });
                
                this.musicAudio.addEventListener('error', (e) => {
                    console.error('Failed to load song:', e);
                    reject(e);
                });
            });
            
        } catch (error) {
            console.error('Error loading song:', error);
            throw error;
        }
    }

    detectBPM() {
        // For now, we'll use a default BPM for "Blackest Luxury Car"
        // This is a typical rhythm game track, usually around 140-180 BPM
        this.bpm = 145; // Estimated BPM for this track
        this.beatInterval = (60 / this.bpm) * 1000;
        console.log('BPM set to:', this.bpm, 'Beat interval:', this.beatInterval, 'ms');
    }

    async play() {
        try {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            if (this.musicAudio) {
                this.musicAudio.currentTime = this.pausedTime / 1000;
                await this.musicAudio.play();
                this.startTime = performance.now() - this.pausedTime;
                this.isPlaying = true;
                this.startBeatDetection();
                console.log('Music started playing');
            }
        } catch (error) {
            console.error('Failed to play music:', error);
        }
    }

    pause() {
        if (this.musicAudio && this.isPlaying) {
            this.musicAudio.pause();
            this.pausedTime = performance.now() - this.startTime;
            this.isPlaying = false;
            console.log('Music paused');
        }
    }

    stop() {
        if (this.musicAudio) {
            this.musicAudio.pause();
            this.musicAudio.currentTime = 0;
            this.pausedTime = 0;
            this.isPlaying = false;
            this.lastBeatTime = 0;
            console.log('Music stopped');
        }
    }

    getCurrentTime() {
        if (this.isPlaying) {
            return performance.now() - this.startTime;
        }
        return this.pausedTime;
    }

    getDuration() {
        return this.musicAudio ? this.musicAudio.duration * 1000 : 0;
    }

    getProgress() {
        const currentTime = this.getCurrentTime();
        const duration = this.getDuration();
        return duration > 0 ? (currentTime / duration) * 100 : 0;
    }

    startBeatDetection() {
        if (!this.isPlaying) return;

        const detectBeats = () => {
            if (!this.isPlaying) return;

            const currentTime = this.getCurrentTime();
            
            // Simple beat detection based on BPM timing
            const timeSinceLastBeat = currentTime - this.lastBeatTime;
            
            if (timeSinceLastBeat >= this.beatInterval * 0.95) { // Allow slight timing variation
                this.onBeat(currentTime);
                this.lastBeatTime = currentTime;
            }

            // Also do frequency analysis for more accurate beat detection
            if (this.analyser && this.dataArray) {
                this.analyser.getByteFrequencyData(this.dataArray);
                
                // Analyze low frequency range for kick drums (beat detection)
                const bassRange = this.dataArray.slice(0, 32);
                const bassAverage = bassRange.reduce((sum, value) => sum + value, 0) / bassRange.length;
                
                // Simple beat detection based on bass energy spikes
                if (bassAverage > 180 && timeSinceLastBeat > this.beatInterval * 0.8) {
                    // Strong bass detected, might be a beat
                    console.log('Bass spike detected:', bassAverage);
                }
            }

            requestAnimationFrame(detectBeats);
        };

        detectBeats();
    }

    onBeat(currentTime) {
        console.log('Beat detected at:', currentTime);
        if (this.beatCallback) {
            this.beatCallback(currentTime);
        }
    }

    setBeatCallback(callback) {
        this.beatCallback = callback;
    }

    updateVolume() {
        if (this.gainNode) {
            const finalVolume = this.volume.master * this.volume.music;
            this.gainNode.gain.value = finalVolume;
        }
        if (this.musicAudio) {
            this.musicAudio.volume = this.volume.master * this.volume.music;
        }
    }

    setMasterVolume(volume) {
        this.volume.master = Math.max(0, Math.min(1, volume));
        this.updateVolume();
    }

    setMusicVolume(volume) {
        this.volume.music = Math.max(0, Math.min(1, volume));
        this.updateVolume();
    }

    setSFXVolume(volume) {
        this.volume.sfx = Math.max(0, Math.min(1, volume));
    }

    // Get timing information for note spawning
    getTimingInfo() {
        return {
            currentTime: this.getCurrentTime(),
            bpm: this.bpm,
            beatInterval: this.beatInterval,
            nextBeatTime: this.lastBeatTime + this.beatInterval,
            isPlaying: this.isPlaying
        };
    }

    // Calculate when a note should spawn based on when it should be hit
    calculateSpawnTime(hitTime, travelTimeMs = 3000) {
        return hitTime - travelTimeMs;
    }

    // Get the beat number at a given time
    getBeatAtTime(timeMs) {
        return Math.floor(timeMs / this.beatInterval);
    }

    // Get the time of a specific beat
    getTimeAtBeat(beatNumber) {
        return beatNumber * this.beatInterval;
    }

    // Check if we're currently on a beat (within timing window)
    isOnBeat(currentTime = null, windowMs = 100) {
        const time = currentTime || this.getCurrentTime();
        const timeSinceLastBeat = time - this.lastBeatTime;
        const timeToNextBeat = this.beatInterval - timeSinceLastBeat;
        
        return Math.min(timeSinceLastBeat, timeToNextBeat) <= windowMs;
    }
}