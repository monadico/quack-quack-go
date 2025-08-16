class ChartLoader {
    constructor() {
        this.loadedCharts = new Map();
        this.currentChart = null;
        this.currentDifficulty = 'easy';
    }
    
    // Load chart from JSON file
    async loadChartFromFile(chartPath) {
        try {
            console.log('Loading chart from:', chartPath);
            
            const response = await fetch(chartPath);
            if (!response.ok) {
                throw new Error(`Failed to load chart: ${response.status} ${response.statusText}`);
            }
            
            const chartData = await response.json();
            return this.processChartData(chartData);
            
        } catch (error) {
            console.error('Error loading chart:', error);
            throw error;
        }
    }
    
    // Load chart from data object
    loadChartFromData(chartData) {
        return this.processChartData(chartData);
    }
    
    // Process and validate chart data
    processChartData(chartData) {
        // Validate required metadata
        if (!chartData.metadata) {
            throw new Error('Chart missing metadata section');
        }
        
        const required = ['title', 'artist', 'bpm', 'subdivision', 'beatsPerMeasure'];
        for (const field of required) {
            if (chartData.metadata[field] === undefined) {
                throw new Error(`Chart metadata missing required field: ${field}`);
            }
        }
        
        // Set defaults for optional fields
        chartData.metadata.offset = chartData.metadata.offset || 0.0;
        chartData.metadata.previewStart = chartData.metadata.previewStart || 0.0;
        
        // Validate charts section
        if (!chartData.charts || Object.keys(chartData.charts).length === 0) {
            throw new Error('Chart missing charts section or no difficulties defined');
        }
        
        // Validate each difficulty
        for (const [difficulty, chart] of Object.entries(chartData.charts)) {
            this.validateChartDifficulty(chart, difficulty, chartData.metadata);
        }
        
        console.log(`Chart loaded successfully: "${chartData.metadata.title}" by ${chartData.metadata.artist}`);
        console.log(`Difficulties available: ${Object.keys(chartData.charts).join(', ')}`);
        
        return chartData;
    }
    
    // Validate a specific difficulty chart
    validateChartDifficulty(chart, difficultyName, metadata) {
        if (!chart.measures || !Array.isArray(chart.measures)) {
            throw new Error(`Difficulty '${difficultyName}' missing measures array`);
        }
        
        if (chart.measures.length === 0) {
            throw new Error(`Difficulty '${difficultyName}' has no measures`);
        }
        
        // Validate each measure
        chart.measures.forEach((measure, index) => {
            if (!measure.topLane || !measure.bottomLane) {
                throw new Error(`Measure ${index} in difficulty '${difficultyName}' missing lane data`);
            }
            
            // Check pattern lengths
            if (measure.topLane.length !== metadata.subdivision) {
                throw new Error(`Measure ${index} top lane pattern length (${measure.topLane.length}) doesn't match subdivision (${metadata.subdivision})`);
            }
            
            if (measure.bottomLane.length !== metadata.subdivision) {
                throw new Error(`Measure ${index} bottom lane pattern length (${measure.bottomLane.length}) doesn't match subdivision (${metadata.subdivision})`);
            }
            
            // Validate pattern characters
            const validChars = /^[01]*$/;
            if (!validChars.test(measure.topLane)) {
                throw new Error(`Measure ${index} top lane contains invalid characters (only 0 and 1 allowed)`);
            }
            
            if (!validChars.test(measure.bottomLane)) {
                throw new Error(`Measure ${index} bottom lane contains invalid characters (only 0 and 1 allowed)`);
            }
        });
        
        console.log(`Difficulty '${difficultyName}' validated: ${chart.measures.length} measures`);
    }
    
    // Create chart from pattern templates
    createChartFromPatterns(metadata, patterns) {
        const chartData = {
            metadata: metadata,
            audio: {
                music: metadata.audioPath || ''
            },
            charts: {}
        };
        
        for (const [difficulty, patternSet] of Object.entries(patterns)) {
            chartData.charts[difficulty] = {
                level: patternSet.level || 1,
                measures: patternSet.measures
            };
        }
        
        return this.processChartData(chartData);
    }
    
    // Generate chart with pattern helpers
    generateChart(metadata, difficulty, measureCount, patternType = 'basic') {
        const patterns = this.getPatternTemplates(metadata.subdivision);
        const selectedPattern = patterns[patternType] || patterns.basic;
        
        const measures = [];
        for (let i = 0; i < measureCount; i++) {
            // Cycle through pattern variations
            const patternIndex = i % selectedPattern.length;
            measures.push({
                topLane: selectedPattern[patternIndex].topLane,
                bottomLane: selectedPattern[patternIndex].bottomLane,
                effects: "0".repeat(metadata.subdivision)
            });
        }
        
        return this.createChartFromPatterns(metadata, {
            [difficulty]: {
                level: this.getDifficultyLevel(difficulty),
                measures: measures
            }
        });
    }
    
    // Get pattern templates for different subdivision levels
    getPatternTemplates(subdivision) {
        const templates = {
            basic: [],
            intermediate: [],
            advanced: [],
            expert: []
        };
        
        if (subdivision === 16) {
            // 16th note patterns
            templates.basic = [
                {
                    topLane:    "1000100010001000", // Quarter notes
                    bottomLane: "0010001000100010"  // Off-beats
                },
                {
                    topLane:    "1000000010000000", // Half notes
                    bottomLane: "0000100000001000"  // Sparse
                }
            ];
            
            templates.intermediate = [
                {
                    topLane:    "1010000010100000", // Eighth note pairs
                    bottomLane: "0000101000001010"  // Syncopated
                },
                {
                    topLane:    "1001001010010010", // Complex rhythm
                    bottomLane: "0100100001001001"  // Mirror
                }
            ];
            
            templates.advanced = [
                {
                    topLane:    "1010101010101010", // Eighth notes
                    bottomLane: "0101010101010101"  // Alternating
                },
                {
                    topLane:    "1100110011001100", // Grouped patterns
                    bottomLane: "0011001100110011"  // Inverse
                }
            ];
            
            templates.expert = [
                {
                    topLane:    "1111101011111010", // Dense patterns
                    bottomLane: "0101011101010111"  // Complex
                },
                {
                    topLane:    "1011010110110101", // Intricate rhythms
                    bottomLane: "0100101001001010"  // Challenging
                }
            ];
        } else if (subdivision === 8) {
            // 8th note patterns (simpler)
            templates.basic = [
                {
                    topLane:    "10001000", // Quarter notes
                    bottomLane: "01000100"  // Off-beats
                }
            ];
            
            templates.intermediate = [
                {
                    topLane:    "10101010", // Eighth notes
                    bottomLane: "01010101"  // Alternating
                }
            ];
        }
        
        return templates;
    }
    
    // Get difficulty level number
    getDifficultyLevel(difficulty) {
        const levels = {
            easy: 3,
            normal: 5,
            hard: 7,
            expert: 9
        };
        return levels[difficulty] || 1;
    }
    
    // Get chart info without loading full data
    async getChartInfo(chartPath) {
        try {
            const response = await fetch(chartPath);
            const chartData = await response.json();
            
            return {
                title: chartData.metadata.title,
                artist: chartData.metadata.artist,
                bpm: chartData.metadata.bpm,
                difficulties: Object.keys(chartData.charts),
                duration: this.estimateDuration(chartData),
                level: chartData.charts.easy?.level || 1
            };
        } catch (error) {
            console.error('Error getting chart info:', error);
            return null;
        }
    }
    
    // Estimate song duration from chart data
    estimateDuration(chartData) {
        const longestChart = Object.values(chartData.charts).reduce((longest, chart) => 
            chart.measures.length > longest.measures.length ? chart : longest
        );
        
        const measureCount = longestChart.measures.length;
        const beatsPerMeasure = chartData.metadata.beatsPerMeasure;
        const bpm = chartData.metadata.bpm;
        
        const totalBeats = measureCount * beatsPerMeasure;
        const durationSeconds = (totalBeats / bpm) * 60;
        
        return durationSeconds;
    }
    
    // Create a chart for "Blackest Luxury Car"
    static createBlackestLuxuryCarChart() {
        return {
            metadata: {
                title: "Blackest Luxury Car",
                artist: "Chicala Lpis",
                bpm: 145,
                subdivision: 16,
                beatsPerMeasure: 4,
                offset: 0.05, // Fine-tune sync
                previewStart: 30.0
            },
            audio: {
                music: './%5BMuse%20Dash%E2%A7%B8Cytus%20II%E2%A7%B8BOFU2017%5D%20Blackest%20Luxury%20Car%20-%20Chicala%20Lpis%20%E3%80%90%E9%9F%B3%E6%BA%90%E3%80%91%20%E3%80%90%E9%AB%98%E9%9F%B3%E8%B3%AA%E3%80%91.mp3'
            },
            charts: {
                easy: {
                    level: 4,
                    measures: [
                        // Intro (4 measures)
                        { topLane: "1000000010000000", bottomLane: "0000100000001000", effects: "0000000000000000" },
                        { topLane: "1000000010000000", bottomLane: "0000100000001000", effects: "0000000000000000" },
                        { topLane: "1000100010001000", bottomLane: "0010001000100010", effects: "0000000000000000" },
                        { topLane: "1000100010001000", bottomLane: "0010001000100010", effects: "0000000000000000" },
                        
                        // Verse 1 (8 measures)
                        { topLane: "1000100010001000", bottomLane: "0010001000100010", effects: "0000000000000000" },
                        { topLane: "1010000010100000", bottomLane: "0000101000001010", effects: "0000000000000000" },
                        { topLane: "1000100010001000", bottomLane: "0010001000100010", effects: "0000000000000000" },
                        { topLane: "1000000010000000", bottomLane: "0100010001000100", effects: "0000000000000000" },
                        { topLane: "1000100010001000", bottomLane: "0010001000100010", effects: "0000000000000000" },
                        { topLane: "1010000010100000", bottomLane: "0000101000001010", effects: "0000000000000000" },
                        { topLane: "1000100010001000", bottomLane: "0010001000100010", effects: "0000000000000000" },
                        { topLane: "1010101000000000", bottomLane: "0000000010101010", effects: "0000000000000000" },
                        
                        // Build-up (4 measures)
                        { topLane: "1010101010101010", bottomLane: "0000000000000000", effects: "0000000000000000" },
                        { topLane: "0000000000000000", bottomLane: "1010101010101010", effects: "0000000000000000" },
                        { topLane: "1100110011001100", bottomLane: "0011001100110011", effects: "0000000000000000" },
                        { topLane: "1111111111111111", bottomLane: "0000000000000000", effects: "0000000000000000" },
                        
                        // Drop (8 measures)
                        { topLane: "1010101010101010", bottomLane: "0101010101010101", effects: "0000000000000000" },
                        { topLane: "1100110011001100", bottomLane: "0011001100110011", effects: "0000000000000000" },
                        { topLane: "1010101010101010", bottomLane: "0101010101010101", effects: "0000000000000000" },
                        { topLane: "1111000011110000", bottomLane: "0000111100001111", effects: "0000000000000000" },
                        { topLane: "1010101010101010", bottomLane: "0101010101010101", effects: "0000000000000000" },
                        { topLane: "1100110011001100", bottomLane: "0011001100110011", effects: "0000000000000000" },
                        { topLane: "1010101010101010", bottomLane: "0101010101010101", effects: "0000000000000000" },
                        { topLane: "1000100010001000", bottomLane: "0010001000100010", effects: "0000000000000000" }
                    ]
                },
                hard: {
                    level: 8,
                    measures: [
                        // Intro - More complex from start
                        { topLane: "1010000010100000", bottomLane: "0000101000001010", effects: "0000000000000000" },
                        { topLane: "1010000010100000", bottomLane: "0000101000001010", effects: "0000000000000000" },
                        { topLane: "1100110011001100", bottomLane: "0011001100110011", effects: "0000000000000000" },
                        { topLane: "1111101011111010", bottomLane: "0101011101010111", effects: "0000000000000000" },
                        
                        // Verse - Dense patterns
                        { topLane: "1010101010101010", bottomLane: "0101010101010101", effects: "0000000000000000" },
                        { topLane: "1100110011001100", bottomLane: "0011001100110011", effects: "0000000000000000" },
                        { topLane: "1111101011111010", bottomLane: "0101011101010111", effects: "0000000000000000" },
                        { topLane: "1010110110101101", bottomLane: "0101001001010010", effects: "0000000000000000" },
                        { topLane: "1010101010101010", bottomLane: "0101010101010101", effects: "0000000000000000" },
                        { topLane: "1100110011001100", bottomLane: "0011001100110011", effects: "0000000000000000" },
                        { topLane: "1111101011111010", bottomLane: "0101011101010111", effects: "0000000000000000" },
                        { topLane: "1111111100000000", bottomLane: "0000000011111111", effects: "0000000000000000" },
                        
                        // Build-up - Very intense
                        { topLane: "1111111111111111", bottomLane: "0000000000000000", effects: "0000000000000000" },
                        { topLane: "0000000000000000", bottomLane: "1111111111111111", effects: "0000000000000000" },
                        { topLane: "1111111111111111", bottomLane: "1111111111111111", effects: "0000000000000000" },
                        { topLane: "1010101010101010", bottomLane: "0101010101010101", effects: "0000000000000000" },
                        
                        // Drop - Maximum difficulty
                        { topLane: "1111111111111111", bottomLane: "1111111111111111", effects: "0000000000000000" },
                        { topLane: "1111101011111010", bottomLane: "0101011101010111", effects: "0000000000000000" },
                        { topLane: "1111111111111111", bottomLane: "1111111111111111", effects: "0000000000000000" },
                        { topLane: "1010110110101101", bottomLane: "0101001001010010", effects: "0000000000000000" },
                        { topLane: "1111111111111111", bottomLane: "1111111111111111", effects: "0000000000000000" },
                        { topLane: "1100110011001100", bottomLane: "0011001100110011", effects: "0000000000000000" },
                        { topLane: "1111111111111111", bottomLane: "1111111111111111", effects: "0000000000000000" },
                        { topLane: "1010101010101010", bottomLane: "0101010101010101", effects: "0000000000000000" }
                    ]
                }
            }
        };
    }
}