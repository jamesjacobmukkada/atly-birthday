import React, { useEffect, useState, useRef } from 'react'
import './Landing.css'

const BIRTHDAY = new Date('2026-06-15T00:00:00')

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

const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  left: `${(i * 37.3 + 11) % 100}%`,
  top: `${(i * 53.7 + 7) % 100}%`,
  delay: `${(i * 0.17) % 3}s`,
  size: `${(i % 2) + 1}px`,
}))

export default function Landing({ onNavigate, gameUnlocked }) {
  const [countdown, setCountdown] = useState(getCountdown())
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getCountdown()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const g = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 150)
    }, 4000)
    return () => clearInterval(g)
  }, [])

  return (
    <div className="landing">
      <div className="scanlines" />

      <div className="stars">
        {STARS.map(s => (
          <div key={s.id} className="star" style={{
            left: s.left, top: s.top,
            animationDelay: s.delay,
            width: s.size, height: s.size,
          }} />
        ))}
      </div>

      <div className="landing-content">
        <div className="warning-tape">⚠ CLASSIFIED: DO NOT SHOW ATLY ⚠</div>

        <div className={`title-block ${glitch ? 'glitch' : ''}`}>
          <div className="age-badge">30</div>
          <h1 className="main-title">
            <span className="title-line1">HAPPY</span>
            <span className="title-line2">BIRTHDAY</span>
            <span className="title-line3">ATLY</span>
          </h1>
          <div className="subtitle">aka the most kona man in Kerala</div>
        </div>

        <div className="story-box">
          <div className="story-label">// SITUATION REPORT //</div>
          <p>
            Our dear Atly Yesudas has officially completed <strong>30 years</strong> on this planet.
            Three decades of unsolicited legal opinions, unnecessarily complicated explanations,
            sarcastic keyboard solos, and sentences that take 4 minutes to get to the point.
          </p>
          <br />
          <p>
            Today, he faces his greatest challenge yet: <strong>escaping 30 years of his own nonsense.</strong>
          </p>
          <br />
          <p className="highlight-text">
            Mission: Help Atly escape a maze of his own iconic quotes, legendary konaness,
            and the chaos only a lawyer-musician from Kerala could create.
          </p>
        </div>

        <div className="roles-row">
          <div className="role-chip">⚖️ Lawyer</div>
          <div className="role-chip">🎹 Keyboardist</div>
          <div className="role-chip">🎵 Composer</div>
          <div className="role-chip">🗣️ World-class Kona</div>
        </div>

        <div className="cta-section">
          <div className="cta-label">YOUR MISSION, SHOULD YOU ACCEPT IT:</div>
          <button className="btn-primary" onClick={() => onNavigate('submit')}>
            DROP YOUR ATLY QUOTE →
          </button>
          <div className="cta-sub">Submit the most iconic thing he's ever said or done</div>

          {gameUnlocked ? (
            <button className="btn-secondary" onClick={() => onNavigate('game')} style={{ marginTop: '1rem' }}>
              🎮 PLAY THE ESCAPE GAME (LIVE!)
            </button>
          ) : (
            countdown && (
              <div className="countdown-block">
                <div className="countdown-label">🔒 GAME UNLOCKS IN</div>
                <div className="countdown-digits">
                  <div className="cd-unit"><span>{String(countdown.d).padStart(2,'0')}</span><label>days</label></div>
                  <div className="cd-sep">:</div>
                  <div className="cd-unit"><span>{String(countdown.h).padStart(2,'0')}</span><label>hrs</label></div>
                  <div className="cd-sep">:</div>
                  <div className="cd-unit"><span>{String(countdown.m).padStart(2,'0')}</span><label>min</label></div>
                  <div className="cd-sep">:</div>
                  <div className="cd-unit"><span>{String(countdown.s).padStart(2,'0')}</span><label>sec</label></div>
                </div>
                <div className="countdown-note">on June 15th — Atly's 30th birthday</div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
