import * as PIXI from 'pixi.js'
import * as l1 from './l1'

type Range = { min: number, max: number }

type Ramp = {
  start:             number
  end:               number
  minimumMultiplier: number
}

export type EmitOptions = {
  parent:          PIXI.Container
  textures:        PIXI.Texture[]
  pos:             { x: number, y: number }
  spawnCircle?:    { x: number, y: number, r: number }
  frequency:       number
  emitterLifetime: number
  maxParticles:    number
  lifetime:        Range
  speed:           Ramp
  scale:           Ramp
  alpha:           { start: number, end: number }
  startRotation:   Range
  rotateSprite:    boolean
}

type Particle = {
  sprite:     PIXI.Sprite
  age:        number
  lifetime:   number
  directionX: number
  directionY: number
  speed:      Ramp
  scale:      Ramp
  alphaStart: number
  alphaEnd:   number
}

const TICKS_PER_SECOND = 60

const between = ({ min, max }: Range) => min + (Math.random() * (max - min))

const lerp = (start: number, end: number, progress: number) => start
  + ((end - start) * progress)

const rampValue = (ramp: Ramp, progress: number, multiplier: number) => lerp(
  ramp.start,
  ramp.end,
  progress,
) * multiplier

const randomMultiplier = (ramp: Ramp) => ramp.minimumMultiplier
  + (Math.random() * (1 - ramp.minimumMultiplier))

const spawnPosition = (options: EmitOptions) => {
  const { pos, spawnCircle } = options

  if (!spawnCircle) {
    return { x: pos.x, y: pos.y }
  }

  const angle = Math.random() * Math.PI * 2
  const distance = Math.sqrt(Math.random()) * spawnCircle.r

  return {
    x: pos.x + spawnCircle.x + (Math.cos(angle) * distance),
    y: pos.y + spawnCircle.y + (Math.sin(angle) * distance),
  }
}

const createParticle = (options: EmitOptions): Particle => {
  const texture = options.textures[Math.floor(Math.random() * options.textures.length)]
  const sprite = new PIXI.Sprite(texture)
  sprite.anchor.set(0.5)

  const { x, y } = spawnPosition(options)
  sprite.x = x
  sprite.y = y

  const radians = l1.toRadians(between(options.startRotation))

  if (options.rotateSprite) {
    sprite.rotation = radians
  }

  options.parent.addChild(sprite)

  return {
    sprite,
    age:        0,
    lifetime:   between(options.lifetime),
    directionX: Math.cos(radians),
    directionY: Math.sin(radians),
    speed:      { ...options.speed, minimumMultiplier: randomMultiplier(options.speed) },
    scale:      { ...options.scale, minimumMultiplier: randomMultiplier(options.scale) },
    alphaStart: options.alpha.start,
    alphaEnd:   options.alpha.end,
  }
}

const advance = (particle: Particle, seconds: number) => {
  const progress = Math.min(particle.age / particle.lifetime, 1)
  const speed = rampValue(particle.speed, progress, particle.speed.minimumMultiplier)

  particle.sprite.x += particle.directionX * speed * seconds
  particle.sprite.y += particle.directionY * speed * seconds
  particle.sprite.scale.set(
    rampValue(particle.scale, progress, particle.scale.minimumMultiplier),
  )
  particle.sprite.alpha = lerp(particle.alphaStart, particle.alphaEnd, progress)
}

export const emit = (options: EmitOptions) => {
  const particles: Particle[] = []
  const emitter = {
    elapsed:        0,
    sinceLastSpawn: 0,
    spawned:        0,
  }

  const retire = (particle: Particle) => {
    if (particle.sprite.parent) {
      particle.sprite.destroy()
    }
  }

  const behavior = l1.addBehavior({
    onUpdate: ({ deltaTime }) => {
      // The parent going away takes every particle in it with it
      if (!options.parent.parent) {
         
        destroy()
        return
      }

      const seconds = deltaTime / TICKS_PER_SECOND
      emitter.elapsed += seconds
      emitter.sinceLastSpawn += seconds

      while (
        emitter.elapsed <= options.emitterLifetime
        && emitter.sinceLastSpawn >= options.frequency
        && emitter.spawned < options.maxParticles
      ) {
        emitter.sinceLastSpawn -= options.frequency
        emitter.spawned += 1
        particles.push(createParticle(options))
      }

      particles.forEach((particle) => {
        particle.age += seconds
        advance(particle, seconds)
      })

      const expired = particles.filter(particle => particle.age >= particle.lifetime)
      expired.forEach(retire)
      expired.forEach((particle) => {
        particles.splice(particles.indexOf(particle), 1)
      })

      if (emitter.elapsed > options.emitterLifetime && particles.length === 0) {
         
        destroy()
      }
    },
  })

  const destroy = () => {
    particles.forEach(retire)
    particles.length = 0
    l1.removeBehavior(behavior)
  }

  return { destroy }
}
