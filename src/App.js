import React, { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import Submit from './pages/Submit'
import Game from './pages/Game'
import './App.css'

const BIRTHDAY = new Date('2026-06-15T00:00:00')

function App() {
  const [page, setPage] = useState('game')
  const [gameUnlocked, setGameUnlocked] = useState(false)

  useEffect(() => {
    const now = new Date()
    if (now >= BIRTHDAY) setGameUnlocked(true)
    const hash = window.location.hash
    if (hash === '#submit') setPage('submit')
    if (hash === '#game') setPage('game')
  }, [])

  const navigate = (p) => {
    setPage(p)
    window.location.hash = p === 'landing' ? '' : p
    window.scrollTo(0, 0)
  }

  return (
    <div className="app">
  <h1 style={{color:'red'}}>TEST VERSION</h1>
      {page === 'landing' && <Landing onNavigate={navigate} gameUnlocked={gameUnlocked} />}
      {page === 'submit' && <Submit onNavigate={navigate} gameUnlocked={gameUnlocked} />}
      {page === 'game' && <Game onNavigate={navigate} />}
    </div>
  )
}

export default App
