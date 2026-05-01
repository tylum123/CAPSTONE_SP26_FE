export interface UpdateFarmRequest {
  address: string,
  latitude: number,
  longitude: number,
  locationName: string,
  imageUrl: string[],
  farmTypeId: string,
  livestockCount: number,
  areaSize: number,
  isPrimary: boolean,
}

export interface GetFarmResponse {
  farmId: string,
  farmerProfileId?: string,
  address: string,
  latitude: number,
  longitude: number,
  locationName: string,
  imageUrl: string[],
  farmTypeId: string,
  farmTypeName: string,
  livestockCount: number,
  areaSize: number,
  isPrimary: boolean,
  images?: string[], // Mock up for image upload
  createdAt: string,
  updatedAt: string
}
