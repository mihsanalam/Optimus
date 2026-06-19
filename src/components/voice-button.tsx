'use client'

import { useEffect, useState, useCallback } from 'react'
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react'
import { useVoice, VoiceState } from '@/hooks/use-voice'

interface VoiceCommandResult {
  action: 'calendar' | 'email' | 'task' | 'weather' | 'brief' | 'news' | 'navigate' | 'general'
  response: string
  data?: Record<string, string>
  speak: boolean
}

interface VoiceButtonProps {
  className?: string
  onAction?: (action: string, data?: Record<string, string>) => void
}

export function VoiceButton({ className, onAction }: VoiceButtonProps) {
  const [lastResponse, setLastResponse] = useState('')

  const handleTranscript = useCallback(async (text: string) => {
    const res = await fetch('/api/voice-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: text }),
    })

    if (!res.ok) throw new Error('Command failed')

    const result: VoiceCommandResult = await res.json()
    setLastResponse(result.response)

    if (result.speak && result.response) {
      speak(result.response)
    }

    if (result.action !== 'general' && onAction) {
      onAction(result.action, result.data)
    }
  }, [onAction])

  const { state, transcript, interim, isSupported, toggle, speak, cancelSpeech } = useVoice({
    onTranscript: handleTranscript,
  })

  // Ctrl+Shift+M keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault()
        if (state === 'speaking') { cancelSpeech(); return }
        if (state !== 'processing') toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, toggle, cancelSpeech])

  if (!isSupported) return null

  const icon: Record<VoiceState, React.ReactNode> = {
    idle:       <Mic className="w-4 h-4" />,
    listening:  <Mic className="w-4 h-4" />,
    processing: <Loader2 className="w-4 h-4 animate-spin" />,
    speaking:   <Volume2 className="w-4 h-4" />,
    error:      <MicOff className="w-4 h-4" />,
  }

  const style: Record<VoiceState, string> = {
    idle:       'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-indigo-500 hover:text-indigo-500',
    listening:  'border-indigo-500 text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10',
    processing: 'border-zinc-200 dark:border-zinc-800 text-zinc-500 cursor-not-allowed',
    speaking:   'border-emerald-500 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
    error:      'border-red-500 text-red-500',
  }

  const displayText = interim || (state === 'listening' ? '' : transcript)

  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      <button
        onClick={state === 'speaking' ? cancelSpeech : toggle}
        disabled={state === 'processing'}
        title="Voice command (Ctrl+Shift+M)"
        className={`relative flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs transition-all duration-150 disabled:cursor-not-allowed bg-transparent border ${style[state]}`}
      >
        {/* Pulse ring while listening */}
        {state === 'listening' && (
          <span className="absolute inset-0 rounded-xl border border-indigo-400 animate-ping opacity-20" />
        )}
        {icon[state]}
        <span className="font-semibold tracking-wide">
          {state === 'idle' && 'Voice Assistant'}
          {state === 'listening' && 'Listening…'}
          {state === 'processing' && 'Thinking…'}
          {state === 'speaking' && 'Speaking'}
          {state === 'error' && 'Try again'}
        </span>
        <span className="ml-auto text-[9px] opacity-40 font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">⌃⇧M</span>
      </button>

      {/* Live transcript */}
      {displayText && (
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic px-1 truncate">"{displayText}"</p>
      )}

      {/* AI response */}
      {lastResponse && state !== 'listening' && (
        <p className="text-[10px] text-zinc-600 dark:text-zinc-300 px-1 leading-relaxed font-medium">{lastResponse}</p>
      )}
    </div>
  )
}
