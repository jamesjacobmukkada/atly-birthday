import React, { useEffect, useRef, useState } from 'react'
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

function drawPlayer(ctx, x, y, size, frame) {
  const cx = x + size / 2
  const cy = y + size / 2 + Math.sin(frame * 0.15) * 1.5
  ctx.save()
  ctx.translate(cx, cy)
  ctx.fillStyle = '#1a3a5c'
  ctx.fillRect(-size * 0.25, -size * 0.05, size * 0.5, size * 0.45)
  ctx.fillStyle = '#e8304a'
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.05)
  ctx.lineTo(-4, size * 0.2)
  ctx.lineTo(0, size * 0.25)
  ctx.lineTo(4, size * 0.2)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#f5c8a0'
  ctx.beginPath()
  ctx.arc(0, -size * 0.2, size * 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1a1a2e'
  ctx.beginPath()
  ctx.arc(0, -size * 0.3, size * 0.18, Math.PI, 0)
  ctx.fill()
  ctx.fillStyle = '#f5c842'
  ctx.beginPath()
  ctx.arc(-size * 0.28, size * 0.3, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#f5c842'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(-size * 0.28, size * 0.3)
  ctx.lineTo(-size * 0.28, size * 0.42)
  ctx.stroke()
  ctx.restore()
}

function drawGoal(ctx, frame) {
  const gx = (COLS - 2) * TILE
  const gy = (ROWS - 2) * TILE
  const cx = gx + TILE / 2
  const cy = gy + TILE / 2
  ctx.save()
  ctx.fillStyle = 'rgba(245,200,66,0.15)'
  ctx.fillRect(gx + 4, gy + 4, TILE - 8, TILE - 8)
  ctx.strokeStyle = '#f5c842'
  ctx.lineWidth = 2
  ctx.strokeRect(gx + 4, gy + 4, TILE - 8, TILE - 8)
  ctx.fillStyle = '#f5c842'
  ctx.font = '18px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🏁', cx, cy)
  ctx.restore()
}

function drawObstacle(ctx, obs) {
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.75)'
  ctx.fillRect(obs.x + 2, obs.y + 2, obs.w, obs.h)
  ctx.fillStyle = obs.color
  ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 10px monospace'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(obs.text, obs.x + 8, obs.y + obs.h / 2)
  ctx.restore()
}

