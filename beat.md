# BMS-Style Timing Implementation Guide

## Overview

This guide explains how to implement a BMS (Be-Music Source) inspired timing system for your Muse Dash-style rhythm game. This system provides precise, grid-based note timing that matches professional rhythm games.

## What is BMS-Style Timing?

BMS timing divides songs into **measures** (bars) and **subdivisions** (beats/fractions). Instead of placing notes at arbitrary timestamps, notes are positioned on a precise grid that aligns with musical structure.

### Key Concepts:
- **Measure**: A musical bar (typically 4 beats in 4/4 time)
- **Subdivision**: How finely each measure is divided (4, 8, 16, or 32 parts)
- **Grid Position**: Exact location where a note can be placed
- **BPM**: Beats per minute of the song
- **Offset**: Fine-tuning delay to sync audio with visuals

## Why Implement This?

### Current Problem:
```javascript
// Manual timestamp approach (hard to maintain)
const notes = [
  { time: 1.5, lane: 'top' },
  { time: 2.0, lane: 'bottom' },
  { time: 2.5, lane: 'top' }
]
```

### BMS Solution:
```javascript
// Grid-based approach (musical and precise)
const chart = {
  bpm: 128,
  subdivision: 16,
  measures: [
    {
      topLane:    "1000100010001000", // Each character = 1/16 note
      bottomLane: "0010001000100010"
    }
  ]
}
```

### Benefits:
- **Musical Accuracy**: Notes align with actual beats and rhythms
- **Easy Editing**: Visual pattern editing like sheet music
- **Scalable**: Easy to add complex songs with proper timing
- **Industry Standard**: Same approach used by established rhythm games
- **Community Friendly**: Familiar format for chart creators

## Implementation Strategy

### Phase 1: Enhanced rhy-game Integration (Recommended Start)
Extend your existing rhy-game setup to support BMS-style precision without breaking current functionality.

### Phase 2: Custom BMS Engine (Advanced)
Build a full BMS-compatible timing engine for maximum flexibility and professional features.

## Phase 1: Enhanced rhy-game Implementation

### 1. Enhanced Chart Data Structure

Create a new chart format that extends rhy-game's capabilities:

```javascript
// New enhanced chart format
const enhancedChart = {
  metadata: {
    title: "Demo Song",
    artist: "Artist Name",
    bpm: 128,
    subdivision: 16,        // 16th note precision
    beatsPerMeasure: 4,     // 4/4 time signature
    offset: 0.05,           // Audio sync offset in seconds
    previewStart: 30.0      // Preview timestamp for song selection
  },
  audio: {
    music: './assets/audio/demo-song.mp3',
    preview: './assets/audio/demo-preview.mp3'  // Optional 15-30s preview
  },
  charts: {
    easy: {
      level: 3,
      measures: [
        {
          topLane:    "1000100010001000",  // 16 subdivisions = 1 measure
          bottomLane: "0010001000100010",
          effects:    "0000000000000000"   // Future: visual effects
        },
        {
          topLane:    "1010101010101010",
          bottomLane: "0101010101010101",
          effects:    "0000000000000000"
        }
      ]
    },
    hard: {
      level: 7,
      measures: [
        // More complex patterns for harder difficulty
      ]
    }
  }
}
```

### 2. Timing Calculation Engine

Create a timing engine that converts grid positions to exact timestamps:

