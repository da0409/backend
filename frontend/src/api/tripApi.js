import { mockTrips } from './mockData'

export const tripApi = {
  getTrips: () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockTrips]), 300)
    })
  },
  addTrip: (trip) => {
    return new Promise((resolve) => {
      mockTrips.push({ id: `t_${Date.now()}`, ...trip })
      setTimeout(() => resolve({ success: true }), 300)
    })
  }
}