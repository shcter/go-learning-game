// SGF棋谱导出模块

class SGFExporter {
    constructor(game) {
        this.game = game;
    }
    
    export() {
        if (this.game.moveHistory.length === 0) {
            this.game.showMessage('没有棋谱可导出');
            return null;
        }
        
        let sgf = '(;FF[4]CA[UTF-8]AP[GoLearningGame]';
        sgf += 'SZ[9]';  // 9x9 board
        sgf += 'KM[6.5]';  // komi
        sgf += 'PW[White]PB[Black]';
        
        // 记录每一步
        for (let i = 0; i < this.game.moveHistory.length; i++) {
            const state = this.game.moveHistory[i];
            const [row, col] = state.move;
            
            // SGF坐标转换 (0,0) -> 'aa'
            const sgfCoord = String.fromCharCode(97 + col) + String.fromCharCode(97 + (BOARD_SIZE - 1 - row));
            
            if (state.player === BLACK) {
                sgf += `;B[${sgfCoord}]`;
            } else {
                sgf += `;W[${sgfCoord}]`;
            }
        }
        
        sgf += ')';
        return sgf;
    }
    
    download() {
        const sgf = this.export();
        if (!sgf) return;
        
        const blob = new Blob([sgf], { type: 'application/x-go-sgf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `go-game-${Date.now()}.sgf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.game.showMessage('棋谱已导出');
    }
    
    copyToClipboard() {
        const sgf = this.export();
        if (!sgf) return;
        
        navigator.clipboard.writeText(sgf).then(() => {
            this.game.showMessage('棋谱已复制到剪贴板');
        }).catch(() => {
            this.game.showMessage('复制失败');
        });
    }
    
    // 导入SGF（简化版）
    import(sgfText) {
        try {
            // 简单解析：提取坐标
            const coordRegex = /[BW]\[([a-i][a-i])\]/g;
            const moves = [];
            let match;
            
            while ((match = coordRegex.exec(sgfText)) !== null) {
                const coord = match[1];
                const col = coord.charCodeAt(0) - 97;
                const row = BOARD_SIZE - 1 - (coord.charCodeAt(1) - 97);
                moves.push({ row, col });
            }
            
            return moves;
        } catch (e) {
            return null;
        }
    }
}