```javascript
class BMSTimingEngine {
  constructor(chartData) {
    this.bpm = chartData.metadata.bpm
    this.subdivision = chartData.metadata.subdivision
    this.beatsPerMeasure = chartData.metadata.beatsPerMeasure
    this.offset = chartData.metadata.offset
    this.secondsPerBeat = 60 / this.bpm
  }
  
  // Convert chart data to rhy-game compatible format
  convertToRhyGame(difficulty = 'easy') {
    const chart = this.chartData.charts[difficulty]
    const notes = []
    
    chart.measures.forEach((measure, measureIndex) => {
      // Process top lane
      this.procesLane(measure.topLane, measureIndex, 'lane1', notes)
      // Process bottom lane
      this.processLane(measure.bottomLane, measureIndex, 'lane2', notes)
    })
    
    return this.generateRhyGameFormat(notes)
  }
  
  processLane(lanePattern, measureIndex, laneName, notes) {
    for (let i = 0; i < lanePattern.length; i++) {
      if (lanePattern[i] === '1') {
        // Calculate exact time for this note
        const beatPosition = (i / this.subdivision) * this.beatsPerMeasure
        const absoluteBeat = (measureIndex * this.beatsPerMeasure) + beatPosition
        const timeInSeconds = (absoluteBeat * this.secondsPerBeat) + this.offset
        
        notes.push({
          time: timeInSeconds,
          lane: laneName,
          type: 'single',
          measureIndex: measureIndex,
          beatPosition: beatPosition
        })
      }
    }
  }
  
  generateRhyGameFormat(notes) {
    // Convert notes array back to rhy-game's text format
    // This bridges BMS precision with rhy-game compatibility
    const songLength = notes[notes.length - 1].time + 2 // Add buffer
    const divisions = Math.ceil(songLength * (this.bpm / 60) * 4) // Quarter note divisions
    
    let lane1Pattern = ''
    let lane2Pattern = ''
    
    // Build pattern strings compatible with rhy-game
    for (let i = 0; i < divisions; i++) {
      const currentTime = i * (this.secondsPerBeat / 4)
      
      const lane1Note = notes.find(note => 
        note.lane === 'lane1' && 
        Math.abs(note.time - currentTime) < 0.05
      )
      const lane2Note = notes.find(note => 
        note.lane === 'lane2' && 
        Math.abs(note.time - currentTime) < 0.05
      )
      
      lane1Pattern += lane1Note ? 's' : '*'
      lane2Pattern += lane2Note ? 's' : '*'
      
      // Add measure separators for readability
      if (i > 0 && i % 16 === 0) {
        lane1Pattern += '|'
        lane2Pattern += '|'
      }
    }
    
    return {
      lane1: lane1Pattern,
      lane2: lane2Pattern
    }
  }
}
```

### 3. Integration with rhy-game

Modify your existing rhy-game setup to use the enhanced timing:

```javascript
// Enhanced game initialization
function initializeEnhancedGame(chartData) {
  const timingEngine = new BMSTimingEngine(chartData)
  const rhyGameFormat = timingEngine.convertToRhyGame('easy')
  
  const song = new Song({
    info: {
      music: chartData.audio.music,
      title: chartData.metadata.title,
      artist: chartData.metadata.artist,
      bpm: chartData.metadata.bpm
    },
    chart: {
      easy: [rhyGameFormat]
    }
  })
  
  // Use existing rhy-game setup
  const game = new Game({
    DOM: {
      lane1: document.getElementById('top-lane'),
      lane2: document.getElementById('bottom-lane'),
      score: document.getElementById('score'),
      judgement: document.getElementById('judgement'),
      combo: document.getElementById('combo')
    },
    keybind: {
      'd': 'lane1', 'f': 'lane1',  // Top lane
      'j': 'lane2', 'k': 'lane2'   // Bottom lane
    }
  })
  
  game.play(song, 'easy')
}
```

### 4. Chart Creation Workflow

For creating charts, you have several approaches:

#### Manual Pattern Creation:
```javascript
// Create patterns by hand (good for learning)
const demoChart = {
  metadata: { bpm: 120, subdivision: 16 },
  charts: {
    easy: {
      measures: [
        {
          topLane:    "1000100010001000",  // On beats 1, 2, 3, 4
          bottomLane: "0100010001000100"   // On off-beats
        }
      ]
    }
  }
}
```

#### Pattern Generator Functions:
```javascript
// Helper functions for common rhythm patterns
function generateBasicPattern(bpm, measures) {
  const patterns = []
  
  for (let i = 0; i < measures; i++) {
    patterns.push({
      topLane:    "1000100010001000",  // Simple quarter notes
      bottomLane: "0010001000100010"   // Syncopated pattern
    })
  }
  
  return patterns
}

function generateIntermediatePattern(bpm, measures) {
  const patterns = []
  
  for (let i = 0; i < measures; i++) {
    patterns.push({
      topLane:    "1010101010101010",  // Eighth notes
      bottomLane: "0101010101010101"   // Alternating eighth notes
    })
  }
  
  return patterns
}
```

### 5. Chart File Format

Store charts as JSON files for easy editing and sharing:

```javascript
// charts/demo-song-easy.json
{
  "metadata": {
    "title": "Demo Song",
    "artist": "Demo Artist",
    "bpm": 128,
    "subdivision": 16,
    "beatsPerMeasure": 4,
    "offset": 0.05,
    "difficulty": "easy",
    "level": 3
  },
  "measures": [
    {
      "topLane": "1000100010001000",
      "bottomLane": "0010001000100010",
      "effects": "0000000000000000"
    },
    {
      "topLane": "1010000010100000", 
      "bottomLane": "0000101000001010",
      "effects": "0000000000000000"
    }
  ]
}
```

## Phase 2: Full BMS Engine (Advanced Implementation)

### Advanced Features to Add Later:

