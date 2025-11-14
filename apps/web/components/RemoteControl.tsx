import { useState, useEffect } from 'react'
import styles from '@/styles/RemoteControl.module.css'

interface PlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  title: string
  channelName: string
}

interface RemoteControlProps {
  playerState: PlayerState
  onCommand: (action: string, payload?: any) => void
  onDisconnect?: () => void
}

export default function RemoteControl({ playerState, onCommand, onDisconnect }: RemoteControlProps) {
  const [localVolume, setLocalVolume] = useState(playerState.volume)
  const [isSeeking, setIsSeeking] = useState(false)
  const [localSeekTime, setLocalSeekTime] = useState(0)

  useEffect(() => {
    if (!isSeeking) {
      setLocalVolume(playerState.volume)
    }
  }, [playerState.volume, isSeeking])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    onCommand(playerState.isPlaying ? 'PAUSE' : 'PLAY')
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseInt(e.target.value)
    setLocalVolume(volume)
  }

  const handleVolumeChangeEnd = () => {
    onCommand('SET_VOLUME', { volume: localVolume })
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setLocalSeekTime(time)
    setIsSeeking(true)
  }

  const handleSeekEnd = () => {
    onCommand('SEEK', { time: localSeekTime })
    setIsSeeking(false)
  }

  const currentSeekTime = isSeeking ? localSeekTime : playerState.currentTime

  return (
    <div className={styles.container}>
      <div className={styles.nowPlaying}>
        <h2 className={styles.nowPlayingLabel}>Now Playing</h2>
        {playerState.title ? (
          <>
            <h3 className={styles.title}>{playerState.title}</h3>
            <p className={styles.channel}>{playerState.channelName}</p>
          </>
        ) : (
          <p className={styles.noVideo}>No video playing</p>
        )}
      </div>

      <div className={styles.seekSection}>
        <input
          type="range"
          min="0"
          max={playerState.duration || 100}
          step="0.1"
          value={currentSeekTime}
          onChange={handleSeek}
          onMouseUp={handleSeekEnd}
          onTouchEnd={handleSeekEnd}
          className={styles.seekBar}
          disabled={!playerState.duration}
        />
        <div className={styles.timeDisplay}>
          <span>{formatTime(currentSeekTime)}</span>
          <span>{formatTime(playerState.duration)}</span>
        </div>
      </div>

      <div className={styles.controls}>
        <button
          className={styles.controlButton}
          onClick={() => onCommand('PREVIOUS')}
          title="Previous"
        >
          ⏮️
        </button>

        <button
          className={`${styles.controlButton} ${styles.playButton}`}
          onClick={handlePlayPause}
          title={playerState.isPlaying ? 'Pause' : 'Play'}
        >
          {playerState.isPlaying ? '⏸️' : '▶️'}
        </button>

        <button
          className={styles.controlButton}
          onClick={() => onCommand('NEXT')}
          title="Next"
        >
          ⏭️
        </button>
      </div>

      <div className={styles.volumeSection}>
        <button
          className={styles.muteButton}
          onClick={() => onCommand(playerState.isMuted ? 'UNMUTE' : 'MUTE')}
          title={playerState.isMuted ? 'Unmute' : 'Mute'}
        >
          {playerState.isMuted ? '🔇' : localVolume > 50 ? '🔊' : localVolume > 0 ? '🔉' : '🔈'}
        </button>

        <input
          type="range"
          min="0"
          max="100"
          value={localVolume}
          onChange={handleVolumeChange}
          onMouseUp={handleVolumeChangeEnd}
          onTouchEnd={handleVolumeChangeEnd}
          className={styles.volumeSlider}
        />

        <span className={styles.volumeValue}>{localVolume}%</span>
      </div>

      <div className={styles.extraControls}>
        <button
          className={styles.extraButton}
          onClick={() => onCommand('FULLSCREEN')}
          title="Toggle Fullscreen"
        >
          ⛶ Fullscreen
        </button>
      </div>

      {onDisconnect && (
        <div className={styles.disconnectSection}>
          <button
            className={styles.disconnectButton}
            onClick={() => {
              if (confirm('Disconnect from this session?')) {
                onDisconnect()
              }
            }}
            title="Disconnect"
          >
            🚪 Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
