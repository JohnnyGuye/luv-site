function modulo(value, mod) {
  return ((value % mod) + mod) % mod
}

class Vec2 {

  /** @type number */
  #x = 0
  
  /** @type number */
  #y = 0

  get x() { return this.#x }
  get y() { return this.#y }
  set x(value) { this.#x = value }
  set y(value) { this.#y = value }

  /**
   * 
   * @param {number} x 
   * @param {number} y 
   */
  constructor(x, y) {
    this.#x = x
    this.#y = y
  }

  /** @param {Vec2} oth */
  deltaX(oth) {
    return this.x - oth.x
  }

  /** @param {Vec2} oth */
  deltaY(oth) {
    return this.y - oth.y
  }

  negate() {
    this.#x = -this.#x
    this.#y = -this.#y

    return this
  }

  negated() {
    return this.copy().negate()
  }

  /** @param {Vec2} oth */
  add(oth) {
    this.#x += oth.x
    this.#y += oth.y

    return this
  }

  /** @param {Vec2} oth */
  added(oth) {
    return this.copy().add(oth)
  }

  /** @param {Vec2} oth */
  substract(oth) {
    
    this.#x -= oth.x
    this.#y -= oth.y
    
    return this
  }
  
  /** @param {Vec2} oth */
  substracted(oth) {
    return this.copy().substract(oth)
  }

  /** @param {Vec2} oth */
  distance2(oth) {
    return Math.pow(this.deltaX(oth),2) + Math.pow(this.deltaY(oth),2)
  }

  /** @param {Vec2} oth */
  distance(oth) {
    return Math.sqrt(this.distance2(oth))
  }

  /** @param {number|Vec2} factor */
  scale(factor) {

    let fx = 0
    let fy = 0

    if (typeof factor === 'number') {
      fx = factor
      fy = factor
    } else {
      fx = factor.x
      fy = factor.y
    }

    this.#x *= fx
    this.#y *= fy

    return this
  }
  
  /** @param {number|Vec2} factor */
  scaled(factor) {
    return this.copy().scale(factor)
  }

  get norm2() {
    return this.distance2(Vec2.Zero)
  }

  get norm() {
    return this.distance(Vec2.Zero)
  }
  
  normalize() {

    const n = this.norm
    if (n == 0) return this

    this.x /= n
    this.y /= n

    return this
  }

  normalized() {
    const cpy = this.copy()
    return this.normalize()
  }

  copy() {
    return new Vec2(this.#x, this.#y)
  }

}

Vec2.Zero = Object.freeze(new Vec2(0,0))

class UpdateClock {

  /** @type {number} */
  #originTime = 0

  /** @type {number} */
  #previousTime = 0

  /** @type {number} */
  #currentTime = 0

  /** 
   * @param {number} originTime 
   * @param {number} previousTime 
   * @param {number} currentTime 
   * */
  constructor(originTime, previousTime, currentTime) {
    this.#originTime = originTime
    this.#previousTime = previousTime
    this.#currentTime = currentTime
  }

  get ellapsedSeconds() {
    return this.ellapsedMilliseconds / 1000
  }

  get ellapsedSecondsSinceBegining() {
    return this.ellapsedMillisecondsSinceBegining / 1000
  }


  get ellapsedMilliseconds() {
    return this.#currentTime - this.#previousTime
  }

  get ellapsedMillisecondsSinceBegining() {
    return this.#currentTime - this.#originTime
  }

  tick() {
    return new UpdateClock(this.#originTime, this.#currentTime, Date.now())
  }
}

UpdateClock.Init = function() {
  const now = Date.now()
  return new UpdateClock(now, now, now)
}

/** */
UpdateClock.DeltaTime = function(timeObject) {
  if ( typeof timeObject === "number") {
    return timeObject
  }

  if (timeObject instanceof UpdateClock) {
    return timeObject.ellapsedSeconds
  }

  throw new Error("Can't parse this time object")
}

class Rigidbody {

  /** @type {Vec2} */
  position = new Vec2(0,0)

  /** @type {Vec2} */
  speed = new Vec2(0, 0)
  
  /** @type {Vec2} */
  acceleration = new Vec2(0, 0)

  frictionCoef = 0.0

  /** @type {Map<string, (dt: number) => Vec2} */
  forces = new Map()

  constructor() {
    this.forces.set("friction", (dt) => {
      const frictionDeceleration = this.speed.scaled(-Math.abs(this.frictionCoef))
      return frictionDeceleration
    })
  }

  /**
   * 
   * @param {number|UpdateClock} deltaTime 
   */
  #updateAccelerationFromForces(deltaTime) {
    const dt = UpdateClock.DeltaTime(deltaTime)
    
    let acc = new Vec2(0, 0)
    for (let force of this.forces.values()) {
      acc.add(force(dt))
    }

    this.acceleration.add(acc)
  }

  /**
   * 
   * @param {number|UpdateClock} deltaTime 
   */
  #updateSpeedFromAcceleration(deltaTime) {
    const dt = UpdateClock.DeltaTime(deltaTime)
    this.speed.add(this.acceleration.scaled(dt))
  }

  /**
   * 
   * @param {number|UpdateClock} deltaTime 
   */
  #updatePositionFromAcceleration(deltaTime) {
    this.position.add(this.#speedDisplacement(deltaTime))
  }
  
  /**
   * 
   * @param {number|UpdateClock} deltaTime 
   */
  #speedDisplacement(deltaTime) {
    const dt = UpdateClock.DeltaTime(deltaTime)
    return this.speed.scaled(dt)
  }

  /**
   * 
   * @param {number|UpdateClock} deltaTime 
   */
  update(deltaTime) {
    this.#updateAccelerationFromForces(deltaTime)
    this.#updateSpeedFromAcceleration(deltaTime)
    this.#updatePositionFromAcceleration(deltaTime)
    this.acceleration = Vec2.Zero.copy()
  }

}

class SceneObject {

  rigidbody = new Rigidbody()

  get position() {
    return this.rigidbody.position
  }

  set position(newPos) {
    this.rigidbody.position = newPos
  }

  distanceFrom(oth) {
    return this.position.substracted(oth.position)
  }

  /**
   * 
   * @param {number|UpdateClock} deltaTime 
   */
  update(deltaTime) {
    this.rigidbody.update(deltaTime)
  }
}


class Luv {

  bumpForce = 100_000

  /** @type {HTMLElement} */
  #luvContainer = null

  /** @type {HTMLElement} */
  #noButton = null

  /** @type {SceneObject} */
  #noButtonSceneObject = new SceneObject()

  /**@type {HTMLElement} */
  #mouseBubble = null

  /** @type {SceneObject} */
  #mouseBubbleSceneObject = new SceneObject()

  /** @type {Array<SceneObject>} */
  #objects = []

  constructor() {
    this.#objects = [this.#mouseBubbleSceneObject, this.#noButtonSceneObject]
  }

  start() {
    this.#luvContainer = document.getElementById("luvcontainer")
    this.#noButton = document.getElementById("noButton")
    const placeholderButton = document.getElementById("placeholder-button")
    
    this.#mouseBubble = document.createElement("div")
    this.#mouseBubble.classList.add("mouse-bubble")
    this.#luvContainer.prepend(this.#mouseBubble)

    this.#noButton.style.position = "absolute"
    this.#noButton.style.translate = "-50% -50%"

    const rect = placeholderButton.getBoundingClientRect()
    const center =  new Vec2(rect.left + rect.width / 2, rect.top + rect.height / 2)
    this.#noButton.style.left = `${center.x}px`
    this.#noButton.style.top = `${center.y}px`

    this.#noButtonSceneObject.position = center
    this.#noButtonSceneObject.rigidbody.frictionCoef = 0.999
    this.#noButtonSceneObject.rigidbody.forces.set("mouse_push", (dt) => {
      
      const vp = this.viewport
      const nbso = this.#noButtonSceneObject
      const mbso = this.#mouseBubbleSceneObject
  
      const diff = nbso.distanceFrom(mbso)
      const minDist = this.noButtonSize
      const maxDist = Math.max(Math.min(vp.x, vp.y) / 6, 20)
      const n = Math.max(diff.norm, minDist)

      if (n < maxDist) {
        const vn = diff.normalize()
        const mouseBumpAccCoef = this.bumpForce * (minDist * minDist) / (n * n)
        const attenuation = Math.pow(1 - ((n - minDist) / (maxDist - minDist)),2)

        return vn.scaled(mouseBumpAccCoef * attenuation)
      }

      return Vec2.Zero.copy()
    })

    const that = this
    this.#luvContainer.addEventListener('mousemove', (evt) => that._moving(evt))

    const originClock = UpdateClock.Init()
    let previousClock = originClock

    const gameLoop = () => {
      let currentClock = previousClock.tick()
      this._update(currentClock)
      previousClock = currentClock
      requestAnimationFrame(gameLoop)
    }
    gameLoop()

    return this
  }

  /** @param {MouseEvent} evt  */
  _moving(evt) {
    const mousePos = new Vec2(evt.clientX, evt.clientY)
    this.bubblePosition = mousePos
    this.#mouseBubbleSceneObject.position = mousePos
  }

  /**
   * 
   * @param {UpdateClock} deltaTime 
   */
  _update(deltaTime) {
    
    const nbso = this.#noButtonSceneObject
    
    this.#objects.forEach(obj => obj.update(deltaTime))
    this.noButtonPosition = nbso.position
    
    this._resolvePositions()
  }

  _resolvePositions() {
    const vp = this.viewport
    this.#objects.forEach(obj => {
      const x = obj.position.x
      const y = obj.position.y
      obj.position.x = modulo(x, vp.x)
      obj.position.y = modulo(y, vp.y)
      this.noButtonPosition = obj.position
    })
  }

  get viewport() {
    return new Vec2(this.#luvContainer.clientWidth, this.#luvContainer.clientHeight)
  }

  get center() {
    return this.viewport.scale(0.5)
  }

  get noButtonPosition() {
    const rect = this.#noButton.getBoundingClientRect()
    return new Vec2(rect.left + rect.width / 2, rect.top + rect.height / 2)
  }

  set noButtonPosition(newPos) {
    this.#noButton.style.left = `${newPos.x}px`
    this.#noButton.style.top  = `${newPos.y}px`
  }

  get noButtonSize() {
    const rect = this.#noButton.getBoundingClientRect()
    return rect.width
  }

  set bubblePosition(newPos) {
    this.#mouseBubble.style.left  = `${newPos.x}px`
    this.#mouseBubble.style.top   = `${newPos.y}px`
  }

  get bubblePosition() {
    const rect = this.#mouseBubble.getBoundingClientRect()
    return new Vec2(rect.left + rect.width / 2, rect.top + rect.height / 2)
  }

}