import React, { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../supabase'
import './Game.css'

const W = 600
const H = 500
const TILE = 40
const COLS = W / TILE
const ROWS = H / TILE

const FALLBACK_QUOTES = [
  "Actually, from a legal standpoint...",
  "No but hear me out...",
  "As a musician I would say...",
  "Let me explain why you're wrong",
  "Technically speaking...",
  "I have a different perspective",
  "That's not how law works",
  "On the contrary...",
  "My point is, and I say this with respect...",
  "Allow me to elaborate at length",
]

function buildMaze() {
  const maze = Array.from({ length: ROWS }, () => Array(COLS).fill(1))
  function carve(r, c) {
    const dirs = [[0,2],[2,0],[0,-2],[-2,0]].sort(() => Math.random() - 0.5)
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc
      if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1 && maze[nr][nc] === 1) {
        maze[r + dr/2][c + dc/2] = 0
        maze[nr][nc] = 0
        carve(nr, nc)
      }
    }
  }
  maze[1][1] = 0
  carve(1, 1)
  maze[ROWS - 2][COLS - 2] = 0
  return maze
}

const PLAYER_COLORS = { suit: '#1a3a5c', tie: '#e8304a', skin: '#f5c8a0', hair: '#1a1a2e', keys: '#f5c842' }