#### 1. Variable BPM Support
```javascript
// Handle tempo changes mid-song
const bpmChanges = [
  { measure: 0, bpm: 120 },
  { measure: 8, bpm: 140 },   // Speed up at measure 8
  { measure: 16, bpm: 120 }   // Back to original tempo
]
```

#### 2. Complex Note Types
```javascript
// Extended note types beyond simple taps
const noteTypes = {
  '1': 'tap',        // Basic note
  '2': 'hold_start', // Start of hold note
  '3': 'hold_end',   // End of hold note
  '4': 'slide',      // Slide between lanes
  '0': 'empty'       // No note
}
```

#### 3. Visual Chart Editor
- Grid-based editor showing measures and subdivisions
- Audio waveform display for visual reference
- Real-time playback with note preview
- Export to your game's chart format

## Implementation Timeline

### Week 1: Basic BMS Integration
- [ ] Create enhanced chart data structure
- [ ] Build timing calculation engine
- [ ] Integrate with existing rhy-game setup
- [ ] Test with one simple song

### Week 2: Chart Creation Tools
- [ ] Pattern generator functions
- [ ] JSON chart file format
- [ ] Chart loading and validation
- [ ] Multiple difficulty support

### Week 3: Polish and Features
- [ ] Audio offset adjustment
- [ ] Chart preview functionality
- [ ] Performance optimization
- [ ] Error handling and validation

### Future: Advanced Features
- [ ] Visual chart editor
- [ ] Community chart sharing
- [ ] Variable BPM support
- [ ] Complex note types

## File Structure

```
rhythm-game/
├── README.md
├── index.html
├── scripts/
│   ├── main.js
│   ├── bms-timing-engine.js      # New: BMS timing system
│   ├── chart-loader.js           # New: Chart file management
│   └── rhy-game-bridge.js        # New: Bridge to rhy-game
├── styles/
│   └── main.css
├── assets/
│   ├── audio/
│   │   ├── demo-song.mp3
│   │   └── demo-preview.mp3
│   └── charts/                   # New: Chart data files
│       ├── demo-song-easy.json
│       ├── demo-song-hard.json
│       └── chart-schema.json     # Validation schema
└── tools/                        # Future: Chart creation tools
    ├── pattern-generator.js
    └── chart-validator.js
```

## Testing Strategy

### 1. Timing Accuracy Testing
```javascript
// Test timing calculations
function testTimingAccuracy() {
  const engine = new BMSTimingEngine({
    metadata: { bpm: 120, subdivision: 16, beatsPerMeasure: 4, offset: 0 }
  })
  
  // Test: Note at measure 0, beat 0 should be at time 0
  const time1 = engine.calculateNoteTime(0, 0)
  console.assert(time1 === 0, 'First note timing incorrect')
  
  // Test: Note at measure 1, beat 0 should be at time 2.0 (for 120 BPM)
  const time2 = engine.calculateNoteTime(1, 0)
  console.assert(Math.abs(time2 - 2.0) < 0.001, 'Second measure timing incorrect')
}
```

### 2. Pattern Validation
```javascript
// Ensure chart patterns are valid
function validateChartPattern(pattern, subdivision) {
  // Check pattern length matches subdivision
  if (pattern.length !== subdivision) {
    throw new Error(`Pattern length ${pattern.length} doesn't match subdivision ${subdivision}`)
  }
  
  // Check only valid characters
  const validChars = ['0', '1', '2', '3', '4']
  for (let char of pattern) {
    if (!validChars.includes(char)) {
      throw new Error(`Invalid character '${char}' in pattern`)
    }
  }
}
```

## Benefits of This Implementation

### For Development:
- **Precise Timing**: Professional-quality note placement
- **Easy Maintenance**: Visual patterns easier to edit than timestamps
- **Scalable**: Simple to add new songs and difficulties
- **Industry Standard**: Compatible with rhythm game conventions

### For Players:
- **Better Gameplay**: Notes feel more naturally timed to music
- **Consistent Difficulty**: Predictable rhythm patterns
- **Musical Experience**: Timing matches actual song structure

### For Future:
- **Community Charts**: Others can create charts using familiar format
- **Advanced Features**: Foundation for complex rhythm game features
- **Web3 Integration**: Chart data easily stored on blockchain/IPFS

## Next Steps

1. **Start with Phase 1**: Implement basic BMS timing with rhy-game integration
2. **Create Test Chart**: Build one song using the new format
3. **Validate Timing**: Ensure accuracy matches expectations
4. **Add Chart Loading**: Support for multiple songs and difficulties
5. **Plan Phase 2**: Design advanced features for future implementation

This implementation bridges the gap between simple rhythm games and professional-quality timing systems, giving your game the precision needed for satisfying gameplay while maintaining development simplicity.