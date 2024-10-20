import { addDelayedExecutionScripts } from '../delayedLoader'
import type { ScriptInit } from '../../@types/general'

const scriptsFiredOnUserInteraction: ScriptInit = () => {
  document.body.appendChild(document.createElement('hr'))
}

addDelayedExecutionScripts([scriptsFiredOnUserInteraction, scriptsFiredOnUserInteraction])

const event = new Event('touchstart')
document.dispatchEvent(event)
