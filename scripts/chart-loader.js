class ChartLoader {
    constructor() {
        this.keyMapping = {
            'space': 'bottom',
            'a': 'top',
            'w': 'top',
            's': 'bottom',
            'e': 'top',
            'r': 'top'
        };
        this.currentChart = null;
        this.audio = null;
    }
    
    async loadChart(songPath) {
        try {
            console.log('Loading chart from:', songPath);
            
            // Load JSON chart
            const response = await fetch(songPath);
            if (!response.ok) {
                throw new Error(`Failed to load chart: ${response.statusText}`);
            }
            
            const chartData = await response.json();
            console.log('Chart loaded:', chartData);
            
            // Process the chart data
            this.currentChart = this.processChart(chartData);
            
            // Load audio file
            if (chartData.audio_file) {
                const basePath = songPath.substring(0, songPath.lastIndexOf('/') + 1);
                const audioPath = basePath + chartData.audio_file;
                await this.loadAudio(audioPath);
            }
            
            return this.currentChart;
        } catch (error) {
            console.error('Error loading chart:', error);
            throw error;
        }
    }
    
    processChart(chartData) {
        const processedChart = {
            metadata: {
                title: chartData.audio_file?.replace('.mp3', '') || 'Unknown Song',
                duration: chartData.duration * 1000, // Convert to milliseconds
                recordedAt: chartData.recorded_at
            },
            notes: []
        };

        // Group note events by start/end pairs
        const noteMap = new Map();
        const processedNotes = [];

        chartData.note_events.forEach((event, index) => {
            const lane = this.mapKeyToLane(event.key);
            const timestamp = event.timestamp * 1000; // Convert to milliseconds

            if (event.type === 'quickPress') {
                // Single tap note
                processedNotes.push({
                    id: `note_${index}`,
                    type: 'normal',
                    lane: lane,
                    timestamp: timestamp,
                    spawnTime: Math.max(0, timestamp - 3000), // 3 second travel time
                    duration: 0
                });
            } else if (event.type === 'noteStart') {
                // Start of hold note - store for pairing
                noteMap.set(`${event.key}_${timestamp}`, {
                    id: `note_${index}`,
                    type: 'hold',
                    lane: lane,
                    timestamp: timestamp,
                    spawnTime: Math.max(0, timestamp - 3000), // 3 second travel time
                    key: event.key
                });
            } else if (event.type === 'noteEnd') {
                // End of hold note - find matching start
                const startKey = `${event.key}_${(timestamp - event.duration * 1000)}`;
                const startNote = noteMap.get(startKey);
                
                if (startNote) {
                    startNote.duration = event.duration * 1000; // Convert to milliseconds
                    processedNotes.push(startNote);
                    noteMap.delete(startKey);
                } else {
                    console.warn('Could not find matching noteStart for noteEnd:', event);
                }
            }
        });

        // Sort notes by spawn time
        processedChart.notes = processedNotes.sort((a, b) => a.spawnTime - b.spawnTime);
        
        console.log(`Processed ${processedChart.notes.length} notes`);
        return processedChart;
    }
    
    mapKeyToLane(key) {
        // Map various keys to top/bottom lanes
        // Can be expanded for more lanes in the future
        switch(key.toLowerCase()) {
            case 'space':
                return 'bottom';
            case 'a':
            case 'w':
            case 'e':
            case 'r':
                return 'top';
            case 's':
                return 'bottom';
            default:
                return 'top'; // Default fallback
        }
    }
    
    async loadAudio(audioPath) {
        try {
            console.log('Loading audio from:', audioPath);
            
            this.audio = new Audio(audioPath);
            
            return new Promise((resolve, reject) => {
                this.audio.addEventListener('canplaythrough', () => {
                    console.log('Audio loaded successfully');
                    resolve(this.audio);
                });
                
                this.audio.addEventListener('error', (e) => {
                    console.error('Audio loading error:', e);
                    reject(new Error('Failed to load audio'));
                });
                
                // Start loading
                this.audio.load();
            });
        } catch (error) {
            console.error('Error loading audio:', error);
            throw error;
        }
    }
    
    playAudio() {
        if (this.audio) {
            this.audio.currentTime = 0;
            return this.audio.play();
        }
        return Promise.reject(new Error('No audio loaded'));
    }

    stopAudio() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
    }

    getAudioTime() {
        return this.audio ? this.audio.currentTime * 1000 : 0; // Return in milliseconds
    }

    getCurrentChart() {
        return this.currentChart;
    }

    getAudio() {
        return this.audio;
    }
    
    
}