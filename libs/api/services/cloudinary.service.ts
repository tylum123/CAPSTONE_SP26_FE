import axiosInstance from '../axios-instance'
import { API_ENDPOINTS } from '../endpoints/config'
import type { ApiResponse } from '@/libs/types'

const getAuthHeaders = () => {
	const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
	return token ? { Authorization: `Bearer ${token}` } : {}
}

const getMultipartHeaders = () => ({
	...getAuthHeaders(),
	'Content-Type': 'multipart/form-data',
})

const createFormData = (field: string, files: File | File[]) => {
	const formData = new FormData()

	if (Array.isArray(files)) {
		files.forEach((file) => formData.append(field, file))
	} else {
		formData.append(field, files)
	}

	return formData
}

export const cloudinaryService = {
	uploadImage: async (file: File): Promise<ApiResponse<string>> => {
		const formData = createFormData('image', file)
		const response = await axiosInstance.post(API_ENDPOINTS.MEDIA.UPLOAD_IMAGE, formData, {
			headers: getMultipartHeaders(),
		})
		return response.data
	},

	uploadImages: async (files: File[]): Promise<ApiResponse<string[]>> => {
		const formData = createFormData('images', files)
		const response = await axiosInstance.post(API_ENDPOINTS.MEDIA.UPLOAD_IMAGES, formData, {
			headers: getMultipartHeaders(),
		})
		return response.data
	},

	uploadVideo: async (file: File): Promise<ApiResponse<string>> => {
		const formData = createFormData('video', file)
		const response = await axiosInstance.post(API_ENDPOINTS.MEDIA.UPLOAD_VIDEO, formData, {
			headers: getMultipartHeaders(),
		})
		return response.data
	},

	uploadVideos: async (files: File[]): Promise<ApiResponse<string[]>> => {
		const formData = createFormData('videos', files)
		const response = await axiosInstance.post(API_ENDPOINTS.MEDIA.UPLOAD_VIDEOS, formData, {
			headers: getMultipartHeaders(),
		})
		return response.data
	},

	uploadRawFile: async (file: File): Promise<ApiResponse<string>> => {
		const formData = createFormData('rawFile', file)
		const response = await axiosInstance.post(API_ENDPOINTS.MEDIA.UPLOAD_RAW_FILE, formData, {
			headers: getMultipartHeaders(),
		})
		return response.data
	},

	uploadRawFiles: async (files: File[]): Promise<ApiResponse<string[]>> => {
		const formData = createFormData('rawFiles', files)
		const response = await axiosInstance.post(API_ENDPOINTS.MEDIA.UPLOAD_RAW_FILES, formData, {
			headers: getMultipartHeaders(),
		})
		return response.data
	},

	deleteResource: async (publicId: string): Promise<ApiResponse<any>> => {
		const response = await axiosInstance.delete(API_ENDPOINTS.MEDIA.DELETE_RESOURCE, {
			headers: getAuthHeaders(),
			data: { publicId },
		})
		return response.data
	},

	deleteResources: async (publicIds: string[]): Promise<ApiResponse<any>> => {
		const response = await axiosInstance.delete(API_ENDPOINTS.MEDIA.DELETE_RESOURCES, {
			headers: getAuthHeaders(),
			data: { publicIds },
		})
		return response.data
	},
}

