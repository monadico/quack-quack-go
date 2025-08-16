# Rhythm Game - Muse Dash Style

A lightweight web-based rhythm game inspired by Muse Dash, featuring horizontal scrolling gameplay with 2-lane mechanics. Built with the rhy-game JavaScript library for rapid development and optimized performance.

## Project Overview

**Game Concept**: Players control a character on a 2-lane horizontal track where rhythm objects scroll from right to left. Players must hit the correct keys when objects reach the hit zone on the left side of the screen.

**Target Platforms**: 
- Desktop browsers (primary)
- Mobile devices (responsive design)
- Future Web3 integration planned

## Game Mechanics

### Core Gameplay
- **2-lane horizontal scrolling** (top lane + bottom lane)
- **Objects move right-to-left** at tempo-synced speed
- **Hit zone** positioned on the left side of screen
- **Timing-based scoring** with Perfect/Great/Good/Miss judgments

### Controls
- **Top Lane**: `D` and `F` keys (or touch top area on mobile)
- **Bottom Lane**: `K` and `J` keys (or touch bottom area on mobile)
- **Why these keys**: Comfortable hand positioning, similar to osu!mania 4K split

### Visual Style
- **Muse Dash inspired**: Colorful, anime-style aesthetic
- **Character sprite**: Animated player character in hit zone area
- **Dynamic backgrounds**: Parallax scrolling with music sync
- **Particle effects**: Hit explosions, combo effects, screen shake

## Technical Stack

### Core Technologies
- **HTML5 Canvas**: Game rendering and animations
- **rhy-game library**: Rhythm game engine and timing
- **Vanilla JavaScript**: Game logic and state management
- **CSS3**: UI styling and responsive layout
- **Web Audio API**: Audio playback (via rhy-game)

### Key Libraries
```html
<!-- rhy-game - Core rhythm engine -->
<script src="https://cdn.jsdelivr.net/gh/juneekim7/rhy-game@main/dist/rhy-game.min.js"></script>
```

### Performance Requirements
- **60fps gameplay** on target devices
- **<50ms audio latency** for precise timing
- **<2 second load time** for optimal UX
- **Mobile compatibility** for devices 2018+

## Game States & Flow

```
MENU → PLAYING → GAME_OVER
  ↓       ↓         ↓
SETTINGS ←→ PAUSED → MENU
```

### 1. MENU State
**Purpose**: Main landing screen
**Elements**:
- Game title with animated logo
- "Start Game" button
- Settings/Options button
- High score display
- Background music loop

### 2. PLAYING State  
**Purpose**: Active rhythm gameplay
**Elements**:
- 2 horizontal lanes (top/bottom)
- Player character sprite at hit zone (left side)
- Scrolling rhythm objects (right to left)
- Score/combo display (top-right)
- Current judgment feedback (Perfect/Great/Good/Miss)
- Progress bar showing song completion
- Pause button

**Layout**:
```
Score: 12,450   Combo: x24
┌─────────────────────────────────┐
│  [●]  ←←←  ●    ●       ● ←← │ Top Lane
│ 🎵                            │ Player Character  
│  [●]  ←←←     ●    ● ←←    ● │ Bottom Lane
└─────────────────────────────────┘
Hit Zone                    Spawn Area
```

### 3. GAME_OVER State
**Purpose**: Results and replay options
**Elements**:
- Final score breakdown
- Accuracy statistics (Perfect/Great/Good/Miss counts)
- Max combo achieved
- Grade/rank (S/A/B/C/D)
- "Play Again" button
- "Back to Menu" button

### 4. SETTINGS State (Optional)
**Purpose**: Game configuration
**Elements**:
- Volume controls (Master/Music/SFX)
- Key binding customization
- Graphics quality options
- "Back" button

## File Structure

```
rhythm-game/
├── README.md                   # This file
├── index.html                  # Main game container
├── styles/
│   └── main.css               # All game styling
├── scripts/
│   ├── main.js                # Entry point and state management
│   ├── game-engine.js         # rhy-game integration and game logic
│   └── ui-manager.js          # Menu/UI interactions
├── assets/
│   ├── audio/
│   │   ├── demo-song.mp3      # Main gameplay track
│   │   ├── menu-music.mp3     # Background menu music
│   │   └── sfx/               # Sound effects
│   │       ├── hit-perfect.wav
│   │       ├── hit-good.wav
│   │       └── hit-miss.wav
│   ├── images/
│   │   ├── character-sprite.png
│   │   ├── background.jpg
│   │   └── ui-elements/
│   └── charts/
│       └── demo-song.json     # Chart data for demo song
└── docs/
    └── development-notes.md
```

**Why This Structure**:
- **Separation of concerns**: Scripts, styles, and assets clearly organized
- **Scalable**: Easy to add new songs, characters, or features
- **Development friendly**: Clear file purposes for team collaboration
- **Deploy ready**: Can be hosted as static files

## rhy-game Configuration

### Basic Setup Pattern
```javascript
// Horizontal 2-lane setup (adapted from standard rhy-game)
const rhythmGame = new Game({
  DOM: {
    lane1: document.getElementById('top-lane'),    // Top lane
    lane2: document.getElementById('bottom-lane'), // Bottom lane
    score: document.getElementById('score-display'),
    judgement: document.getElementById('judgment-text'),
    combo: document.getElementById('combo-counter')
  },
  keybind: {
    // Top lane controls
    'd': 'lane1', 'f': 'lane1',
    // Bottom lane controls  
    'k': 'lane2', 'j': 'lane2'
  },
  sizePerBeat: '8vh',  // Smaller for horizontal layout
  laneSizeRatio: 16,   // Wide lanes for horizontal scrolling
  judgements: [
    new Judgement('perfect', 50, 1.0, true),   // ±50ms window
    new Judgement('great', 100, 0.8, true),    // ±100ms window
    new Judgement('good', 150, 0.5, true),     // ±150ms window
    // miss automatically handled
  ]
})
```

