'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

interface UseVoiceParams {
  onTranscript: (text: string) => Promise<void>
  language?: string
}

export function useVoice({ onTranscript, language = 'en-US' }: UseVoiceParams) {
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<any>(null)
  const lastTranscriptRef = useRef('') // ref avoids stale closure in onend

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SR)
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setInterim('')
    setState('idle')
  }, [])

  const toggle = useCallback(() => {
    if (state === 'listening') { stop(); return }
    if (state === 'processing' || state === 'speaking') return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.lang = language
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setState('listening')
      setTranscript('')
      setInterim('')
      lastTranscriptRef.current = ''
    }

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          lastTranscriptRef.current = result[0].transcript
          setTranscript(result[0].transcript)
          setInterim('')
        } else {
          setInterim(result[0].transcript)
        }
      }
    }

    recognition.onend = async () => {
      const captured = lastTranscriptRef.current.trim()
      lastTranscriptRef.current = ''

      if (!captured) { setState('idle'); return }

      setState('processing')
      try {
        await onTranscript(captured)
      } catch {
        setState('error')
        setTimeout(() => setState('idle'), 2500)
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') { setState('idle'); return }
      setState('error')
      setTimeout(() => setState('idle'), 2500)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [state, language, onTranscript, stop])

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language
    utterance.rate = 1.1
    utterance.onstart = () => setState('speaking')
    utterance.onend = () => { setState('idle'); onEnd?.() }
    utterance.onerror = () => setState('idle')

    setState('speaking')
    window.speechSynthesis.speak(utterance)
  }, [language])

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis?.cancel()
    setState('idle')
  }, [])

  return { state, transcript, interim, isSupported, toggle, stop, speak, cancelSpeech }
}
