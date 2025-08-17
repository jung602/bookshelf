import * as THREE from 'three'

export class SceneIndex {
  private scene: THREE.Scene
  private floorMeshes: THREE.Mesh[] = []
  private wallMeshes: THREE.Mesh[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.rebuild()
  }

  public rebuild(): void {
    this.floorMeshes = []
    this.wallMeshes = []

    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.userData.isFloor) {
          this.floorMeshes.push(child)
        }
        if (child.userData.isWall) {
          this.wallMeshes.push(child)
        }
      }
    })
  }

  public getFloorMeshes(): THREE.Mesh[] {
    return this.floorMeshes
  }

  public getWallMeshes(): THREE.Mesh[] {
    return this.wallMeshes
  }

  public getFloorBounds(): { minX: number, maxX: number, minZ: number, maxZ: number } | null {
    if (this.floorMeshes.length === 0) return null

    let minX = Infinity, maxX = -Infinity
    let minZ = Infinity, maxZ = -Infinity

    this.floorMeshes.forEach(mesh => {
      const boundingBox = new THREE.Box3().setFromObject(mesh)
      minX = Math.min(minX, boundingBox.min.x)
      maxX = Math.max(maxX, boundingBox.max.x)
      minZ = Math.min(minZ, boundingBox.min.z)
      maxZ = Math.max(maxZ, boundingBox.max.z)
    })

    return { minX, maxX, minZ, maxZ }
  }
}


