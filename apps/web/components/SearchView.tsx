import { useState, useEffect } from 'react'
import styles from '@/styles/SearchView.module.css'

interface SearchResult {
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration: string
}

interface SearchViewProps {
  results: SearchResult[]
  onSearch: (query: string) => void
  onPlayVideo: (videoId: string) => void
}

export default function SearchView({ results, onSearch, onPlayVideo }: SearchViewProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Stop loading when results arrive
  useEffect(() => {
    if (results.length > 0) {
      setIsSearching(false)
    }
  }, [results])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (query.trim()) {
      setIsSearching(true)
      onSearch(query)

      // Fallback timeout in case no results arrive (10 seconds to account for YouTube load time)
      setTimeout(() => {
        setIsSearching(false)
      }, 10000)
    }
  }

  const handlePlayVideo = (videoId: string) => {
    onPlayVideo(videoId)
    // Show feedback
    setIsSearching(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchSection}>
        <h2 className={styles.title}>Search YouTube</h2>

        <form onSubmit={handleSubmit} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search for videos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button
            type="submit"
            className={styles.searchButton}
            disabled={!query.trim() || isSearching}
          >
            {isSearching ? '⏳' : '🔍'}
          </button>
        </form>
      </div>

      <div className={styles.resultsSection}>
        {isSearching && results.length === 0 && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Searching...</p>
          </div>
        )}

        {!isSearching && results.length === 0 && query && (
          <div className={styles.empty}>
            <p>No results found. Try a different search.</p>
          </div>
        )}

        {!query && results.length === 0 && (
          <div className={styles.empty}>
            <p>Search for videos to play on your PC</p>
          </div>
        )}

        {results.length > 0 && (
          <div className={styles.results}>
            {results.map((result) => (
              <div
                key={result.videoId}
                className={styles.resultItem}
                onClick={() => handlePlayVideo(result.videoId)}
              >
                <div className={styles.thumbnail}>
                  {result.thumbnail && (
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className={styles.thumbnailImage}
                    />
                  )}
                  {result.duration && (
                    <span className={styles.duration}>{result.duration}</span>
                  )}
                </div>

                <div className={styles.info}>
                  <h3 className={styles.videoTitle}>{result.title}</h3>
                  <p className={styles.channelName}>{result.channelName}</p>
                </div>

                <div className={styles.playIcon}>▶️</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
