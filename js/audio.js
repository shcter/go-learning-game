// 音效模块 - 使用Web Audio API生成简单音效

class AudioManager {
    constructor() {
        this.enabled = true;
        this.context = null;
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.context) return;
        
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
            
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
        } catch (e) {
            // Ignore audio errors
        }
    }
    
    playStonePlace() {
        this.playTone(440, 0.1, 'sine');
    }
    
    playStoneCapture() {
        this.playTone(220, 0.15, 'triangle');
    }
    
    playInvalidMove() {
        this.playTone(150, 0.2, 'sawtooth');
    }
    
    playGameEnd() {
        setTimeout(() => this.playTone(523, 0.2), 0);
        setTimeout(() => this.playTone(659, 0.2), 150);
        setTimeout(() => this.playTone(784, 0.3), 300);
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

const audioManager = new AudioManager();
