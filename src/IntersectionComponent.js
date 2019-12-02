import { IntersectionEvents } from './IntersectionEvents.js'

export const IntersectionComponent = {

  schema: {
    cursor: {
      type: 'string',
      default: '#cursor'
    }
  },

  init () {
    /**
     * Whether the model has loaded or not
     * @type {boolean}
     */
    this.loaded = false

    /**
     * A raycaster instance with default values.
     * TODO configure via schema
     * @type {THREE.Raycaster}
     */
    this.raycaster = new THREE.Raycaster()
    this.raycaster.near         = 0
    this.raycaster.far          = 200
    this.raycaster.firstHitOnly = true

    /**
     * Whether the cursor raycast intersects the object
     * @type {boolean}
     */
    this.intersected = false

    /**
     * Intersected object/mesh name
     * @type {?string}
     */
    this.intersectedObjectName = null

    /**
     * Intersected material name
     * @type {?string}
     */
    this.intersectedMaterialName = null

    /**
     * Intersected
     * @type {Vector3}
     */
    this.intersectionPosition = new THREE.Vector3()

    /**
     * @type {Object3D}
     */
    this.cursor = document.querySelector(this.data.cursor).object3D

    /**
     * The cursor position on screen (it may move, you never know …)
     * @type {Vector3}
     */
    this.cursorPosition = new THREE.Vector3()

    /**
     * The direction created by the camera and the cursor position
     * @type {Vector3}
     */
    this.cursorDirection = new THREE.Vector3()

    /**
     * I took the red pill.
     * TODO find out what that does, and start documenting right away, moron.
     * @type {Matrix4}
     */
    this.cursorMatrix = new THREE.Matrix4()

    /**
     * Options passed to creted BVH bouds tree
     * TODO configure via schema
     * @type {{maxDepth: number, verbose: *}}
     */
    this.bvhOptions = {verbose: false, maxDepth: 80}

    this.bindFunctions()
    this.addEventListeners()
  },

  /**
   * Bind functions to the component instance
   * TODO configure throttle via schema
   */
  bindFunctions () {
    this.updateIntersection = this.updateIntersection.bind(this)
    this.modelLoaded        = this.modelLoaded.bind(this)
    this.computeBoundsTree  = this.computeBoundsTree.bind(this)

    this.tick = AFRAME.utils.throttleTick(this.updateIntersection, 34, this)
  },

  /**
   * Add event listeners
   */
  addEventListeners () {
    this.el.addEventListener('model-loaded', this.modelLoaded)
  },

  /**
   * Set the loaded flag and compute the BVH bounds tree
   * @param {CustomEvent} event
   */
  modelLoaded (event) {
    this.scene = event.detail.model

    this.el.object3D.traverseVisible(this.computeBoundsTree)

    this.loaded = true
  },

  /**
   * Compute the BVH bound tree
   * @param child
   */
  computeBoundsTree (child) {
    if ('isMesh' in child && child.isMesh) {
      child.geometry.computeBoundsTree(this.bvhOptions)
    }
  },

  /**
   * tick function, but with a better name. Updates data and emits the appropriate events.
   */
  updateIntersection () {
    if (!this.loaded) {
      return
    }

    this.cursor.updateMatrixWorld()
    this.cursor.getWorldPosition(this.cursorPosition)

    this.cursorMatrix
      .identity()
      .extractRotation(this.cursor.matrixWorld)

    this.cursorDirection
      .set(this.cursor.position.x, this.cursor.position.y, -1)
      .applyMatrix4(this.cursorMatrix)
      .normalize()

    this.raycaster.set(this.cursorPosition, this.cursorDirection)

    const intersections = this.raycaster.intersectObject(this.scene, true)

    this.updateIntersected(intersections.length > 0)

    if (this.intersected) {
      const {point, object} = intersections[0]
      const {material}      = object

      this.updatePosition(point)
      this.updateMaterialName(material)
      this.updateObjectName(object)

      return
    }

    this.resetMaterialName()
    this.resetObjectName()
  },

  /**
   * Emit a change and set the new value
   * @param {boolean} intersected
   */
  setIntersected (intersected) {
    this.el.emit(IntersectionEvents.STATUS_CHANGE, {from: this.intersected, to: intersected})
    this.intersected = intersected
  },

  /**
   * Emit a change and set the new value
   * @param {Vector3} point
   */
  setPosition (point) {
    this.intersectionPosition.copy(point)
    this.el.object3D.localToWorld(this.intersectionPosition)
    this.el.emit(IntersectionEvents.POSITION_CHANGE, this.intersectionPosition)
  },

  /**
   * Emit a change and set the new value
   * @param {?string} name
   */
  setMaterialName (name) {
    this.el.emit(IntersectionEvents.MATERIAL_CHANGE, {from: this.intersectedMaterialName, to: name})
    this.intersectedMaterialName = name
  },

  /**
   * Emit a change and set the new value
   * @param {?string} name
   */
  setObjectName (name) {
    this.el.emit(IntersectionEvents.OBJECT_CHANGE, {from: this.intersectedObjectName, to: name})
    this.intersectedObjectName = name
  },

  /**
   * Check if an update is necessary, and perform if it accordingly
   * @param {boolean} intersected
   */
  updateIntersected (intersected) {
    if (this.intersected !== intersected) {
      this.setIntersected(intersected)
    }
  },

  /**
   * Check if an update is necessary, and perform if it accordingly
   * @param {Vector3} point
   */
  updatePosition (point) {
    if (!this.intersectionPosition.equals(point)) {
      this.setPosition(point)
    }
  },

  /**
   * Check if an update is necessary, and perform if it accordingly
   * @param {Material} material
   */
  updateMaterialName (material) {
    if (this.intersectedMaterialName !== material.name) {
      this.setMaterialName(material.name)
    }
  },

  /**
   * Check if an update is necessary, and perform if it accordingly
   * @param {Object3D} object
   */
  updateObjectName (object) {
    if (this.intersectedObjectName !== object.name) {
      this.setObjectName(object.name)
    }
  },

  /**
   * Check if an update is necessary, and perform if it accordingly
   */
  resetMaterialName () {
    if (this.intersectedMaterialName !== null) {
      this.setMaterialName(null)
    }
  },

  /**
   * Check if an update is necessary, and perform if it accordingly
   */
  resetObjectName () {
    if (this.intersectedObjectName !== null) {
      this.setObjectName(null)
    }
  },
}
