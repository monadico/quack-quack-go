class BMSTimingEngine {
    constructor(chartData) {
        this.chartData = chartData;
        this.bpm = chartData.metadata.bpm;
        this.subdivision = chartData.metadata.subdivision;
        this.beatsPerMeasure = chartData.metadata.beatsPerMeasure;
        this.offset = chartData.metadata.offset;
        this.secondsPerBeat = 60 / this.bpm;
        
        console.log(`BMS Engine initialized: ${this.bpm} BPM, ${this.subdivision} subdivisions, ${this.beatsPerMeasure} beats per measure`);
    }
    
    // Convert chart data to game-compatible format
    convertToGameFormat(difficulty = 'easy') {
        const chart = this.chartData.charts[difficulty];
        if (!chart) {
            throw new Error(`Difficulty '${difficulty}' not found in chart data`);
        }
        
        const notes = [];
        
        chart.measures.forEach((measure, measureIndex) => {
            // Process top lane
            this.processLane(measure.topLane, measureIndex, 'top', notes);
            // Process bottom lane
            this.processLane(measure.bottomLane, measureIndex, 'bottom', notes);
        });
        
        // Sort notes by time
        notes.sort((a, b) => a.hitTime - b.hitTime);
        
        console.log(`Converted ${notes.length} notes from BMS format`);
        return notes;
    }
    
    processLane(lanePattern, measureIndex, laneName, notes) {
        if (!lanePattern || lanePattern.length !== this.subdivision) {
            console.warn(`Invalid pattern length for measure ${measureIndex}, lane ${laneName}: expected ${this.subdivision}, got ${lanePattern ? lanePattern.length : 0}`);
            return;
        }
        
        for (let i = 0; i < lanePattern.length; i++) {
            if (lanePattern[i] === '1') {
                // Calculate exact time for this note
                const beatPosition = (i / this.subdivision) * this.beatsPerMeasure;
                const absoluteBeat = (measureIndex * this.beatsPerMeasure) + beatPosition;
                const timeInSeconds = (absoluteBeat * this.secondsPerBeat) + this.offset;
                const timeInMs = timeInSeconds * 1000;
                
                notes.push({
                    hitTime: timeInMs,
                    spawnTime: timeInMs - 3000, // 3 second travel time
                    lane: laneName,
                    type: 'single',
                    measureIndex: measureIndex,
                    beatPosition: beatPosition,
                    subdivisionIndex: i,
                    topLane: laneName === 'top',
                    bottomLane: laneName === 'bottom'
                });
                
                console.log(`Note created: ${laneName} lane, measure ${measureIndex}, subdivision ${i}, time ${timeInMs}ms`);
            }
        }
    }
    
    // Calculate exact time for a note at given position
    calculateNoteTime(measureIndex, subdivisionIndex) {
        const beatPosition = (subdivisionIndex / this.subdivision) * this.beatsPerMeasure;
        const absoluteBeat = (measureIndex * this.beatsPerMeasure) + beatPosition;
        const timeInSeconds = (absoluteBeat * this.secondsPerBeat) + this.offset;
        return timeInSeconds * 1000; // Return in milliseconds
    }
    
    // Get measure duration in milliseconds
    getMeasureDuration() {
        return (this.beatsPerMeasure * this.secondsPerBeat) * 1000;
    }
    
    // Get subdivision duration in milliseconds
    getSubdivisionDuration() {
        return this.getMeasureDuration() / this.subdivision;
    }
    
    // Validate chart pattern
    validatePattern(pattern, patternName = 'unknown') {
        if (!pattern) {
            throw new Error(`Pattern '${patternName}' is null or undefined`);
        }
        
        if (pattern.length !== this.subdivision) {
            throw new Error(`Pattern '${patternName}' length ${pattern.length} doesn't match subdivision ${this.subdivision}`);
        }
        
        const validChars = ['0', '1'];
        for (let i = 0; i < pattern.length; i++) {
            if (!validChars.includes(pattern[i])) {
                throw new Error(`Invalid character '${pattern[i]}' at position ${i} in pattern '${patternName}'`);
            }
        }
        
        return true;
    }
    
    // Validate entire chart
    validateChart(difficulty = 'easy') {
        const chart = this.chartData.charts[difficulty];
        if (!chart) {
            throw new Error(`Difficulty '${difficulty}' not found`);
        }
        
        const issues = [];
        
        chart.measures.forEach((measure, index) => {
            try {
                this.validatePattern(measure.topLane, `measure ${index} top lane`);
            } catch (e) {
                issues.push(e.message);
            }
            
            try {
                this.validatePattern(measure.bottomLane, `measure ${index} bottom lane`);
            } catch (e) {
                issues.push(e.message);
            }
        });
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }
    
    // Get timing information for debugging
    getTimingInfo() {
        return {
            bpm: this.bpm,
            subdivision: this.subdivision,
            beatsPerMeasure: this.beatsPerMeasure,
            offset: this.offset,
            secondsPerBeat: this.secondsPerBeat,
            measureDuration: this.getMeasureDuration(),
            subdivisionDuration: this.getSubdivisionDuration()
        };
    }
    
    // Generate pattern visualization for debugging
    visualizePattern(pattern, patternName = '') {
        if (!pattern) return '';
        
        let visualization = `${patternName}\n`;
        visualization += '|';
        
        for (let i = 0; i < pattern.length; i++) {
            visualization += pattern[i] === '1' ? '●' : '-';
            
            // Add measure separators every beat
            if ((i + 1) % (this.subdivision / this.beatsPerMeasure) === 0 && i < pattern.length - 1) {
                visualization += '|';
            }
        }
        
        visualization += '|\n';
        return visualization;
    }
    
    // Create a test chart for development
    static createTestChart() {
        return {
            metadata: {
                title: "BMS Test Chart",
                artist: "Dev Team",
                bpm: 120,
                subdivision: 16,
                beatsPerMeasure: 4,
                offset: 0.0,
                previewStart: 0.0
            },
            audio: {
                music: './%5BMuse%20Dash%E2%A7%B8Cytus%20II%E2%A7%B8BOFU2017%5D%20Blackest%20Luxury%20Car%20-%20Chicala%20Lpis%20%E3%80%90%E9%9F%B3%E6%BA%90%E3%80%91%20%E3%80%90%E9%AB%98%E9%9F%B3%E8%B3%AA%E3%80%91.mp3'
            },
            charts: {
                easy: {
                    level: 3,
                    measures: [
                        {
                            topLane:    "1000100010001000", // Quarter notes on beats 1,2,3,4
                            bottomLane: "0010001000100010", // Off-beats
                            effects:    "0000000000000000"
                        },
                        {
                            topLane:    "1010000010100000", // Eighth notes then rest
                            bottomLane: "0000101000001010", // Syncopated pattern
                            effects:    "0000000000000000"
                        },
                        {
                            topLane:    "1000100010001000", // Back to quarter notes
                            bottomLane: "0100010001000100", // Different off-beat pattern
                            effects:    "0000000000000000"
                        },
                        {
                            topLane:    "1111000011110000", // Dense then sparse
                            bottomLane: "0000111100001111", // Opposite pattern
                            effects:    "0000000000000000"
                        }
                    ]
                },
                hard: {
                    level: 7,
                    measures: [
                        {
                            topLane:    "1010101010101010", // Eighth notes
                            bottomLane: "0101010101010101", // Alternating eighth notes
                            effects:    "0000000000000000"
                        },
                        {
                            topLane:    "1100110011001100", // Complex pattern
                            bottomLane: "0011001100110011", // Mirror pattern
                            effects:    "0000000000000000"
                        },
                        {
                            topLane:    "1111101011111010", // Very dense
                            bottomLane: "0101011101010111", // Complex syncopation
                            effects:    "0000000000000000"
                        },
                        {
                            topLane:    "1000100010001000", // Breather measure
                            bottomLane: "0010001000100010", // Simple pattern
                            effects:    "0000000000000000"
                        }
                    ]
                }
            }
        };
    }
}