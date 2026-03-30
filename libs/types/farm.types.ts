export enum FarmTypes {
  Aquaculture = 'Nuôi trồng thủy hải sản',
  Crop = 'Trồng trọt',
  Livestock = 'Chăn nuôi',
}

export interface UpdateFarmRequest {
  address: string,
  latitude: number,
  longitude: number,
  locationName: string,
  imageUrl: string[],
  farmType: number,
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
  farmType: number,
  farmTypeName: FarmTypes,
  livestockCount: number,
  areaSize: number,
  isPrimary: boolean,
  images?: string[], // Mock up for image upload
  createdAt: string,
  updatedAt: string
}
