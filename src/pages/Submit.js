import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import './Submit.css'

const BIRTHDAY = new Date('2026-06-15T00:00:00')

const PLACEHOLDERS = [
  '"Atly explaining why the traffic jam was actually the government\'s fault..."',
  '"Atly disagreeing with the restaurant\'s menu choices legally..."',
  '"Atly\'s 15-minute answer to a yes/no question..."',
  '"That time Atly played one chord and called it a composition..."',
  '"Atly citing case law during an argument about chai..."',
]

function getCountdown() {
  const now = new Date()
  const diff = BIRTHDAY - now
  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { d, h, m, s }
}

export default function Submit({ onNavigate, gameUnlocked }) {
  const [quote, setQuote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(getCountdown())
  const [placeholder] = useState(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)])

  useEffect(() => {
    fetchQuotes()
    const timer = setInterval(() => setCountdown(getCountdown()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function fetchQuotes() {
    const { data } = await supabase
      .from('quotes')
      .select('quote, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setQuotes(data)
  }

  async function handleSubmit() {
    const trimmed = quote.trim()
    if (!trimmed) return
    if (trimmed.length < 5) { setError('Too short! Give us the full kona energy.'); return }
    if (trimmed.length > 300) { setError('Even Atly doesn\'t talk THAT long. Max 300 chars.'); return }
    setError('')
    setLoading(true)
    const { error: err } = await supabase.from('quotes').insert([{ quote: trimmed }])
    setLoading(false)
    if (err) {
      setError('Something went wrong. Try again!')
      return
    }
    setSubmitted(true)
    setQuote('')
    fetchQuotes()
  }

  return (
    <div className="submit-page">
      <div className="scanlines" />
      <div className="submit-content">
        <button className="back-btn" onClick={() => onNavigate('landing')}>← BACK</button>

        <div className="submit-header">
          <div className="page-tag">// INTEL SUBMISSION //</div>
          <h2 className="submit-title">What has Atly said<br />that cannot be unsaid?</h2>
          <p className="submit-desc">
            Drop his most iconic quote, legendary kona moment, or a roast he deserves.
            These will become the obstacles in his escape game. Choose wisely. Choose savagely.
          </p>
        </div>

        {!submitted ? (
          <div className="form-block">
            <div className="char-count">{quote.length} / 300</div>
            <textarea
              className="quote-input"
              value={quote}
              onChange={e => setQuote(e.target.value.slice(0, 300))}
              placeholder={placeholder}
              rows={4}
            />
            {error && <div className="error-msg">{error}</div>}
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={loading || !quote.trim()}
            >
              {loading ? 'LAUNCHING...' : 'FIRE QUOTE INTO THE VOID →'}
            </button>
          </div>
        ) : (
          <div className="success-block">
            <div className="success-icon">🎯</div>
            <h3>Quote registered.</h3>
            <p>Atly will dodge this on June 15th. We hope he suffers.</p>
            <button className="submit-btn outline" onClick={() => setSubmitted(false)}>
              ADD ANOTHER QUOTE
            </button>
          </div>
        )}

        <div className="countdown-teaser">
          {gameUnlocked ? (
            <div className="game-live">
              <div className="live-dot" />
              <span>GAME IS LIVE! </span>
              <button className="inline-link" onClick={() => onNavigate('game')}>Play now →</button>
            </div>
          ) : countdown ? (
            <>
              <div className="teaser-label">🔒 GAME UNLOCKS ON JUNE 15TH IN</div>
              <div className="cd-mini">
                <span>{String(countdown.d).padStart(2,'0')}d</span>
                <span>{String(countdown.h).padStart(2,'0')}h</span>
                <span>{String(countdown.m).padStart(2,'0')}m</span>
                <span>{String(countdown.s).padStart(2,'0')}s</span>
              </div>
            </>
          ) : null}
        </div>

        <div className="quotes-wall">
          <div className="wall-header">
            <span className="wall-label">// SUBMITTED INTEL — {quotes.length} QUOTES SO FAR //</span>
          </div>
          {quotes.length === 0 ? (
            <div className="empty-wall">No quotes yet. Be the first to roast him.</div>
          ) : (
            <div className="quotes-grid">
              {quotes.map((q, i) => (
                <div key={i} className={`quote-card level-${(i % 3) + 1}`}>
                  <div className="quote-num">#{String(quotes.length - i).padStart(2,'0')}</div>
                  <p className="quote-text">"{q.quote}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
