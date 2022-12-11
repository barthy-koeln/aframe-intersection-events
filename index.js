import { IntersectionComponent } from './src/IntersectionComponent.js'

if (typeof AFRAME === 'undefined') {
  throw new Error('Component \"intersection-events\" attempted to register before \"AFRAME\" was available.')
}

AFRAME.registerComponent('intersection-events', IntersectionComponent)
