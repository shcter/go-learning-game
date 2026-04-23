// 棋局分析模块

class GameAnalysis {
    constructor(game) {
        this.game = game;
    }
    
    analyze() {
        const board = this.game.currentBoard;
        const analysis = {
            stones: this.countStones(board),
            territories: this.estimateTerritories(board),
            influence: this.calculateInfluence(board),
            threats: this.findThreats(board)
        };
        
        return analysis;
    }
    
    countStones(board) {
        let black = 0, white = 0;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === BLACK) black++;
                else if (board[r][c] === WHITE) white++;
            }
        }
        return { black, white };
    }
    
    estimateTerritories(board) {
        // 简化版：统计边界内的空白点
        let blackTerritory = 0;
        let whiteTerritory = 0;
        let neutral = 0;
        
        const visited = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));
        
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === 0 && !visited[r][c]) {
                    const { territory, owner } = this.floodFill(board, visited, r, c);
                    if (owner === BLACK) blackTerritory += territory;
                    else if (owner === WHITE) whiteTerritory += territory;
                    else neutral += territory;
                }
            }
        }
        
        return { black: blackTerritory, white: whiteTerritory, neutral };
    }
    
    floodFill(board, visited, startR, startC) {
        const queue = [[startR, startC]];
        const cells = [];
        let touchesBlack = false;
        let touchesWhite = false;
        
        while (queue.length > 0) {
            const [r, c] = queue.shift();
            if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue;
            if (visited[r][c]) continue;
            
            if (board[r][c] === BLACK) {
                touchesBlack = true;
                continue;
            }
            if (board[r][c] === WHITE) {
                touchesWhite = true;
                continue;
            }
            
            visited[r][c] = true;
            cells.push([r, c]);
            
            queue.push([r-1, c], [r+1, c], [r, c-1], [r, c+1]);
        }
        
        let owner = null;
        if (touchesBlack && !touchesWhite) owner = BLACK;
        else if (touchesWhite && !touchesBlack) owner = WHITE;
        
        return { territory: cells.length, owner };
    }
    
    calculateInfluence(board) {
        // 简单影响力评估
        let blackInfluence = 0;
        let whiteInfluence = 0;
        
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === BLACK) {
                    blackInfluence += 1 + this.countNeighbors(r, c);
                } else if (board[r][c] === WHITE) {
                    whiteInfluence += 1 + this.countNeighbors(r, c);
                }
            }
        }
        
        return { black: blackInfluence, white: whiteInfluence };
    }
    
    countNeighbors(row, col) {
        let count = 0;
        const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
        for (const [dr, dc] of dirs) {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (this.game.currentBoard[r][c] !== EMPTY) count++;
            }
        }
        return count;
    }
    
    findThreats(board) {
        const threats = [];
        
        // 寻找有危险的我方棋子
        const color = this.game.currentPlayer;
        const opponent = color === BLACK ? WHITE : BLACK;
        
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === color) {
                    const liberties = countGroupLiberties(board, r, c);
                    if (liberties === 1) {
                        threats.push({
                            type: 'danger',
                            row: r,
                            col: c,
                            liberties: 1,
                            message: '此处棋子只有1口气，需要立即救援！'
                        });
                    } else if (liberties === 2) {
                        threats.push({
                            type: 'warning',
                            row: r,
                            col: c,
                            liberties: 2,
                            message: '此处棋子只有2口气，注意安全'
                        });
                    }
                }
            }
        }
        
        return threats;
    }
    
    getWinProbability() {
        const analysis = this.analyze();
        const blackScore = analysis.stones.black + analysis.territories.black + analysis.stones.black; // 简化为棋子+目
        const whiteScore = analysis.stones.white + analysis.territories.white + analysis.stones.white + 6.5; // 白棋有贴目优势
        
        const total = blackScore + whiteScore;
        if (total === 0) return { black: 50, white: 50 };
        
        const blackWinProb = Math.round((blackScore / total) * 100);
        return { black: blackWinProb, white: 100 - blackWinProb };
    }
}
