// Minimal Web Speech API typings used by SearchBar voice input.
// The project restricts global `types` in tsconfig, so we declare what we use here.

declare global {
  interface SpeechRecognitionErrorEvent extends Event {
    error: string
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number
    results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }>
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string

    onstart: (() => void) | null
    onend: (() => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onresult: ((event: SpeechRecognitionEvent) => void) | null

    start(): void
    stop(): void
  }

  // Constructor globals
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  var SpeechRecognition: {
    prototype: SpeechRecognition
    new (): SpeechRecognition
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  var webkitSpeechRecognition: {
    prototype: SpeechRecognition
    new (): SpeechRecognition
  }
}

export {}
