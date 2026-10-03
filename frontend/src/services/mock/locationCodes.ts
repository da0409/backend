import type { LocationRef } from '../contracts'
import { demoQuestions, demoTrips } from '../../mocks/fixtures'

const knownLocations = [
  ...demoQuestions.map(question => question.location),
  ...demoTrips.map(trip => trip.destination),
]

function nameKey(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, '')
}

function cityKey(value: string): string {
  return nameKey(value).replace(/市$/, '')
}

export function normalizeManualLocation(location: LocationRef): LocationRef {
  const city = cityKey(location.cityName)
  const poi = nameKey(location.poiName)
  const knownCity = knownLocations.find(item => cityKey(item.cityName) === city)
  const cityCode = knownCity?.cityCode ?? `manual-city:${city}`
  const knownPoi = knownLocations.find(item =>
    item.cityCode === cityCode && nameKey(item.poiName) === poi,
  )

  return {
    ...location,
    cityCode,
    poiId: knownPoi?.poiId ?? `manual-poi:${city}:${poi}`,
  }
}
