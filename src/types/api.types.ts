export type ApiResponse<T> = {
  code: number
  message: string
  data: T
  errors: null | Record<string, string>
}

export type PaginatedResponse<T> = {
  code: number
  message: string
  data: T[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
  errors: null
}

export type PaginationParams = {
  page?: number
  limit?: number
}