### Chart Format (Horizontal Adaptation)
```javascript
const demoSong = new Song({
  info: {
    music: './assets/audio/demo-song.mp3',
    title: 'Demo Track',
    artist: 'Game Dev',
    bpm: 128,
    split: 16 // 16th note precision
  },
  chart: {
    normal: [
      {
        // Top lane: * = empty, s = single note, l = long note
        lane1: '|*s**|**s*|*s**|****|',
        // Bottom lane pattern
        lane2: '|**s*|s***|**s*|*s**|'
      },
      {
        lane1: '|s***|***s|*s*s|****|',
        lane2: '|***s|*s**|****|s*s*|'
      }
      // Continue pattern for full song
    ]
  }
})
```

## Development Phases

### Phase 1: Foundation (Days 1-2)
**Goal**: Basic horizontal game working

**Tasks**:
1. Set up HTML structure with 2 horizontal lanes
2. Configure rhy-game for horizontal scrolling (may require CSS transforms)
3. Implement basic state management (Menu ↔ Game ↔ Results)
4. Create simple test chart with basic note patterns
5. Verify D/F and K/J key controls work correctly

**Success Criteria**: 
- Notes spawn on right side and move left
- Hit detection works at left side hit zone  
- Basic scoring and judgments functional

### Phase 2: Core Gameplay (Days 3-4)
**Goal**: Complete game loop with good UX

**Tasks**:
1. Design and implement Muse Dash inspired visual layout
2. Add character sprite at hit zone with basic animation
3. Create complete demo song chart (2-3 minutes)
4. Implement proper game state transitions
5. Add basic UI elements (score, combo, progress)

**Success Criteria**:
- Full song playable start to finish
- Smooth transitions between all game states
- Visual feedback for all player actions

### Phase 3: Polish & Mobile (Days 5-7)
**Goal**: Production-ready game with mobile support

**Tasks**:
1. Add visual effects (particles, screen shake, hit animations)
2. Implement responsive design for mobile devices
3. Add touch controls for mobile (top/bottom touch areas)
4. Create animated backgrounds and UI polish
5. Add sound effects and audio feedback
6. Performance optimization and testing

**Success Criteria**:
- 60fps performance on target devices
- Fully responsive mobile experience
- Polished visual and audio experience

## Development Guidelines

### Code Style
- **ES6+ JavaScript**: Use modern syntax (const/let, arrow functions, async/await)
- **Modular design**: Separate concerns into logical files
- **Comment thoroughly**: Especially rhy-game integration points
- **Performance focused**: Optimize for 60fps gameplay

### Testing Strategy
- **Cross-browser testing**: Chrome, Firefox, Safari, Edge
- **Mobile device testing**: iOS Safari, Android Chrome
- **Performance profiling**: Use browser dev tools to monitor FPS/memory
- **Gameplay testing**: Verify timing accuracy with different input methods

### Version Control
- **Commit frequently**: Small, focused commits with clear messages
- **Branch strategy**: feature/gameplay, feature/ui, feature/mobile
- **Tag releases**: v0.1.0 (MVP), v0.2.0 (Polish), v1.0.0 (Production)

## Future Roadmap

### Web3 Integration (Post-MVP)
- **Wallet Connection**: MetaMask integration for user accounts
- **Score Storage**: Blockchain-based leaderboards and score history
- **NFT Rewards**: Achievement-based NFT minting
- **Token Economy**: Play-to-earn mechanics with game tokens

### Content Expansion
- **Multiple Songs**: Song selection menu with different difficulties
- **Character System**: Unlockable characters with different abilities
- **Customization**: Themes, note skins, background options
- **Level Editor**: User-generated content tools

### Advanced Features
- **Multiplayer**: Real-time competitive modes
- **Story Mode**: Progressive difficulty with narrative elements
- **Streaming Integration**: Twitch/YouTube gameplay features

## Getting Started

### Prerequisites
- Modern web browser with ES6+ support
- Local web server (for development) or static hosting
- Audio files in MP3/OGG format
- Basic knowledge of JavaScript and CSS

### Quick Start
1. **Clone/download** project files
2. **Open index.html** in browser (or serve via local server)
3. **Test basic functionality** with included demo song
4. **Modify charts** in assets/charts/ for new gameplay patterns
5. **Customize styling** in styles/main.css for visual changes

### Development Setup
```bash
# Serve locally (Python example)
python -m http.server 8000

# Or use any static file server
# Then visit: http://localhost:8000
```

## Support & Resources

### rhy-game Documentation
- **GitHub**: https://github.com/juneekim7/rhy-game
- **Examples**: Check /examples folder for reference implementations
- **API Reference**: See library documentation for advanced features

### Game Design References
- **Muse Dash**: Study original game mechanics and visual style
- **Rhythm Game Design**: Research timing windows, difficulty curves
- **Web Performance**: Optimize for target 60fps gameplay

---

**Project Goal**: Create an engaging, performant rhythm game that captures the fun of Muse Dash while being optimized for web deployment and future Web3 integration.