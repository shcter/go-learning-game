// 围棋游戏主模块 - v2.0

class GoGame {
    constructor() {
        this.currentBoard = this.createEmptyBoard();
        this.currentPlayer = BLACK;
        this.history = [];
        this.moveHistory = [];
        this.captured = { black: 0, white: 0 };
        this.showHints = true;
        this.consecutivePasses = 0;
        
        // AI设置
        this.aiEnabled = false;
        this.aiDifficulty = AI_LEVEL.MEDIUM;
        this.aiColor = WHITE;
        this.isAIThinking = false;
        
        // 复盘设置
        this.reviewMode = false;
        this.reviewIndex = -1;
        this.autoPlayInterval = null;
        this.autoPlaySpeed = 1000;
        
        // 最后一手标记
        this.lastMove = null;
        
        // 统计
        this.stats = this.loadStats();
        this.currentGameMoves = 0;
        
        // 教程
        this.tutorial = new Tutorial(this);
        
        // 死活题
        this.tsumego = new Tsumego(this);
        
        // 初始化
        window.game = this;
        this.initUI();
        this.updateDisplay();
        redraw();
        
        // 检查是否需要显示教程
        if (!localStorage.getItem('goTutorialCompleted')) {
            setTimeout(() => this.tutorial.start(), 500);
        }
    }
    
    createEmptyBoard() {
        return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    }
    
