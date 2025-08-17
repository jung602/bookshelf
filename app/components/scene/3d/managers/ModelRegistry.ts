import { BaseModel } from '../objects/BaseModel'

export class ModelRegistry {
  private models: Map<string, BaseModel> = new Map()

  public register(model: BaseModel): void {
    this.models.set(model.getId(), model)
  }

  public unregister(modelId: string): void {
    this.models.delete(modelId)
  }

  public get(modelId: string): BaseModel | undefined {
    return this.models.get(modelId)
  }

  public getAll(): BaseModel[] {
    return Array.from(this.models.values())
  }
}


