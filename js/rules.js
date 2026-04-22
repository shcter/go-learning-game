// 围棋规则判断模块

const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const BOARD_SIZE = 9;

// 获取棋子颜色名称
function colorName(color) {
    return color === BLACK ? '黑' : '白';
}

// 复制棋盘状态
function copyBoard(board) {
    return board.map(row => [...row]);
}

// 获取邻居位置
function getNeighbors(row, col) {
    const neighbors = [];
    if (row > 0) neighbors.push([row - 1, col]);
    if (row < BOARD_SIZE - 1) neighbors.push([row + 1, col]);
    if (col > 0) neighbors.push([row, col - 1]);
    if (col < BOARD_SIZE - 1) neighbors.push([row, col + 1]);
    return neighbors;
}

// 计算一口气的位置（用于检测）
function getLibertyPositions(board, row, col, visited = new Set()) {
    const key = `${row},${col}`;
    if (visited.has(key)) return [];
    
    const color = board[row][col];
    if (color === EMPTY) {
        return [[row, col]];
    }
    
    visited.add(key);
    let liberties = [];
    
    for (const [nr, nc] of getNeighbors(row, col)) {
        if (board[nr][nc] === EMPTY) {
            liberties.push([nr, nc]);
        } else if (board[nr][nc] === color) {
            liberties = liberties.concat(getLibertyPositions(board, nr, nc, visited));
        }
    }
    
    return liberties;
}

// 计算棋子组的气数
function countGroupLiberties(board, row, col) {
    const color = board[row][col];
    if (color === EMPTY) return 0;
    
    const visited = new Set();
    const stack = [[row, col]];
    let liberties = new Set();
    
    while (stack.length > 0) {
        const [r, c] = stack.pop();
        const key = `${r},${c}`;
        if (visited.has(key)) continue;
        visited.add(key);
        
        for (const [nr, nc] of getNeighbors(r, c)) {
            if (board[nr][nc] === EMPTY) {
                liberties.add(`${nr},${nc}`);
            } else if (board[nr][nc] === color) {
                stack.push([nr, nc]);
            }
        }
    }
    
    return liberties.size;
}

// 获取棋子组
function getGroup(board, row, col) {
    const color = board[row][col];
    if (color === EMPTY) return [];
    
    const visited = new Set();
    const stack = [[row, col]];
    const group = [];
    
    while (stack.length > 0) {
        const [r, c] = stack.pop();
        const key = `${r},${c}`;
        if (visited.has(key)) continue;
        visited.add(key);
        
        if (board[r][c] === color) {
            group.push([r, c]);
            for (const [nr, nc] of getNeighbors(r, c)) {
                if (board[nr][nc] === color && !visited.has(`${nr},${nc}`)) {
                    stack.push([nr, nc]);
                }
            }
        }
    }
    
    return group;
}

// 检查落子是否合法
function isValidMove(board, row, col, color, skipKoCheck = false) {
    // 位置已有棋子
    if (board[row][col] !== EMPTY) {
        return { valid: false, reason: '该位置已有棋子' };
    }
    
    // 创建临时棋盘
    const tempBoard = copyBoard(board);
    tempBoard[row][col] = color;
    
    // 检查是否会自杀（无气）
    const neighbors = getNeighbors(row, col);
    let hasCapture = false;
    
    // 检查是否能吃掉对方棋子
    for (const [nr, nc] of neighbors) {
        if (tempBoard[nr][nc] === (color === BLACK ? WHITE : BLACK)) {
            if (countGroupLiberties(tempBoard, nr, nc) === 0) {
                hasCapture = true;
                // 移除被吃的棋子
                for (const [gr, gc] of getGroup(tempBoard, nr, nc)) {
                    tempBoard[gr][gc] = EMPTY;
                }
            }
        }
    }
    
    // 再次检查自己的棋子是否有气（自杀检查）
    if (countGroupLiberties(tempBoard, row, col) === 0) {
        if (!hasCapture) {
            return { valid: false, reason: '自杀禁手' };
        }
    }
    
    // 检查劫（需记录上一手棋盘状态）
    if (!skipKoCheck && window.game && window.game.history && window.game.history.length > 0) {
        const prevBoard = window.game.history[window.game.history.length - 1];
        if (compareBoards(tempBoard, prevBoard)) {
            return { valid: false, reason: '打劫禁手' };
        }
    }
    
    return { valid: true };
}

// 比较两个棋盘是否相同
function compareBoards(board1, board2) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board1[r][c] !== board2[r][c]) return false;
        }
    }
    return true;
}

// 获取可被提起的棋子组
function getCapturableGroups(board, color) {
    const opponent = color === BLACK ? WHITE : BLACK;
    const capturable = [];
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === opponent && countGroupLiberties(board, r, c) === 0) {
                capturable.push(getGroup(board, r, c));
            }
        }
    }
    
    return capturable;
}

// 执行落子并返回提子结果
function makeMove(board, row, col, color) {
    const validation = isValidMove(board, row, col, color);
    if (!validation.valid) {
        return { success: false, reason: validation.reason };
    }
    
    const newBoard = copyBoard(board);
    newBoard[row][col] = color;
    
    const captured = [];
    const opponent = color === BLACK ? WHITE : BLACK;
    
    // 检查并提走对方死子
    for (const [nr, nc] of getNeighbors(row, col)) {
        if (newBoard[nr][nc] === opponent) {
            if (countGroupLiberties(newBoard, nr, nc) === 0) {
                const group = getGroup(newBoard, nr, nc);
                for (const [gr, gc] of group) {
                    newBoard[gr][gc] = EMPTY;
                    captured.push([gr, gc]);
                }
            }
        }
    }
    
    return { success: true, board: newBoard, captured };
}

// 计算棋盘上双方的棋子数
function countStones(board) {
    let black = 0, white = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === BLACK) black++;
            else if (board[r][c] === WHITE) white++;
        }
    }
    return { black, white };
}
