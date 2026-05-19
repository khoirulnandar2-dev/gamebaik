const boardElement = document.getElementById('board');
const resetButton = document.getElementById('resetButton');
const turnLabel = document.getElementById('turnLabel');

const unicodePieces = {
  p: '♟︎',
  r: '♜',
  n: '♞',
  b: '♝',
  q: '♛',
  k: '♚',
  P: '♙',
  R: '♖',
  N: '♘',
  B: '♗',
  Q: '♕',
  K: '♔',
};

let board = [];
let selected = null;
let legalMoves = [];
let currentTurn = 'white';

function resetGame() {
  board = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
  ];
  selected = null;
  legalMoves = [];
  currentTurn = 'white';
  render();
}

function render() {
  boardElement.innerHTML = '';
  updateTurnLabel();

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `cell ${((row + col) % 2 === 0) ? 'white' : 'black'}`;
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute('aria-label', `Baris ${8 - row} Kolom ${String.fromCharCode(65 + col)}`);

      const square = board[row][col];
      if (square) {
        cell.textContent = unicodePieces[square] || square;
      }

      if (selected && selected.row === row && selected.col === col) {
        cell.classList.add('selected');
      }

      if (legalMoves.some(move => move.row === row && move.col === col)) {
        cell.classList.add('move-target');
      }

      cell.addEventListener('click', () => onCellClicked(row, col));
      boardElement.appendChild(cell);
    }
  }
}

function updateTurnLabel() {
  turnLabel.textContent = `Giliran: ${currentTurn === 'white' ? 'Putih' : 'Hitam'}`;
}

function onCellClicked(row, col) {
  const piece = board[row][col];
  const pieceColor = getPieceColor(piece);

  if (selected && legalMoves.some(move => move.row === row && move.col === col)) {
    movePiece(selected.row, selected.col, row, col);
    selected = null;
    legalMoves = [];
    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    render();
    return;
  }

  if (piece && pieceColor === currentTurn) {
    selected = { row, col };
    legalMoves = getValidMoves(row, col);
    render();
    return;
  }

  selected = null;
  legalMoves = [];
  render();
}

function movePiece(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = '';
}

function getPieceColor(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'white' : 'black';
}

function getValidMoves(row, col) {
  const piece = board[row][col];
  if (!piece) return [];

  const color = getPieceColor(piece);
  let moves = getPieceMoves(row, col, piece);

  return moves.filter(move => {
    const clone = cloneBoard(board);
    clone[move.row][move.col] = clone[row][col];
    clone[row][col] = '';
    return !isKingInCheck(clone, color);
  });
}

function getPieceMoves(row, col, piece) {
  const color = getPieceColor(piece);
  const moves = [];
  const directions = {
    N: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
    K: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
  };

  const addMove = (r, c) => {
    if (!isInBounds(r, c)) return;
    const target = board[r][c];
    if (!target || getPieceColor(target) !== color) {
      moves.push({ row: r, col: c });
    }
  };

  const addSlideMoves = (deltas) => {
    for (const [dr, dc] of deltas) {
      let r = row + dr;
      let c = col + dc;
      while (isInBounds(r, c)) {
        const target = board[r][c];
        if (!target) {
          moves.push({ row: r, col: c });
        } else {
          if (getPieceColor(target) !== color) {
            moves.push({ row: r, col: c });
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }
  };

  switch (piece.toLowerCase()) {
    case 'p': {
      const forward = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      const nextRow = row + forward;
      if (isInBounds(nextRow, col) && !board[nextRow][col]) {
        moves.push({ row: nextRow, col });
        if (row === startRow) {
          const jumpRow = row + forward * 2;
          if (isInBounds(jumpRow, col) && !board[jumpRow][col]) {
            moves.push({ row: jumpRow, col });
          }
        }
      }
      for (const dc of [-1, 1]) {
        const attackRow = row + forward;
        const attackCol = col + dc;
        if (isInBounds(attackRow, attackCol)) {
          const target = board[attackRow][attackCol];
          if (target && getPieceColor(target) !== color) {
            moves.push({ row: attackRow, col: attackCol });
          }
        }
      }
      break;
    }
    case 'r':
      addSlideMoves([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      break;
    case 'b':
      addSlideMoves([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
      break;
    case 'q':
      addSlideMoves([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
      break;
    case 'n':
      for (const [dr, dc] of directions.N) {
        addMove(row + dr, col + dc);
      }
      break;
    case 'k':
      for (const [dr, dc] of directions.K) {
        addMove(row + dr, col + dc);
      }
      break;
    default:
      break;
  }

  return moves.filter(move => {
    const target = board[move.row][move.col];
    return !target || getPieceColor(target) !== color;
  });
}

function isInBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function cloneBoard(source) {
  return source.map(row => [...row]);
}

function isKingInCheck(boardState, color) {
  const kingPiece = color === 'white' ? 'K' : 'k';
  let kingPosition = null;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if (boardState[row][col] === kingPiece) {
        kingPosition = { row, col };
        break;
      }
    }
    if (kingPosition) break;
  }

  if (!kingPosition) return true;

  const opponentColor = color === 'white' ? 'black' : 'white';
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = boardState[row][col];
      if (piece && getPieceColor(piece) === opponentColor) {
        const moves = getPieceMovesForState(row, col, piece, boardState);
        if (moves.some(move => move.row === kingPosition.row && move.col === kingPosition.col)) {
          return true;
        }
      }
    }
  }

  return false;
}

function getPieceMovesForState(row, col, piece, state) {
  const color = getPieceColor(piece);
  const moves = [];
  const directions = {
    N: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
    K: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
  };

  const addMove = (r, c) => {
    if (!isInBounds(r, c)) return;
    const target = state[r][c];
    if (!target || getPieceColor(target) !== color) {
      moves.push({ row: r, col: c });
    }
  };

  const addSlideMoves = (deltas) => {
    for (const [dr, dc] of deltas) {
      let r = row + dr;
      let c = col + dc;
      while (isInBounds(r, c)) {
        const target = state[r][c];
        if (!target) {
          moves.push({ row: r, col: c });
        } else {
          if (getPieceColor(target) !== color) {
            moves.push({ row: r, col: c });
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }
  };

  switch (piece.toLowerCase()) {
    case 'p': {
      const forward = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      const nextRow = row + forward;
      if (isInBounds(nextRow, col) && !state[nextRow][col]) {
        moves.push({ row: nextRow, col });
        if (row === startRow) {
          const jumpRow = row + forward * 2;
          if (isInBounds(jumpRow, col) && !state[jumpRow][col]) {
            moves.push({ row: jumpRow, col });
          }
        }
      }
      for (const dc of [-1, 1]) {
        const attackRow = row + forward;
        const attackCol = col + dc;
        if (isInBounds(attackRow, attackCol)) {
          const target = state[attackRow][attackCol];
          if (target && getPieceColor(target) !== color) {
            moves.push({ row: attackRow, col: attackCol });
          }
        }
      }
      break;
    }
    case 'r':
      addSlideMoves([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      break;
    case 'b':
      addSlideMoves([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
      break;
    case 'q':
      addSlideMoves([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
      break;
    case 'n':
      for (const [dr, dc] of directions.N) {
        addMove(row + dr, col + dc);
      }
      break;
    case 'k':
      for (const [dr, dc] of directions.K) {
        addMove(row + dr, col + dc);
      }
      break;
    default:
      break;
  }

  return moves;
}

resetButton.addEventListener('click', resetGame);
resetGame();
