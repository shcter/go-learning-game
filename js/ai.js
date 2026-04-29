// 围棋AI模块
// 获取所有合法落子位置
function getAllValidMoves(board, color) {
    const moves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const validation = isValidMove(board, r, c, color, true);
            if (validation.valid) {
                moves.push({ row: r, col: c, validation });
            }
        }
    }
    return moves;
}

// 评估落子位置分数
function evaluateMove(board, row, col, color, isAI = false) {
    let score = 0;
    const opponent = color === BLACK ? WHITE : BLACK;
    
    // 创建临时棋盘并落子
    const tempBoard = copyBoard(board);
    tempBoard[row][col] = color;
    
    // 检查是否能吃掉对方棋子
    let captured = 0;
    for (const [nr, nc] of getNeighbors(row, col)) {
        if (board[nr][nc] === opponent) {
            if (countGroupLiberties(tempBoard, nr, nc) === 0) {
                const group = getGroup(tempBoard, nr, nc);
                captured += group.length;
            }
        }
    }
    score += captured * 10;
    
    // 检查是否能救活自己的死子
    for (const [nr, nc] of getNeighbors(row, col)) {
        if (board[nr][nc] === color) {
            const group = getGroup(board, nr, nc);
            const liberties = countGroupLiberties(board, group[0][0], group[0][1]);
            if (liberties === 1) {
                // 救活连通的死子
                score += group.length * 5;
            }
        }
    }
    
    // 连接己方棋子
    let connections = 0;
    for (const [nr, nc] of getNeighbors(row, col)) {
        if (board[nr][nc] === color) {
            connections++;
        }
    }
    score += connections * 2;
    
    // 位置价值（中央比角落更有价值）
    const posScore = (8 - Math.abs(row - 4)) + (8 - Math.abs(col - 4));
    score += posScore;
    
    // AI偏好：优先占据要点
    if (isAI) {
        // 星位和天元
        if ((row === 2 || row === 6) && (col === 2 || col === 6)) {
            score += 3; // 星位
        }
        if (row === 4 && col === 4) {
            score += 5; // 天元
        }
    }
    
    // 边界惩罚
    if (row === 0 || row === 8 || col === 0 || col === 8) {
        score -= 1;
    }
    
    return score;
}

// 简单AI：随机选择
function aiMoveEasy(board, color) {
    const validMoves = getAllValidMoves(board, color);
    if (validMoves.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
}

// 中等AI：优先吃子、连接、有一定策略
function aiMoveMedium(board, color) {
    const validMoves = getAllValidMoves(board, color);
    if (validMoves.length === 0) return null;
    
    let bestMove = validMoves[0];
    let bestScore = -Infinity;
    
    for (const move of validMoves) {
        const score = evaluateMove(board, move.row, move.col, color, false);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    // 有30%概率选择次优着法（增加变化）
    if (validMoves.length > 2) {
        const topMoves = validMoves.filter(m => {
            const s = evaluateMove(board, m.row, m.col, color, false);
            return s >= bestScore - 3;
        });
        if (topMoves.length > 1 && Math.random() < 0.3) {
            bestMove = topMoves[Math.floor(Math.random() * topMoves.length)];
        }
    }
    
    return bestMove;
}

// 困难AI：更深入的评估
function aiMoveHard(board, color) {
    const validMoves = getAllValidMoves(board, color);
    if (validMoves.length === 0) return null;
    
    let bestMove = validMoves[0];
    let bestScore = -Infinity;
    
    for (const move of validMoves) {
        // 模拟落子后的局面
        const tempBoard = copyBoard(board);
        const result = makeMove(tempBoard, move.row, move.col, color);
        if (!result.success) continue;
        
        let score = 0;
        
        // 基础评估
        score += evaluateMove(board, move.row, move.col, color, true) * 1.5;
        
        // 模拟对手的反应
        const opponentMoves = getAllValidMoves(result.board, color === BLACK ? WHITE : BLACK);
        if (opponentMoves.length > 0) {
            // 评估对手最佳应对
            let worstCase = Infinity;
            for (const oppMove of opponentMoves) {
                const oppScore = evaluateMove(result.board, oppMove.row, oppMove.col, 
                    color === BLACK ? WHITE : BLACK, false);
                if (oppScore < worstCase) {
                    worstCase = oppScore;
                }
            }
            // 对手应对越差，当前选择越好
            score += (10 - worstCase) * 0.5;
        }
        
        // 棋盘控制力
        score += evaluateBoardControl(result.board, color);
        
        // 位置优先级
        if ((move.row === 2 || move.row === 6) && (move.col === 2 || move.col === 6)) {
            score += 2;
        }
        if (move.row === 4 && move.col === 4) {
            score += 3;
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    return bestMove;
}

// 评估棋盘控制力
function evaluateBoardControl(board, color) {
    let control = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === color) {
                // 每颗棋子根据位置贡献控制力
                control += 1;
                // 中央位置贡献更大
                control += (8 - Math.abs(r - 4) + 8 - Math.abs(c - 4)) * 0.1;
            }
        }
    }
    return control;
}

// 主AI函数
function getAIMove(board, color, difficulty = AI_LEVEL.MEDIUM) {
    switch (difficulty) {
        case AI_LEVEL.EASY:
            return aiMoveEasy(board, color);
        case AI_LEVEL.MEDIUM:
            return aiMoveMedium(board, color);
        case AI_LEVEL.HARD:
            return aiMoveHard(board, color);
        default:
            return aiMoveMedium(board, color);
    }
}
