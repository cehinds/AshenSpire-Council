import { useCallback, useEffect, useRef, useState } from 'react'

interface QueuedAudio {
  id: string
  url: string
}

export function useAudioQueue() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const queueRef = useRef<QueuedAudio[]>([])
  const [activeId, setActiveId] = useState<string>()
  const [isPlaying, setIsPlaying] = useState(false)

  const stop = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    queueRef.current = []
    setActiveId(undefined)
    setIsPlaying(false)
  }, [])

  const playNext = useCallback(() => {
    const next = queueRef.current.shift()
    if (!next) {
      setActiveId(undefined)
      setIsPlaying(false)
      audioRef.current = null
      return
    }
    const audio = new Audio(next.url)
    audioRef.current = audio
    setActiveId(next.id)
    setIsPlaying(true)
    audio.addEventListener('ended', playNext, { once: true })
    audio.addEventListener('error', playNext, { once: true })
    void audio.play().catch(() => setIsPlaying(false))
  }, [])

  const playSequence = useCallback((items: QueuedAudio[]) => {
    stop()
    queueRef.current = [...items]
    playNext()
  }, [playNext, stop])

  const playOne = useCallback((item: QueuedAudio) => {
    if (activeId === item.id && audioRef.current) {
      if (audioRef.current.paused) {
        void audioRef.current.play()
        setIsPlaying(true)
      } else {
        audioRef.current.pause()
        setIsPlaying(false)
      }
      return
    }
    playSequence([item])
  }, [activeId, playSequence])

  const toggleActive = useCallback(() => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      void audioRef.current.play()
      setIsPlaying(true)
    } else {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  useEffect(() => stop, [stop])

  return { activeId, isPlaying, playSequence, playOne, toggleActive }
}
