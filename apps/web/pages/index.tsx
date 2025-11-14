import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import PairingModal from '@/components/PairingModal'
import RemoteControl from '@/components/RemoteControl'
import SearchView from '@/components/SearchView'
import styles from '@/styles/Home.module.css'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isPaired, setIsPaired] = useState(false)
  const [activeView, setActiveView] = useState<'remote' | 'search'>('remote')
  const [wasEverPaired, setWasEverPaired] = useState(false) // Track if we were paired in this session
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 50,
    isMuted: false,
    title: '',
    channelName: ''
  })
  const [searchResults, setSearchResults] = useState([])

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    })

    newSocket.on('connect', () => {
      
      setIsConnected(true)

      // Auto-rejoin if we have a saved room code (from refresh or reconnect)
      const savedRoomCode = localStorage.getItem('roomCode')
      if (savedRoomCode) {
        
        newSocket.emit('JOIN_ROOM', {
          roomCode: savedRoomCode,
          deviceType: 'remote'
        })
      }
    })

    newSocket.on('disconnect', () => {
     
      setIsConnected(false)
      setIsPaired(false)
      // Don't clear room code or wasEverPaired - we'll use them to reconnect
    })

    newSocket.on('ROOM_JOINED', () => {  
      setIsPaired(true)
      setWasEverPaired(true) // Mark that we were paired in this session

      // Request initial state from extension
      newSocket.emit('COMMAND', { action: 'GET_STATE' })
    })

    newSocket.on('PEER_CONNECTED', () => {
      // Request initial state
      newSocket.emit('COMMAND', { action: 'GET_STATE' })
    })

    newSocket.on('PEER_DISCONNECTED', (data) => {
      
      // If no peers left (only remote remaining or empty), go back to pairing
      if (data.peersInRoom <= 1) {
        setIsPaired(false)
        setWasEverPaired(false) // Reset session flag
        localStorage.removeItem('roomCode')
      }
    })

    newSocket.on('EVENT', (data) => {
     

      if (data.action === 'PLAYER_STATE') {
        setPlayerState(data.state)
      }

      if (data.action === 'SEARCH_RESULTS') {
        setSearchResults(data.results || [])
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const handlePair = (roomCode: string) => {
    if (socket && socket.connected) {
      // Save room code to localStorage for reconnection
      localStorage.setItem('roomCode', roomCode)

      socket.emit('JOIN_ROOM', {
        roomCode,
        deviceType: 'remote'
      })
    }
  }

  const sendCommand = (action: string, payload?: any) => {
    if (socket && socket.connected && isPaired) {
      socket.emit('COMMAND', { action, payload })
    }
  }

  const handleSearch = (query: string) => {
    // Clear previous results when starting a new search
    setSearchResults([])
    sendCommand('SEARCH', { query })
  }

  const handleDisconnect = () => {
   

    // Clear all state
    setIsPaired(false)
    setWasEverPaired(false)
    localStorage.removeItem('roomCode')

    // Leave the room (stay connected to server, just not in any room)
    if (socket && socket.connected) {
      
      socket.emit('LEAVE_ROOM')
    }

    // That's it - we stay connected to server but unpaired
  }

  return (
    <div className={styles.container}>
      {!isPaired && (
        <PairingModal
          isConnected={isConnected}
          onPair={handlePair}
        />
      )}

      {isPaired && (
        <>
          <div className={styles.content}>
            {activeView === 'remote' && (
              <RemoteControl
                playerState={playerState}
                onCommand={sendCommand}
                onDisconnect={handleDisconnect}
              />
            )}

            {activeView === 'search' && (
              <SearchView
                results={searchResults}
                onSearch={handleSearch}
                onPlayVideo={(videoId) => sendCommand('PLAY_VIDEO', { videoId })}
              />
            )}
          </div>

          <nav className={styles.tabBar}>
            <button
              className={`${styles.tabButton} ${activeView === 'remote' ? styles.active : ''}`}
              onClick={() => setActiveView('remote')}
            >
              <span className={styles.tabIcon}>🎮</span>
              <span className={styles.tabLabel}>Remote</span>
            </button>
            <button
              className={`${styles.tabButton} ${activeView === 'search' ? styles.active : ''}`}
              onClick={() => setActiveView('search')}
            >
              <span className={styles.tabIcon}>🔍</span>
              <span className={styles.tabLabel}>Search</span>
            </button>
          </nav>
        </>
      )}
    </div>
  )
}