export default function Game({ onNavigate }) {
  const canvasRef = useRef(null)
  const gameRef = useRef({
    running: false,
    maze: buildMaze(),
    px: 1, py: 1,
    frame: 0,
    obstacles: [],
    quotes: [...FALLBACK_QUOTES],
    score: 0,
    hits: 0,
    spawnTimer: 0,
    spawnInterval: 150,
    lastMove: 0,
    inp: { up: false, down: false, left: false, right: false },
  })
  const rafRef = useRef(null)
  const [screen, setScreen] = useState('intro')
  const [score, setScore] = useState(0)
  const [hits, setHits] = useState(0)

  useEffect(() => {
    supabase.from('quotes').select('quote').limit(60).then(({ data }) => {
      if (data && data.length > 0) {
        gameRef.current.quotes = [...data.map(d => d.quote), ...FALLBACK_QUOTES]
      }
    })
  }, [])

  useEffect(() => {
    const onDown = (e) => {
      const g = gameRef.current
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { g.inp.up = true; e.preventDefault() }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { g.inp.down = true; e.preventDefault() }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { g.inp.left = true; e.preventDefault() }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { g.inp.right = true; e.preventDefault() }
    }
    const onUp = (e) => {
      const g = gameRef.current
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') g.inp.up = false
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') g.inp.down = false
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') g.inp.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') g.inp.right = false
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  function startGame() {
    const g = gameRef.current
    g.maze = buildMaze()
    g.px = 1; g.py = 1
    g.frame = 0
    g.obstacles = []
    g.score = 0
    g.hits = 0
    g.spawnTimer = 0
    g.spawnInterval = 150
    g.lastMove = 0
    g.running = true
    g.inp = { up: false, down: false, left: false, right: false }
    setScore(0)
    setHits(0)
    setScreen('playing')
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    requestAnimationFrame(loop)
  }

  function loop() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const g = gameRef.current
    if (!g.running) return

    g.frame++
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, W, H)

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (g.maze[r][c] === 1) {
          ctx.fillStyle = '#1a1a2e'
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE)
          ctx.strokeStyle = '#0d0d1a'
          ctx.lineWidth = 1
          ctx.strokeRect(c * TILE, r * TILE, TILE, TILE)
        }
      }
    }

    drawGoal(ctx, g.frame)

    const now = Date.now()
    if (now - g.lastMove > 145) {
      let nx = g.px, ny = g.py
      if (g.inp.up) ny--
      if (g.inp.down) ny++
      if (g.inp.left) nx--
      if (g.inp.right) nx++
      if ((nx !== g.px || ny !== g.py) && nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && g.maze[ny][nx] === 0) {
        g.px = nx; g.py = ny; g.lastMove = now
      }
    }

    if (g.px === COLS - 2 && g.py === ROWS - 2) {
      g.running = false
      setScore(Math.floor(g.score))
      setScreen('won')
      return
    }

    g.spawnTimer++
    if (g.spawnTimer >= g.spawnInterval && g.quotes.length > 0) {
      g.spawnTimer = 0
      g.spawnInterval = Math.max(60, g.spawnInterval - 2)
      const q = g.quotes[Math.floor(Math.random() * g.quotes.length)]
      const text = q.length > 30 ? q.slice(0, 30) + '...' : q
      g.obstacles.push({
        text, x: W + 10, y: Math.random() * (H - 50) + 20,
        speed: 1.3 + Math.random() * 1.1,
        w: Math.min(text.length * 7 + 20, 240), h: 26,
        color: ['#f5c842','#2ee8c0','#e8304a','#a855f7'][Math.floor(Math.random() * 4)],
        active: true,
      })
    }

    g.obstacles = g.obstacles.filter(o => o.x + o.w > -10)
    for (const o of g.obstacles) {
      o.x -= o.speed
      drawObstacle(ctx, o)
      if (o.active) {
        const cx = g.px * TILE + TILE / 2
        const cy = g.py * TILE + TILE / 2
        if (cx > o.x && cx < o.x + o.w && cy > o.y && cy < o.y + o.h) {
          o.active = false
          g.hits++
          g.score = Math.max(0, g.score - 10)
          setHits(g.hits)
          if (g.hits >= 5) {
            g.running = false
            setScore(Math.floor(g.score))
            setScreen('lost')
            return
          }
        }
      }
    }

    g.score += 0.02
    if (g.frame % 30 === 0) setScore(Math.floor(g.score))

    drawPlayer(ctx, g.px * TILE, g.py * TILE, TILE, g.frame)
    rafRef.current = requestAnimationFrame(loop)
  }

  const dpad = (dir, down) => {
    const g = gameRef.current
    g.inp.up = false; g.inp.down = false; g.inp.left = false; g.inp.right = false
    if (down && dir) g.inp[dir] = true
  }

  return (
    <div className="game-page">
      <div className="game-inner">
        <div className="game-topbar">
          <button className="back-btn" onClick={() => { gameRef.current.running = false; onNavigate('landing') }}>← EXIT</button>
          <div className="game-title-bar">ATLY'S GREAT ESCAPE — 30TH BIRTHDAY EDITION</div>
          <div className="game-stats">
            <span className="stat">SCORE: {score}</span>
            <span className="stat hits">HITS: {hits}/5</span>
          </div>
        </div>

        <div className="canvas-wrap">
          <canvas ref={canvasRef} width={W} height={H} className="game-canvas" />

          {screen === 'intro' && (
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
                <button className="play-btn" onClick={startGame}>START THE ESCAPE →</button>
              </div>
            </div>
          )}

          {screen === 'lost' && (
            <div className="overlay">
              <div className="overlay-box red">
                <div className="overlay-tag">// MISSION FAILED //</div>
                <h2>CAUGHT BY HIS OWN WORDS</h2>
                <p>5 quotes hit Atly. He couldn't escape his own konaness.</p>
                <div className="final-score">FINAL SCORE: {score}</div>
                <button className="play-btn" onClick={startGame}>TRY AGAIN →</button>
              </div>
            </div>
          )}

          {screen === 'won' && (
            <div className="overlay">
              <div className="overlay-box gold">
                <div className="overlay-tag">// MISSION COMPLETE //</div>
                <h2>ATLY ESCAPES! 🎉</h2>
                <p>He survived 30 years of himself. Barely.</p>
                <div className="final-score">SCORE: {score}</div>
                <div className="win-message">Happy 30th Birthday, Atly! ❤️<br />From all of us who love-hate your konaness.</div>
                <button className="play-btn" onClick={startGame}>PLAY AGAIN →</button>
              </div>
            </div>
          )}
        </div>

        <div className="dpad">
          <div className="dpad-row">
            <button className="dpad-btn" onPointerDown={() => dpad('up', true)} onPointerUp={() => dpad('up', false)}>↑</button>
          </div>
          <div className="dpad-row">
            <button className="dpad-btn" onPointerDown={() => dpad('left', true)} onPointerUp={() => dpad('left', false)}>←</button>
            <button className="dpad-btn center" />
            <button className="dpad-btn" onPointerDown={() => dpad('right', true)} onPointerUp={() => dpad('right', false)}>→</button>
          </div>
          <div className="dpad-row">
            <button className="dpad-btn" onPointerDown={() => dpad('down', true)} onPointerUp={() => dpad('down', false)}>↓</button>
          </div>
        </div>

        <div className="game-footer">
          <button className="footer-link" onClick={() => { gameRef.current.running = false; onNavigate('submit') }}>← ADD MORE QUOTES</button>
        </div>
      </div>
    </div>
  )
}
