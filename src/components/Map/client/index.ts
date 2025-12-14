import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { getGoogleMapsApiKey } from '@components/scripts/utils/environmentClient'
import { APILoader } from '@googlemaps/extended-component-library/api_loader.js'

type MapInitContext = {
  scriptName: 'Map'
  operation: string
}

const MAP_SELECTOR = '[data-company-map]'

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const geocodingLibrary = await APILoader.importLibrary('geocoding')
  const Geocoder = (geocodingLibrary as unknown as { Geocoder: new () => { geocode: (_request: { address: string }) => Promise<{ results?: Array<{ geometry?: { location?: { lat: () => number; lng: () => number } } }> }> } }).Geocoder

  const geocoder = new Geocoder()
  const response = await geocoder.geocode({ address })
  const firstResult = response.results?.[0]

  if (!firstResult?.geometry?.location) {
    return null
  }

  const location = firstResult.geometry.location

  return {
    lat: location.lat(),
    lng: location.lng(),
  }
}

async function initMapElement(root: HTMLElement): Promise<void> {
  const loader = root.querySelector('gmpx-api-loader') as APILoader | null
  const map = root.querySelector('gmp-map')
  const marker = root.querySelector('gmp-advanced-marker')
  const address = root.getAttribute('data-address') ?? ''

  if (!loader || !map || !marker || !address) {
    return
  }

  loader.key = getGoogleMapsApiKey()

  const location = await geocodeAddress(address)
  if (!location) {
    return
  }

  const centerValue = `${location.lat},${location.lng}`
  map.setAttribute('center', centerValue)
  map.setAttribute('zoom', '16')
  marker.setAttribute('position', centerValue)
}

async function initAllMaps(): Promise<void> {
  const maps = Array.from(document.querySelectorAll<HTMLElement>(MAP_SELECTOR))
  if (maps.length === 0) {
    return
  }

  await Promise.all(maps.map((root) => initMapElement(root)))
}

export function registerCompanyMap(): void {
  const context: MapInitContext = { scriptName: 'Map', operation: 'registerCompanyMap' }
  addScriptBreadcrumb(context)

  const init = () => {
    initAllMaps().catch((error) => {
      handleScriptError(error, { scriptName: 'Map', operation: 'initAllMaps' })
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }

  document.addEventListener('astro:page-load', init)
}
