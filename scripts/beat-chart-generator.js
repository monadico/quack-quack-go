class BeatChartGenerator {
    constructor(audioManager) {
        this.audioManager = audioManager;
        this.patterns = this.initializePatterns();
    }

    initializePatterns() {
        // Define rhythm patterns for "Blackest Luxury Car"
        // These patterns are designed for a high-energy electronic track
        return {
            // Basic patterns (used during verses/intro)
            basic: [
                { top: true, bottom: false },   // Top hit
                { top: false, bottom: false },  // Rest
                { top: false, bottom: true },   // Bottom hit
                { top: false, bottom: false },  // Rest
                { top: true, bottom: false },   // Top hit
                { top: false, bottom: true },   // Bottom hit
                { top: false, bottom: false },  // Rest
                { top: false, bottom: true }    // Bottom hit
            ],
            
            // Intense patterns (used during drops/chorus)
            intense: [
                { top: true, bottom: false },
                { top: false, bottom: true },
                { top: true, bottom: false },
                { top: false, bottom: true },
                { top: true, bottom: true },    // Both lanes
                { top: false, bottom: false },
                { top: true, bottom: false },
                { top: false, bottom: true }
            ],
            
            // Complex patterns (used during build-ups)
            complex: [
                { top: true, bottom: false },
                { top: true, bottom: false },   // Double top
                { top: false, bottom: true },
                { top: false, bottom: false },
                { top: false, bottom: true },
                { top: false, bottom: true },   // Double bottom
                { top: true, bottom: true },    // Both
                { top: false, bottom: false }
            ],
            
            // Sparse patterns (used during breakdowns)
            sparse: [
                { top: true, bottom: false },
                { top: false, bottom: false },
                { top: false, bottom: false },
                { top: false, bottom: true },
                { top: false, bottom: false },
                { top: false, bottom: false },
                { top: true, bottom: false },
                { top: false, bottom: false }
            ],
            
            // Buildup pattern (gradually increasing intensity)
            buildup: [
                { top: false, bottom: false },
                { top: true, bottom: false },
                { top: false, bottom: false },
                { top: false, bottom: true },
                { top: false, bottom: false },
                { top: true, bottom: false },
                { top: false, bottom: true },
                { top: true, bottom: true }     // Peak
            ]
        };
    }

    generateChart(durationMs, travelTimeMs = 3000) {
        const chart = [];
        const bpm = this.audioManager.bpm;
        const beatInterval = this.audioManager.beatInterval;
        const totalBeats = Math.floor(durationMs / beatInterval);
        
        console.log(`Generating chart for ${durationMs}ms (${totalBeats} beats) at ${bpm} BPM`);
        
        // Define song structure (approximate timing for electronic music)
        const songStructure = this.defineSongStructure(totalBeats);
        
        let currentBeat = 0;
        let patternIndex = 0;
        
        while (currentBeat < totalBeats) {
            const currentSection = this.getCurrentSection(currentBeat, songStructure);
            const pattern = this.patterns[currentSection.type];
            const currentPattern = pattern[patternIndex % pattern.length];
            
            const hitTime = currentBeat * beatInterval;
            const spawnTime = hitTime - travelTimeMs;
            
            // Only add notes that should spawn after game starts
            if (spawnTime >= 0) {
                if (currentPattern.top || currentPattern.bottom) {
                    chart.push({
                        spawnTime: spawnTime,
                        hitTime: hitTime,
                        topLane: currentPattern.top,
                        bottomLane: currentPattern.bottom,
                        beat: currentBeat,
                        section: currentSection.name,
                        intensity: currentSection.intensity
                    });
                }
            }
            
            currentBeat++;
            patternIndex++;
            
            // Vary pattern changes based on section
            if (currentBeat % (currentSection.patternChangeEvery || 8) === 0) {
                patternIndex = 0; // Reset pattern or could randomize
            }
        }
        
        console.log(`Generated ${chart.length} notes for chart`);
        return chart;
    }

    defineSongStructure(totalBeats) {
        // Define typical structure for an electronic music track
        // This is approximate and can be adjusted based on actual song analysis
        const beatsPerSection = 32; // Common in electronic music (8 bars of 4 beats)
        
        return [
            { name: 'intro', start: 0, end: beatsPerSection, type: 'sparse', intensity: 0.3, patternChangeEvery: 16 },
            { name: 'verse1', start: beatsPerSection, end: beatsPerSection * 2, type: 'basic', intensity: 0.5, patternChangeEvery: 8 },
            { name: 'buildup1', start: beatsPerSection * 2, end: beatsPerSection * 2.5, type: 'buildup', intensity: 0.7, patternChangeEvery: 4 },
            { name: 'drop1', start: beatsPerSection * 2.5, end: beatsPerSection * 4, type: 'intense', intensity: 1.0, patternChangeEvery: 8 },
            { name: 'breakdown1', start: beatsPerSection * 4, end: beatsPerSection * 5, type: 'sparse', intensity: 0.4, patternChangeEvery: 8 },
            { name: 'verse2', start: beatsPerSection * 5, end: beatsPerSection * 6, type: 'basic', intensity: 0.6, patternChangeEvery: 8 },
            { name: 'buildup2', start: beatsPerSection * 6, end: beatsPerSection * 6.5, type: 'buildup', intensity: 0.8, patternChangeEvery: 4 },
            { name: 'drop2', start: beatsPerSection * 6.5, end: beatsPerSection * 8, type: 'complex', intensity: 1.0, patternChangeEvery: 8 },
            { name: 'outro', start: beatsPerSection * 8, end: totalBeats, type: 'sparse', intensity: 0.3, patternChangeEvery: 16 }
        ];
    }

    getCurrentSection(beat, songStructure) {
        for (const section of songStructure) {
            if (beat >= section.start && beat < section.end) {
                return section;
            }
        }
        // Return last section if beyond end
        return songStructure[songStructure.length - 1];
    }

    // Generate dynamic difficulty based on player performance
    generateAdaptiveChart(durationMs, playerAccuracy = 0.8, travelTimeMs = 3000) {
        const baseChart = this.generateChart(durationMs, travelTimeMs);
        
        // Adjust difficulty based on player accuracy
        if (playerAccuracy > 0.9) {
            // Player is doing well, increase difficulty
            return this.increaseDifficulty(baseChart);
        } else if (playerAccuracy < 0.6) {
            // Player is struggling, decrease difficulty
            return this.decreaseDifficulty(baseChart);
        }
        
        return baseChart;
    }

    increaseDifficulty(chart) {
        // Add more simultaneous hits and complex patterns
        return chart.map(note => {
            if (Math.random() < 0.1) { // 10% chance to add simultaneous hit
                return {
                    ...note,
                    topLane: true,
                    bottomLane: true
                };
            }
            return note;
        });
    }

    decreaseDifficulty(chart) {
        // Remove some notes and reduce simultaneous hits
        return chart.filter((note, index) => {
            // Remove every 4th note in complex sections
            if (note.intensity > 0.8 && index % 4 === 3) {
                return false;
            }
            // Convert simultaneous hits to single hits
            if (note.topLane && note.bottomLane) {
                note.bottomLane = false; // Keep only top lane
            }
            return true;
        });
    }

    // Generate chart from actual audio analysis (future enhancement)
    async generateFromAudioAnalysis(audioBuffer) {
        // This would analyze the actual audio file for beat detection
        // and create a chart based on detected beats and frequency content
        // For now, this is a placeholder for future implementation
        console.log('Audio analysis chart generation not yet implemented');
        return this.generateChart(audioBuffer.duration * 1000);
    }

    // Create a preview chart for testing
    generateTestChart(travelTimeMs = 3000) {
        const testDuration = 30000; // 30 seconds
        return this.generateChart(testDuration, travelTimeMs);
    }

    // Validate chart timing
    validateChart(chart) {
        let isValid = true;
        const issues = [];

        for (let i = 0; i < chart.length - 1; i++) {
            const current = chart[i];
            const next = chart[i + 1];
            
            // Check for notes too close together
            if (next.hitTime - current.hitTime < 100) { // Less than 100ms apart
                issues.push(`Notes ${i} and ${i + 1} are too close together`);
                isValid = false;
            }
            
            // Check for negative spawn times
            if (current.spawnTime < 0) {
                issues.push(`Note ${i} has negative spawn time`);
                isValid = false;
            }
        }

        return { isValid, issues };
    }
}