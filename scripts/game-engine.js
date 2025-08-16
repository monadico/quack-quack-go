class GameEngine {
    constructor(gameStateManager) {
        this.gameStateManager = gameStateManager;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentSong = null;
        this.gameLoop = null;
        this.notes = [];
        this.songProgress = 0;
        this.songDuration = 60000; // 60 seconds demo
        this.bpm = 128;
        this.noteSpeed = 4; // pixels per frame at 60fps
        this.lastNoteSpawn = 0;
        this.spawnInterval = 800; // milliseconds between notes
        
        this.demoChart = this.createDemoChart();
        this.chartIndex = 0;
        this.startTime = null;
        this.travelTime = 3000; // Time for note to travel from spawn to hit zone (ms)
    }

    createDemoChart() {
        const chart = [];
        const patterns = [
            { top: true, bottom: false },
            { top: false, bottom: true },
            { top: true, bottom: true },
            { top: false, bottom: false },
            { top: true, bottom: false },
            { top: false, bottom: true },
            { top: true, bottom: false },
            { top: false, bottom: true }
        ];

        // Create notes that spawn early to account for travel time
        for (let i = 0; i < 120; i++) {
            const pattern = patterns[i % patterns.length];
            const hitTime = i * 800; // When note should be hit
            const spawnTime = hitTime - this.travelTime; // When note should spawn
            
            if (spawnTime >= 0) {
                chart.push({
                    spawnTime: spawnTime,
                    hitTime: hitTime,
                    topLane: pattern.top,
                    bottomLane: pattern.bottom
                });
            }
        }

        return chart;
    }

    startGame() {
        this.isPlaying = true;
        this.isPaused = false;
        this.songProgress = 0;
        this.chartIndex = 0;
        this.notes = [];
        this.startTime = performance.now();
        this.lastNoteSpawn = 0;
        
        this.gameStateManager.setState('game');
        
        // Add hit zone markers
        setTimeout(() => {
            this.addHitZoneMarkers();
        }, 100);
        
        // Start continuous note spawning
        setTimeout(() => {
            console.log('Starting continuous note flow...');
            this.startNoteFlow();
        }, 1000);
        
        this.gameLoop = requestAnimationFrame(() => this.update());
        
        console.log('Game started!');
    }

    pauseGame() {
        this.isPaused = !this.isPaused;
        
        if (!this.isPaused && this.isPlaying) {
            this.gameLoop = requestAnimationFrame(() => this.update());
        }
    }

    stopGame() {
        this.isPlaying = false;
        this.isPaused = false;
        
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        
        if (this.noteSpawnInterval) {
            clearInterval(this.noteSpawnInterval);
            this.noteSpawnInterval = null;
        }
        
        this.clearAllNotes();
        this.gameStateManager.endGame();
    }

    update() {
        if (!this.isPlaying || this.isPaused) return;

        const currentTime = performance.now();
        const gameTime = currentTime - this.startTime;
        
        this.songProgress = (gameTime / this.songDuration) * 100;
        this.gameStateManager.updateProgress(this.songProgress);

        this.spawnNotes(gameTime);
        this.updateNotes();
        this.checkMissedNotes();

        if (this.songProgress >= 100) {
            this.stopGame();
            return;
        }

        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    spawnNotes(gameTime) {
        while (this.chartIndex < this.demoChart.length) {
            const chartNote = this.demoChart[this.chartIndex];
            
            if (chartNote.spawnTime <= gameTime) {
                if (chartNote.topLane) {
                    this.createNote('top', chartNote.hitTime);
                    console.log('Spawned top note at', gameTime);
                }
                if (chartNote.bottomLane) {
                    this.createNote('bottom', chartNote.hitTime);
                    console.log('Spawned bottom note at', gameTime);
                }
                this.chartIndex++;
            } else {
                break;
            }
        }
    }

    createNote(lane, hitTime) {
        console.log(`Creating note for ${lane} lane at hit time ${hitTime}`);
        const noteElement = this.gameStateManager.uiManager.createNote(lane, hitTime);
        
        if (noteElement) {
            console.log(`Note element created successfully:`, noteElement);
            const note = {
                element: noteElement,
                lane: lane,
                hitTime: hitTime,
                spawnTime: performance.now() - this.startTime,
                hit: false,
                screenPosition: window.innerWidth // Start at right edge of screen
            };
            
            this.notes.push(note);
            console.log(`Total notes in array: ${this.notes.length}`);
            
            // Start the sliding animation for this note
            this.startNoteSliding(note);
        } else {
            console.error(`Failed to create note element for ${lane} lane`);
        }
    }

    startNoteSliding(note) {
        // Simple sliding animation like the red box
        const slideInterval = setInterval(() => {
            if (note.hit || !note.element.parentElement) {
                clearInterval(slideInterval);
                return;
            }
            
            // Move note left by 5 pixels each frame
            note.screenPosition -= 5;
            note.element.style.right = (window.innerWidth - note.screenPosition) + 'px';
            
            // Calculate hit zone position (left 15% of screen where hit zones are)
            const hitZonePosition = window.innerWidth * 0.15;
            
            // Check if note is in hit zone for potential hits
            if (Math.abs(note.screenPosition - hitZonePosition) < 100) {
                // Note is near hit zone
                console.log(`Note in hit zone area: position=${note.screenPosition}, hitZone=${hitZonePosition}`);
            }
            
            // Remove when it goes off screen
            if (note.screenPosition < -100) {
                if (!note.hit) {
                    this.gameStateManager.updateScore(0, 'miss');
                }
                note.element.remove();
                clearInterval(slideInterval);
                // Remove from notes array
                this.notes = this.notes.filter(n => n !== note);
                console.log('Note removed from screen');
            }
        }, 16); // ~60fps
    }

    updateNotes() {
        // Notes are now handled by their individual sliding animations
        // This method can be simplified or removed
    }

    checkMissedNotes() {
        // This is now handled in updateNotes() method
    }

    handleInput(lane) {
        if (!this.isPlaying || this.isPaused) return;

        console.log('Input received for lane:', lane);
        const hitNote = this.findHittableNote(lane);
        
        if (hitNote) {
            const judgment = this.calculateJudgment(hitNote);
            const score = this.calculateScore(judgment);
            
            console.log('Hit note with judgment:', judgment, 'score:', score, 'position:', hitNote.position);
            
            hitNote.hit = true;
            this.gameStateManager.updateScore(score, judgment);
            this.gameStateManager.uiManager.removeNote(hitNote.element);
            
            if (judgment === 'perfect') {
                this.gameStateManager.uiManager.addScreenShake(0.5);
            }
        } else {
            // Only register miss if there are notes in the lane that could have been hit
            const nearbyNotes = this.notes.filter(note => 
                note.lane === lane && 
                !note.hit && 
                Math.abs(note.position - 100) < 30 // Within reasonable distance of hit zone
            );
            
            console.log('No hit, nearby notes:', nearbyNotes.length);
            
            if (nearbyNotes.length > 0) {
                this.gameStateManager.updateScore(0, 'miss');
            }
        }
    }

    findHittableNote(lane) {
        const laneNotes = this.notes.filter(note => 
            note.lane === lane && 
            !note.hit && 
            note.element && 
            note.element.parentElement
        );

        if (laneNotes.length === 0) return null;

        // Hit zone is at 15% from left edge of screen
        const hitZonePosition = window.innerWidth * 0.15;
        let closestNote = null;
        let closestDistance = Infinity;

        laneNotes.forEach(note => {
            const distance = Math.abs(note.screenPosition - hitZonePosition);
            if (distance < closestDistance && distance < 100) { // Within hit window (100px)
                closestDistance = distance;
                closestNote = note;
            }
        });

        return closestNote;
    }

    calculateJudgment(note) {
        const hitZonePosition = window.innerWidth * 0.15;
        const distance = Math.abs(note.screenPosition - hitZonePosition);
        
        if (distance <= 30) return 'perfect';
        if (distance <= 60) return 'great';
        if (distance <= 90) return 'good';
        return 'miss';
    }

    calculateScore(judgment) {
        const scores = {
            perfect: 300,
            great: 200,
            good: 100,
            miss: 0
        };
        
        return scores[judgment] || 0;
    }

    clearAllNotes() {
        this.notes.forEach(note => {
            if (note.element) {
                this.gameStateManager.uiManager.removeNote(note.element);
            }
        });
        this.notes = [];
    }

    getCurrentBPM() {
        return this.bpm;
    }

    getSongProgress() {
        return this.songProgress;
    }

    isGameActive() {
        return this.isPlaying && !this.isPaused;
    }

    createSimpleSlider() {
        console.log('Creating simple sliding red box...');
        
        // Create a simple red box
        const slider = document.createElement('div');
        slider.style.position = 'fixed';
        slider.style.top = '200px';
        slider.style.right = '0px'; // Start at right edge of screen
        slider.style.width = '50px';
        slider.style.height = '50px';
        slider.style.backgroundColor = 'red';
        slider.style.border = '2px solid white';
        slider.style.zIndex = '1000';
        slider.style.borderRadius = '10px';
        
        document.body.appendChild(slider);
        console.log('Red box added to page');
        
        // Animate it sliding left
        let position = window.innerWidth; // Start at right edge
        const slideInterval = setInterval(() => {
            position -= 5; // Move 5px left each frame
            slider.style.right = (window.innerWidth - position) + 'px';
            
            // Remove when it goes off screen
            if (position < -100) {
                slider.remove();
                clearInterval(slideInterval);
                console.log('Red box removed');
            }
        }, 16); // ~60fps
        
        console.log('Started sliding animation');
    }

    addHitZoneMarkers() {
        console.log('Adding hit zone markers...');
        
        // Get lane positions
        const topLane = document.getElementById('top-lane');
        const bottomLane = document.getElementById('bottom-lane');
        
        if (topLane && bottomLane) {
            const topRect = topLane.getBoundingClientRect();
            const bottomRect = bottomLane.getBoundingClientRect();
            
            // Hit zone position (15% from left edge of screen)
            const hitZoneX = window.innerWidth * 0.15;
            
            // Create top lane hit marker
            const topMarker = document.createElement('div');
            topMarker.style.position = 'fixed';
            topMarker.style.left = (hitZoneX - 40) + 'px'; // Center the 80px marker
            topMarker.style.top = (topRect.top + topRect.height/2 - 40) + 'px';
            topMarker.style.width = '80px';
            topMarker.style.height = '80px';
            topMarker.style.background = 'rgba(255, 20, 147, 0.6)'; // Pink with transparency
            topMarker.style.border = '3px solid rgba(255, 20, 147, 1)';
            topMarker.style.borderRadius = '50%';
            topMarker.style.zIndex = '500';
            topMarker.style.boxShadow = '0 0 20px rgba(255, 20, 147, 0.8)';
            topMarker.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 1.2rem; font-weight: bold;">HIT</div>';
            document.body.appendChild(topMarker);
            
            // Create bottom lane hit marker
            const bottomMarker = document.createElement('div');
            bottomMarker.style.position = 'fixed';
            bottomMarker.style.left = (hitZoneX - 40) + 'px';
            bottomMarker.style.top = (bottomRect.top + bottomRect.height/2 - 40) + 'px';
            bottomMarker.style.width = '80px';
            bottomMarker.style.height = '80px';
            bottomMarker.style.background = 'rgba(255, 20, 147, 0.6)';
            bottomMarker.style.border = '3px solid rgba(255, 20, 147, 1)';
            bottomMarker.style.borderRadius = '50%';
            bottomMarker.style.zIndex = '500';
            bottomMarker.style.boxShadow = '0 0 20px rgba(255, 20, 147, 0.8)';
            bottomMarker.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 1.2rem; font-weight: bold;">HIT</div>';
            document.body.appendChild(bottomMarker);
            
            console.log(`Hit zone markers added at x=${hitZoneX}, top lane y=${topRect.top + topRect.height/2}, bottom lane y=${bottomRect.top + bottomRect.height/2}`);
        }
    }

    startNoteFlow() {
        // Note patterns: 0 = no note, 1 = top lane, 2 = bottom lane, 3 = both lanes
        const patterns = [
            1, 0, 2, 0, 1, 2, 0, 1,  // Basic alternating pattern
            0, 2, 1, 0, 2, 0, 1, 0,  // Syncopated pattern
            1, 1, 2, 0, 1, 0, 2, 2,  // Double hits
            0, 1, 0, 2, 0, 1, 0, 2,  // Spaced pattern
            3, 0, 0, 1, 0, 2, 0, 0,  // Both lanes + singles
            1, 2, 1, 2, 0, 0, 3, 0,  // Quick alternation + both
            0, 0, 1, 0, 0, 2, 0, 1,  // Sparse pattern
            2, 1, 0, 1, 2, 0, 1, 2   // Dense pattern
        ];
        
        let patternIndex = 0;
        let noteId = 0;
        
        // Store interval so we can clear it when game stops
        this.noteSpawnInterval = setInterval(() => {
            // Stop spawning if game is not active
            if (!this.isPlaying) {
                clearInterval(this.noteSpawnInterval);
                return;
            }
            
            const pattern = patterns[patternIndex % patterns.length];
            
            // Spawn notes based on pattern
            if (pattern === 1 || pattern === 3) {
                this.createNote('top', noteId++);
                console.log('Spawned top note');
            }
            if (pattern === 2 || pattern === 3) {
                this.createNote('bottom', noteId++);
                console.log('Spawned bottom note');
            }
            
            patternIndex++;
            
        }, 600); // Spawn every 600ms for good rhythm flow
        
        console.log('Note flow started - spawning every 600ms');
    }
}