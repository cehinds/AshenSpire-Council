import { useRef, useState } from 'react'

export function useRecorder(onRecording: (blob: Blob) => Promise<void>) {
  const recorderRef = useRef<MediaRecorder | undefined>(undefined)
  const streamRef = useRef<MediaStream | undefined>(undefined)
  const chunksRef = useRef<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)

  async function toggle() {
    if (isRecording) {
      recorderRef.current?.stop()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw new Error('Microphone recording is not supported by this browser.')
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream
    const recorder = new MediaRecorder(stream)
    recorderRef.current = recorder
    chunksRef.current = []
    recorder.ondataavailable = (event) => event.data.size && chunksRef.current.push(event.data)
    recorder.onstop = async () => {
      setIsRecording(false)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      setIsTranscribing(true)
      try { await onRecording(blob) } finally { setIsTranscribing(false) }
    }
    recorder.start()
    setIsRecording(true)
  }

  return { isRecording, isTranscribing, toggle }
}
