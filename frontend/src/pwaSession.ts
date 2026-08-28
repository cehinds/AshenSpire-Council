import type { Meeting, TranscriptItem } from './types'

const SESSION_KEY = 'ashenspire:pwa-meeting-state:v1'

interface MeetingSession {
  meeting?: Meeting
  transcript: TranscriptItem[]
}

export function readMeetingSession(): MeetingSession | undefined {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (!stored) return undefined
    const parsed = JSON.parse(stored) as MeetingSession
    if (!Array.isArray(parsed.transcript)) return undefined
    return parsed
  } catch {
    return undefined
  }
}

export function writeMeetingSession(meeting: Meeting | undefined, transcript: TranscriptItem[]) {
  if (!meeting && !transcript.length) return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ meeting, transcript } satisfies MeetingSession))
  } catch {
    // Storage can be unavailable in hardened or private browser contexts.
  }
}