    initUI() {
        const undoBtn = document.getElementById('undo-btn');
        const resetBtn = document.getElementById('reset-btn');
        const passBtn = document.getElementById('pass-btn');
        const aiBtn = document.getElementById('ai-btn');
        const reviewBtn = document.getElementById('review-btn');
        const autoPlayBtn = document.getElementById('auto-play-btn');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const speedSelect = document.getElementById('speed-select');
        const difficultySelect = document.getElementById('difficulty-select');
        const soundBtn = document.getElementById('sound-btn');
        const tutorialBtn = document.getElementById('tutorial-btn');
        const statsBtn = document.getElementById('stats-btn');
        const tsumegoBtn = document.getElementById('tsumego-btn');
        
        if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (passBtn) passBtn.addEventListener('click', () => this.pass());
        if (aiBtn) aiBtn.addEventListener('click', () => this.toggleAI());
        if (reviewBtn) reviewBtn.addEventListener('click', () => this.toggleReview());
        if (autoPlayBtn) autoPlayBtn.addEventListener('click', () => this.toggleAutoPlay());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevMove());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextMove());
        if (speedSelect) speedSelect.addEventListener('change', (e) => {
            this.autoPlaySpeed = parseInt(e.target.value);
        });
        if (difficultySelect) difficultySelect.addEventListener('change', (e) => {
            this.aiDifficulty = e.target.value;
            if (this.aiEnabled) {
                this.showMessage(`AI难度已调整为：${this.getDifficultyText()}`);
            }
        });
        if (soundBtn) soundBtn.addEventListener('click', () => this.toggleSound());
        if (tutorialBtn) tutorialBtn.addEventListener('click', () => this.tutorial.start());
        if (statsBtn) statsBtn.addEventListener('click', () => this.showStats());
        if (tsumegoBtn) tsumegoBtn.addEventListener('click', () => this.startTsumego());
        
        this.updateAIButton();
        this.updateReviewButtons();
        this.updateSoundButton();
    }
    
    handleMove(row, col) {
        if (this.reviewMode) {
            this.exitReviewMode();
        }
        
        if (this.isAIThinking) return;
        
        const result = makeMove(this.currentBoard, row, col, this.currentPlayer);
        
        if (!result.success) {
            this.showMessage(result.reason);
            audioManager.playInvalidMove();
            return;
        }
        
        // 记录移动历史
        this.moveHistory.push({
            board: this.currentBoard.map(r => [...r]),
            player: this.currentPlayer,
            move: [row, col],
            captured: [...result.captured]
        });
        
        this.history.push({
            board: this.currentBoard.map(r => [...r]),
            player: this.currentPlayer,
            move: [row, col],
            capturedCount: this.captured[this.currentPlayer === BLACK ? 'white' : 'black']
        });
        
        this.currentBoard = result.board;
        this.consecutivePasses = 0;
        this.lastMove = { row, col };
        this.currentGameMoves++;
        
        // 更新提子数
        if (result.captured.length > 0) {
            if (this.currentPlayer === BLACK) {
                this.captured.white += result.captured.length;
            } else {
                this.captured.black += result.captured.length;
            }
            audioManager.playStoneCapture();
        } else {
            audioManager.playStonePlace();
        }
        
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
        
        this.updateDisplay();
        redraw();
        this.showMessage('');
        
        if (this.aiEnabled && this.currentPlayer === this.aiColor && !this.gameOver) {
            this.triggerAI();
        }
    }
    
    triggerAI() {
        this.isAIThinking = true;
        this.showMessage('🤖 AI思考中...');
        this.updateDisplay();
        
        setTimeout(() => {
            const move = getAIMove(this.currentBoard, this.aiColor, this.aiDifficulty);
            this.isAIThinking = false;
            
            if (move) {
                this.handleMove(move.row, move.col);
            } else {
                this.pass();
            }
        }, 500);
    }
    
    undo() {
        if (this.history.length === 0) {
            this.showMessage('没有可以悔棋的步骤');
            return;
        }
        
        for (let i = 0; i < (this.aiEnabled ? 2 : 1); i++) {
            if (this.history.length === 0) break;
            
            const lastState = this.history.pop();
            this.moveHistory.pop();
            
            this.currentBoard = this.createEmptyBoard();
            for (const state of this.history) {
                const [r, c] = state.move;
                const result = makeMove(this.currentBoard, r, c, state.player);
                if (result.success) {
                    this.currentBoard = result.board;
                }
            }
            
            this.captured = { black: 0, white: 0 };
            for (const state of this.history) {
                const color = state.player === BLACK ? 'white' : 'black';
                this.captured[color] = state.capturedCount;
            }
            
            this.currentPlayer = lastState.player;
        }
        
        this.consecutivePasses = 0;
        this.lastMove = this.moveHistory.length > 0 
            ? { row: this.moveHistory[this.moveHistory.length - 1].move[0], 
                col: this.moveHistory[this.moveHistory.length - 1].move[1] }
            : null;
        this.currentGameMoves = Math.max(0, this.currentGameMoves - 2);
        
        this.updateDisplay();
        redraw();
        this.showMessage('已悔棋');
    }
    
    reset() {
        if (this.history.length > 0 && !confirm('确定要重新开始吗？')) {
            return;
        }
        
        this.currentBoard = this.createEmptyBoard();
        this.currentPlayer = BLACK;
        this.history = [];
        this.moveHistory = [];
        this.captured = { black: 0, white: 0 };
        this.consecutivePasses = 0;
        this.lastMove = null;
        this.reviewMode = false;
        this.reviewIndex = -1;
        this.gameOver = false;
        this.currentGameMoves = 0;
        this.stopAutoPlay();
        
        this.updateDisplay();
        this.updateReviewButtons();
        redraw();
        this.showMessage('游戏已重新开始');
    }
    
    pass() {
        this.consecutivePasses++;
        
        if (this.consecutivePasses >= 2) {
            this.endGame();
            return;
        }
        
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
        this.updateDisplay();
        redraw();
        this.showMessage(this.currentPlayer === BLACK ? '黑方 Pass' : '白方 Pass');
        
        if (this.aiEnabled && this.currentPlayer === this.aiColor) {
            this.triggerAI();
        }
    }
    
    endGame() {
        const counts = countStones(this.currentBoard);
        const totalBlack = counts.black + this.captured.black;
        const totalWhite = counts.white + this.captured.white;
        
        let winner, result;
        if (totalBlack > totalWhite + 6.5) {
            winner = '黑方';
            result = `黑方胜！${totalBlack.toFixed(1)} vs ${totalWhite.toFixed(1)}`;
        } else if (totalWhite > totalBlack + 6.5) {
            winner = '白方';
            result = `白方胜！${totalWhite.toFixed(1)} vs ${totalBlack.toFixed(1)}`;
        } else {
            winner = '平局';
            result = `和棋！黑:${totalBlack.toFixed(1)} 白:${totalWhite.toFixed(1)}`;
        }
        
        this.showMessage(`游戏结束！${result}`);
        audioManager.playGameEnd();
        
        // 更新统计
        this.updateStats(winner);
        this.gameOver = true;
    }
    
    updateStats(winner) {
        if (this.aiEnabled) {
            const aiWinner = winner === '白方' ? 'AI' : '玩家';
            this.stats.vsAI = this.stats.vsAI || { wins: 0, losses: 0 };
            if (winner === '黑方' || winner === '白方') {
                if (aiWinner === '玩家') {
                    this.stats.vsAI.wins++;
                } else {
                    this.stats.vsAI.losses++;
                }
            }
        }
        this.stats.totalGames = (this.stats.totalGames || 0) + 1;
        this.stats.totalMoves = (this.stats.totalMoves || 0) + this.currentGameMoves;
        this.saveStats();
    }
    
    loadStats() {
        try {
            const saved = localStorage.getItem('goStats');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }
    
    saveStats() {
        try {
            localStorage.setItem('goStats', JSON.stringify(this.stats));
        } catch (e) {
            // Ignore
        }
    }
    
    showStats() {
        const total = this.stats.totalGames || 0;
        const moves = this.stats.totalMoves || 0;
        const avgMoves = total > 0 ? (moves / total).toFixed(1) : 0;
        const vsAI = this.stats.vsAI || { wins: 0, losses: 0 };
        
        alert(`📊 游戏统计\n\n总对局：${total}局\n总手数：${moves}手\n平均手数：${avgMoves}手\n\nAI对战：\n  胜：${vsAI.wins}局\n  负：${vsAI.losses}局`);
    }
    
    startTsumego() {
        const level = this.aiDifficulty || AI_LEVEL.EASY;
        this.tsumego.start(level);
    }
    
    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        
        if (this.aiEnabled) {
            this.aiColor = WHITE;
            this.showMessage(`🤖 AI已开启（${this.getDifficultyText()}）`);
            
            if (this.currentPlayer === WHITE && this.history.length === 0) {
                this.triggerAI();
            }
        } else {
            this.showMessage('AI已关闭');
        }
        
        this.updateAIButton();
    }
    
    updateAIButton() {
        const aiBtn = document.getElementById('ai-btn');
        if (aiBtn) {
            aiBtn.textContent = this.aiEnabled ? '🤖 AI：开' : '🤖 AI：关';
            aiBtn.className = this.aiEnabled ? 'active' : '';
        }
        
        const difficultyDiv = document.getElementById('difficulty-div');
        if (difficultyDiv) {
            difficultyDiv.style.display = this.aiEnabled ? 'inline-block' : 'none';
        }
    }
    
    getDifficultyText() {
        switch (this.aiDifficulty) {
            case AI_LEVEL.EASY: return '简单';
            case AI_LEVEL.MEDIUM: return '中等';
            case AI_LEVEL.HARD: return '困难';
            default: return '中等';
        }
    }
    
    toggleReview() {
        if (this.reviewMode) {
            this.exitReviewMode();
        } else {
            this.enterReviewMode();
        }
    }
    
    enterReviewMode() {
        if (this.moveHistory.length === 0) {
            this.showMessage('没有棋谱可以复盘');
            return;
        }
        
        this.reviewMode = true;
        this.reviewIndex = this.moveHistory.length - 1;
        this.showMessage('复盘模式：点击按钮浏览棋谱');
        this.updateReviewButtons();
        this.showReviewMove();
    }
    
    exitReviewMode() {
        this.reviewMode = false;
        this.reviewIndex = -1;
        this.stopAutoPlay();
        this.showMessage('');
        this.updateReviewButtons();
        redraw();
    }
    
    showReviewMove() {
        if (this.reviewIndex < 0 || this.reviewIndex >= this.moveHistory.length) {
            return;
        }
        
        const state = this.moveHistory[this.reviewIndex];
        this.currentBoard = state.board.map(r => [...r]);
        this.lastMove = { row: state.move[0], col: state.move[1] };
        
        redraw();
        
        const reviewInfo = document.getElementById('review-info');
        if (reviewInfo) {
            const moveNum = this.reviewIndex + 1;
            const player = state.player === BLACK ? '黑' : '白';
            const colLetter = String.fromCharCode(65 + state.move[1]);
            const rowNum = state.move[0] + 1;
            reviewInfo.textContent = `第 ${moveNum} 手：${player}方落子于 ${colLetter}${rowNum}`;
        }
    }
    
    prevMove() {
        if (!this.reviewMode || this.reviewIndex <= 0) return;
        
        this.reviewIndex--;
        this.showReviewMove();
        this.updateReviewButtons();
    }
    
    nextMove() {
        if (!this.reviewMode || this.reviewIndex >= this.moveHistory.length - 1) {
            this.exitReviewMode();
            return;
        }
        
        this.reviewIndex++;
        this.showReviewMove();
        this.updateReviewButtons();
    }
    
    toggleAutoPlay() {
        if (this.autoPlayInterval) {
            this.stopAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }
    
    startAutoPlay() {
        const autoPlayBtn = document.getElementById('auto-play-btn');
        if (autoPlayBtn) autoPlayBtn.textContent = '⏸ 暂停';
        
        this.autoPlayInterval = setInterval(() => {
            if (this.reviewIndex >= this.moveHistory.length - 1) {
                this.stopAutoPlay();
                return;
            }
            this.nextMove();
        }, this.autoPlaySpeed);
    }
    
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        
        const autoPlayBtn = document.getElementById('auto-play-btn');
        if (autoPlayBtn) autoPlayBtn.textContent = '▶️ 播放';
    }
    
    updateReviewButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const autoPlayBtn = document.getElementById('auto-play-btn');
        const reviewBtn = document.getElementById('review-btn');
        
        if (this.reviewMode) {
            if (prevBtn) prevBtn.disabled = this.reviewIndex <= 0;
            if (nextBtn) nextBtn.disabled = false;
            if (nextBtn) nextBtn.textContent = this.reviewIndex >= this.moveHistory.length - 1 ? '📤 退出' : '▶️ 下一步';
            if (reviewBtn) reviewBtn.textContent = '📤 退出复盘';
            if (autoPlayBtn) autoPlayBtn.style.display = 'inline-block';
        } else {
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            if (nextBtn) nextBtn.textContent = '▶️ 下一步';
            if (reviewBtn) reviewBtn.textContent = '📋 复盘';
            if (autoPlayBtn) autoPlayBtn.style.display = 'none';
            this.stopAutoPlay();
        }
    }
    
    toggleSound() {
        const enabled = audioManager.toggle();
        this.updateSoundButton();
        this.showMessage(enabled ? '音效已开启' : '音效已关闭');
    }
    
    updateSoundButton() {
        const soundBtn = document.getElementById('sound-btn');
        if (soundBtn) {
            soundBtn.textContent = audioManager.enabled ? '🔊 音效' : '🔇 静音';
        }
    }
    
    updateDisplay() {
        const playerSpan = document.getElementById('current-player');
        if (playerSpan) {
            let text = `当前回合：${this.currentPlayer === BLACK ? '⚫ 黑方' : '⚪ 白方'}`;
            if (this.isAIThinking) text += '（AI思考中...）';
            playerSpan.textContent = text;
        }
        
        const capturedSpan = document.getElementById('captured-stones');
        if (capturedSpan) {
            capturedSpan.textContent = `提子：黑 ${this.captured.black} / 白 ${this.captured.white}`;
        }
        
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.disabled = this.history.length === 0 || this.reviewMode;
        }
        
        const reviewBtn = document.getElementById('review-btn');
        if (reviewBtn) {
            reviewBtn.disabled = this.moveHistory.length === 0;
        }
    }
    
    showMessage(text) {
        const msgEl = document.getElementById('message');
        if (msgEl) msgEl.textContent = text;
    }
}

function init() {
    console.log('init() called - starting game initialization');
    
    try {
        audioManager.init();
        
        const boardInitialized = initBoard();
        console.log('initBoard result:', boardInitialized);
        
        if (!boardInitialized) {
            console.error('Board initialization failed!');
            document.getElementById('message').textContent = '游戏初始化失败，请刷新页面';
            return;
        }
        
        new GoGame();
        console.log('GoGame instance created successfully');
    } catch (e) {
        console.error('初始化失败:', e);
        alert('初始化失败: ' + e.message);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