function drawPlayer(ctx, x, y, size, frame) {
  const cx = x + size / 2
  const cy = y + size / 2
  const bob = Math.sin(frame * 0.15) * 1.5

  ctx.save()
  ctx.translate(cx, cy + bob)

  ctx.fillStyle = PLAYER_COLORS.suit
  ctx.fillRect(-size * 0.25, -size * 0.05, size * 0.5, size * 0.45)

  ctx.fillStyle = PLAYER_COLORS.tie
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.05)
  ctx.lineTo(-4, size * 0.2)
  ctx.lineTo(0, size * 0.25)
  ctx.lineTo(4, size * 0.2)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = PLAYER_COLORS.skin
  ctx.beginPath()
  ctx.arc(0, -size * 0.2, size * 0.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = PLAYER_COLORS.hair
  ctx.beginPath()
  ctx.arc(0, -size * 0.3, size * 0.18, Math.PI, 0)
  ctx.fill()

  ctx.fillStyle = PLAYER_COLORS.keys
  ctx.beginPath()
  ctx.arc(-size * 0.28, size * 0.3, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = PLAYER_COLORS.keys
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(-size * 0.28, size * 0.3)
  ctx.lineTo(-size * 0.28, size * 0.42)
  ctx.stroke()

  ctx.restore()
}

function drawGoal(ctx, gx, gy, frame) {
  const cx = gx * TILE + TILE / 2
  const cy = gy * TILE + TILE / 2
  const pulse = Math.sin(frame * 0.08) * 3

  ctx.save()
  ctx.strokeStyle = '#f5c842'
  ctx.lineWidth = 2
  ctx.strokeRect(gx * TILE + 4, gy * TILE + 4, TILE - 8, TILE - 8)

  ctx.fillStyle = 'rgba(245,200,66,0.15)'
  ctx.fillRect(gx * TILE + 4, gy * TILE + 4, TILE - 8, TILE - 8)

  ctx.fillStyle = '#f5c842'
  ctx.font = `bold ${16 + pulse / 3}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🏁', cx, cy)
  ctx.restore()
}

class QuoteObstacle {
  constructor(quote, canvasW, canvasH) {
    this.quote = quote.length > 30 ? quote.slice(0, 30) + '...' : quote
    this.x = canvasW + 20
    this.y = Math.random() * (canvasH - 60) + 20
    this.speed = 1.2 + Math.random() * 1.2
    this.w = Math.min(this.quote.length * 7 + 20, 260)
    this.h = 28
    this.color = ['#f5c842', '#2ee8c0', '#e8304a', '#a855f7'][Math.floor(Math.random() * 4)]
    this.active = true
  }

  update() { this.x -= this.speed }
  isDead() { return this.x + this.w < -20 }

  draw(ctx) {
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.fillRect(this.x + 2, this.y + 2, this.w, this.h)

    ctx.fillStyle = this.color
    ctx.fillRect(this.x, this.y, this.w, this.h)

    ctx.fillStyle = '#000'
    ctx.font = 'bold 10px Space Mono, monospace'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillText(this.quote, this.x + 8, this.y + this.h / 2)
    ctx.restore()
  }

  hits(px, py, ps) {
    const cx = px + ps / 2, cy = py + ps / 2
    return cx > this.x && cx < this.x + this.w && cy > this.y && cy < this.y + this.h
  }
}

export default function Game({ onNavigate }) {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    maze: buildMaze(),
    px: 1, py: 1,
    px_float: TILE, py_float: TILE,
    frame: 0,
    obstacles: [],
    quotes: [],
    score: 0,
    hits: 0,
    gameOver: false,
    won: false,
    spawnTimer: 0,
    spawnInterval: 150,
    started: false,
    keys: {},
    lastMove: 0,
  })
  const [uiState, setUiState] = useState({ score: 0, hits: 0, gameOver: false, won: false, started: false })
  const animRef = useRef(null)
  const inputRef = useRef({ up: false, down: false, left: false, right: false })

  useEffect(() => {
    async function fetchQuotes() {
      const { data } = await supabase.from('quotes').select('quote').limit(60)
      const q = data && data.length > 0 ? data.map(d => d.quote) : FALLBACK_QUOTES
      stateRef.current.quotes = [...q, ...FALLBACK_QUOTES]
    }
    fetchQuotes()
  }, [])

  const handleKey = useCallback((e, down) => {
    const map = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
      W: 'up', S: 'down', A: 'left', D: 'right',
    }
    if (map[e.key]) {
      inputRef.current[map[e.key]] = down
      if (down) e.preventDefault()
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', e => handleKey(e, true))
    window.addEventListener('keyup', e => handleKey(e, false))
    return () => {
      window.removeEventListener('keydown', e => handleKey(e, true))
      window.removeEventListener('keyup', e => handleKey(e, false))
    }
  }, [handleKey])

  function resetGame() {
    const s = stateRef.current
    s.maze = buildMaze()
    s.px = 1; s.py = 1
    s.px_float = TILE; s.py_float = TILE
    s.frame = 0
    s.obstacles = []
    s.score = 0
    s.hits = 0
    s.gameOver = false
    s.won = false
    s.spawnTimer = 0
    s.started = true
    setUiState({ score: 0, hits: 0, gameOver: false, won: false, started: true })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function gameLoop() {
      const s = stateRef.current
      if (!s.started) { animRef.current = requestAnimationFrame(gameLoop); return }
      s.frame++

      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, W, H)

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (s.maze[r][c] === 1) {
            ctx.fillStyle = '#1a1a2e'
            ctx.fillRect(c * TILE, r * TILE, TILE, TILE)
            ctx.strokeStyle = '#0d0d1a'
            ctx.lineWidth = 1
            ctx.strokeRect(c * TILE, r * TILE, TILE, TILE)
          }
        }
      }

      const gx = COLS - 2, gy = ROWS - 2
      drawGoal(ctx, gx, gy, s.frame)

      if (!s.gameOver && !s.won) {
        const now = Date.now()
        const moveDelay = 140
        if (now - s.lastMove > moveDelay) {
          const inp = inputRef.current
          let nx = s.px, ny = s.py
          if (inp.up) ny--
          if (inp.down) ny++
          if (inp.left) nx--
          if (inp.right) nx++

          if ((nx !== s.px || ny !== s.py) && nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && s.maze[ny][nx] === 0) {
            s.px = nx; s.py = ny
            s.lastMove = now
          }
        }

        if (s.px === gx && s.py === gy) {
          s.won = true
          setUiState(u => ({ ...u, won: true, score: s.score }))
        }

        s.spawnTimer++
        if (s.spawnTimer >= s.spawnInterval && s.quotes.length > 0) {
          s.spawnTimer = 0
          s.spawnInterval = Math.max(60, s.spawnInterval - 2)
          const q = s.quotes[Math.floor(Math.random() * s.quotes.length)]
          s.obstacles.push(new QuoteObstacle(q, W, H))
        }

        s.obstacles = s.obstacles.filter(o => !o.isDead())
        for (const o of s.obstacles) {
          o.update()
          o.draw(ctx)
          if (o.active && o.hits(s.px * TILE, s.py * TILE, TILE)) {
            o.active = false
            s.hits++
            s.score = Math.max(0, s.score - 10)
            if (s.hits >= 5) {
              s.gameOver = true
              setUiState(u => ({ ...u, gameOver: true, hits: s.hits, score: s.score }))
            } else {
              setUiState(u => ({ ...u, hits: s.hits, score: s.score }))
            }
          }
        }

        s.score += 0.02
        if (s.frame % 30 === 0) setUiState(u => ({ ...u, score: Math.floor(s.score) }))
      }

      drawPlayer(ctx, s.px * TILE, s.py * TILE, TILE, s.frame)

      animRef.current = requestAnimationFrame(gameLoop)
    }

    animRef.current = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const touchDir = (dir, down) => {
    inputRef.current.up = false
    inputRef.current.down = false
    inputRef.current.left = false
    inputRef.current.right = false
    if (down && dir) inputRef.current[dir] = true
  }

  return (
    <div className="game-page">
      <div className="scanlines" />
      <div className="game-inner">
        <div className="game-topbar">
          <button className="back-btn" onClick={() => onNavigate('landing')}>← EXIT</button>
          <div className="game-title-bar">ATLY'S GREAT ESCAPE — 30TH BIRTHDAY EDITION</div>
          <div className="game-stats">
            <span className="stat">SCORE: {Math.floor(uiState.score)}</span>
            <span className="stat hits">HITS: {uiState.hits}/5</span>
          </div>
        </div>

        <div className="canvas-wrap">
          <canvas ref={canvasRef} width={W} height={H} className="game-canvas" />

          {!uiState.started && (
            <div className="overlay">
              <div className="overlay-box">
                <div className="overlay-tag">// MISSION BRIEFING //</div>
                <h2>ATLY'S GREAT ESCAPE</h2>
                <div className="overlay-sub">Atly must escape the maze of his own making.</div>
                <div className="instructions">
                  <div>🕹️ Arrow keys or WASD to move</div>
                  <div>🚀 Reach the 🏁 flag to win</div>
                  <div>💬 Dodge flying quotes — 5 hits = GAME OVER</div>
                  <div>📱 Mobile: Use the D-pad below</div>
                </div>
                <button className="play-btn" onClick={resetGame}>START THE ESCAPE →</button>
              </div>
            </div>
          )}

          {uiState.started && uiState.gameOver && (
            <div className="overlay">
              <div className="overlay-box red">
                <div className="overlay-tag">// MISSION FAILED //</div>
                <h2>CAUGHT BY HIS OWN WORDS</h2>
                <p>5 quotes hit Atly. He couldn't escape his own konaness.</p>
                <div className="final-score">FINAL SCORE: {Math.floor(uiState.score)}</div>
                <button className="play-btn" onClick={resetGame}>TRY AGAIN →</button>
              </div>
            </div>
          )}

          {uiState.started && uiState.won && (
            <div className="overlay">
              <div className="overlay-box gold">
                <div className="overlay-tag">// MISSION COMPLETE //</div>
                <h2>ATLY ESCAPES! 🎉</h2>
                <p>He survived 30 years of himself. Barely.</p>
                <div className="final-score">SCORE: {Math.floor(uiState.score)}</div>
                <div className="win-message">Happy 30th Birthday, Atly! ❤️<br />From all of us who love-hate your konaness.</div>
                <button className="play-btn" onClick={resetGame}>PLAY AGAIN →</button>
              </div>
            </div>
          )}
        </div>

        <div className="dpad">
          <div className="dpad-row">
            <button className="dpad-btn" onPointerDown={() => touchDir('up', true)} onPointerUp={() => touchDir('up', false)}>↑</button>
          </div>
          <div className="dpad-row">
            <button className="dpad-btn" onPointerDown={() => touchDir('left', true)} onPointerUp={() => touchDir('left', false)}>←</button>
            <button className="dpad-btn center" />
            <button className="dpad-btn" onPointerDown={() => touchDir('right', true)} onPointerUp={() => touchDir('right', false)}>→</button>
          </div>
          <div className="dpad-row">
            <button className="dpad-btn" onPointerDown={() => touchDir('down', true)} onPointerUp={() => touchDir('down', false)}>↓</button>
          </div>
        </div>

        <div className="game-footer">
          <button className="footer-link" onClick={() => onNavigate('submit')}>← ADD MORE QUOTES</button>
        </div>
      </div>
    </div>
  )
}
