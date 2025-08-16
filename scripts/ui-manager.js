class UIManager {
    constructor(gameStateManager) {
        this.gameStateManager = gameStateManager;
        this.judgmentTimeout = null;
        this.setupVolumeControls();
    }

    setupVolumeControls() {
        const masterVolume = document.getElementById('master-volume');
        const musicVolume = document.getElementById('music-volume');
        const sfxVolume = document.getElementById('sfx-volume');

        if (masterVolume) {
            masterVolume.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.setMasterVolume(volume);
            });
        }

        if (musicVolume) {
            musicVolume.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.setMusicVolume(volume);
            });
        }

        if (sfxVolume) {
            sfxVolume.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.setSFXVolume(volume);
            });
        }
    }

    updateScore(score) {
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${score.toLocaleString()}`;
        }
    }

    updateCombo(combo) {
        const comboDisplay = document.getElementById('combo-counter');
        if (comboDisplay) {
            comboDisplay.textContent = `Combo: x${combo}`;
            
            if (combo > 0) {
                comboDisplay.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    comboDisplay.style.transform = 'scale(1)';
                }, 100);
            }
        }
    }

    updateProgress(percentage) {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }

    showJudgment(judgment) {
        const judgmentElement = document.getElementById('judgment-text');
        if (!judgmentElement) return;

        if (this.judgmentTimeout) {
            clearTimeout(this.judgmentTimeout);
        }

        judgmentElement.className = `judgment ${judgment}`;
        judgmentElement.textContent = judgment.toUpperCase();
        judgmentElement.classList.add('show');

        this.judgmentTimeout = setTimeout(() => {
            judgmentElement.classList.remove('show');
        }, 800);

        this.addHitEffect(judgment);
    }

    addHitEffect(judgment) {
        const character = document.getElementById('character-sprite');
        if (!character) return;

        character.style.transform = 'scale(1.2)';
        character.style.filter = 'brightness(1.5)';

        setTimeout(() => {
            character.style.transform = 'scale(1)';
            character.style.filter = 'brightness(1)';
        }, 150);

        if (judgment === 'perfect') {
            this.createParticleEffect();
        }
    }

    createParticleEffect() {
        const character = document.getElementById('character-sprite');
        if (!character) return;

        const rect = character.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.background = '#ffd700';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            particle.style.boxShadow = '0 0 10px #ffd700';

            document.body.appendChild(particle);

            const angle = (i / 8) * Math.PI * 2;
            const distance = 100;
            const endX = centerX + Math.cos(angle) * distance;
            const endY = centerY + Math.sin(angle) * distance;

            particle.animate([
                { 
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                { 
                    transform: `translate(${endX - centerX}px, ${endY - centerY}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: 600,
                easing: 'ease-out'
            }).onfinish = () => {
                particle.remove();
            };
        }
    }

    addScreenShake(intensity = 1) {
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) return;

        const shakeAmount = 5 * intensity;
        gameContainer.style.transform = `translate(${Math.random() * shakeAmount - shakeAmount/2}px, ${Math.random() * shakeAmount - shakeAmount/2}px)`;

        setTimeout(() => {
            gameContainer.style.transform = 'translate(0, 0)';
        }, 100);
    }

    createNote(lane, position) {
        console.log(`UI: Creating note for ${lane} lane`);
        
        // Get the lane element to know its vertical position
        const laneElement = document.getElementById(`${lane}-lane`);
        if (!laneElement) {
            console.error(`Lane element not found: ${lane}-lane`);
            return null;
        }
        
        // Get the lane's position on screen
        const laneRect = laneElement.getBoundingClientRect();
        const laneCenter = laneRect.top + (laneRect.height / 2);
        
        // Create note using same approach as red box - fixed positioning
        const note = document.createElement('div');
        note.className = 'note';
        note.style.position = 'fixed';
        note.style.top = (laneCenter - 40) + 'px'; // Center in lane (40px = half of 80px note height)
        note.style.right = '0px'; // Start at right edge of screen
        note.style.width = '80px';
        note.style.height = '80px';
        note.style.background = 'radial-gradient(circle, #ff6b9d, #c44569)';
        note.style.border = '4px solid rgba(255, 255, 255, 1)';
        note.style.borderRadius = '50%';
        note.style.boxShadow = '0 0 30px rgba(255, 107, 157, 1)';
        note.style.zIndex = '1000';
        note.dataset.lane = lane;
        note.dataset.position = position;

        // Add the note symbol
        note.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 1.5rem; font-weight: bold;">●</div>';

        document.body.appendChild(note);
        console.log(`Note created and added to body at top: ${note.style.top}`);
        return note;
    }

    moveNote(note, speed) {
        if (!note || !note.parentElement) return;

        const currentRight = parseInt(note.style.right) || 0;
        const newRight = currentRight + speed;
        note.style.right = newRight + 'px';

        const noteAreaWidth = note.parentElement.offsetWidth;
        if (newRight >= noteAreaWidth + 60) {
            this.removeNote(note);
            return false;
        }

        return true;
    }

    removeNote(note) {
        if (note && note.parentElement) {
            note.remove();
        }
    }

    isNoteInHitZone(note) {
        if (!note) return false;

        const noteRect = note.getBoundingClientRect();
        const hitZone = note.parentElement.parentElement.querySelector('.hit-zone');
        if (!hitZone) return false;

        const hitZoneRect = hitZone.getBoundingClientRect();
        
        const noteCenter = noteRect.left + noteRect.width / 2;
        const hitZoneCenter = hitZoneRect.left + hitZoneRect.width / 2;
        const distance = Math.abs(noteCenter - hitZoneCenter);

        const perfectWindow = 30;
        const greatWindow = 60;
        const goodWindow = 90;

        if (distance <= perfectWindow) return 'perfect';
        if (distance <= greatWindow) return 'great';
        if (distance <= goodWindow) return 'good';
        return 'miss';
    }

    setMasterVolume(volume) {
        console.log('Master volume set to:', volume);
    }

    setMusicVolume(volume) {
        console.log('Music volume set to:', volume);
    }

    setSFXVolume(volume) {
        console.log('SFX volume set to:', volume);
    }

    showLoadingIndicator() {
        console.log('Showing loading indicator');
    }

    hideLoadingIndicator() {
        console.log('Hiding loading indicator');
    }
}