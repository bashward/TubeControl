import { useState } from 'react'
import styles from '@/styles/PairingModal.module.css'

interface PairingModalProps {
  isConnected: boolean
  onPair: (roomCode: string) => void
}

export default function PairingModal({ isConnected, onPair }: PairingModalProps) {
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      setError('Not connected to server. Please check your connection.')
      return
    }

    if (!/^\d{6}$/.test(roomCode)) {
      setError('Room code must be 6 digits')
      return
    }

    onPair(roomCode)
    setError('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setRoomCode(value)
    setError('')
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h1 className={styles.logo}>🎮 TubeControl</h1>
          <p className={styles.tagline}>Control YouTube from your phone</p>
        </div>

        <div className={styles.status}>
          <div className={`${styles.statusDot} ${isConnected ? styles.connected : ''}`} />
          <span className={styles.statusText}>
            {isConnected ? 'Connected to server' : 'Connecting...'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="roomCode" className={styles.label}>
            Enter Room Code
          </label>

          <input
            id="roomCode"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="000000"
            value={roomCode}
            onChange={handleInputChange}
            className={styles.input}
            maxLength={6}
            autoFocus
          />

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          <button
            type="submit"
            className={styles.button}
            disabled={!isConnected || roomCode.length !== 6}
          >
            Connect
          </button>
        </form>

        <div className={styles.instructions}>
          <h3>How to connect:</h3>
          <ol>
            <li>Install the TubeControl browser extension</li>
            <li>Click the extension icon in your browser</li>
            <li>Enter the 6-digit code shown in the extension</li>
            <li>Start controlling YouTube!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
