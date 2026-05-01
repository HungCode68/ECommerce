import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'

type UserRole = 'user' | 'admin'
export type AdminUserStatus = 'active' | 'offline' | 'inactive' | 'blocked'

export type AdminUser = {
  id: number
  username: string
  email: string
  role: UserRole
  status: AdminUserStatus
  is_active: boolean
  last_active_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type AdminUserApiItem = {
  id: number
  username: string
  email: string
  role: UserRole
  is_active: boolean
  last_active_at?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

type CreateUserRequest = {
  name: string
  email: string
  password: string
  role: string
}

type UpdateUserRequest = {
  name?: string
  status?: string
}

type SearchUsersResponse = {
  users: AdminUserApiItem[]
  meta?: {
    total: number
    page: number
    limit: number
  }
}

export type AdminUserListResult = {
  data: AdminUser[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

const DAY_MS = 24 * 60 * 60 * 1000
const INACTIVE_AFTER_MS = 5 * DAY_MS

function parseDate(value: string | null | undefined): number {
  if (!value) {
    return Number.NaN
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? Number.NaN : parsed.getTime()
}

function getStatusFromTimestamps(user: AdminUserApiItem): AdminUserStatus {
  if (user.deleted_at || !user.is_active) {
    return 'blocked'
  }

  // created_at chỉ là thời điểm tạo tài khoản, không phải thời điểm hoạt động.
  const lastActivity = parseDate(user.last_active_at)
  if (!Number.isFinite(lastActivity)) {
    return 'inactive'
  }

  const elapsed = Date.now() - lastActivity
  if (elapsed <= DAY_MS) {
    return 'active'
  }
  if (elapsed <= INACTIVE_AFTER_MS) {
    return 'offline'
  }
  return 'inactive'
}

function mapUser(user: AdminUserApiItem): AdminUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: getStatusFromTimestamps(user),
    is_active: user.is_active,
    last_active_at: user.last_active_at ?? null,
    created_at: user.created_at,
    updated_at: user.updated_at,
    deleted_at: user.deleted_at ?? null,
  }
}

function softBlockUsers(ids: number[]) {
  return axiosClient.delete('/api/admin/users', { data: { ids } })
}

function softRestoreUsers(ids: number[]) {
  return axiosClient.post('/api/admin/users/restore', { ids })
}

export const adminUserApi = {
  getList: async (params: { page: number; limit: number }) => {
    const res = await axiosClient.get<ApiResponse<AdminUserApiItem[]>>(
      '/api/admin/users',
      { params },
    )
    const users = (res.data.data ?? []).map(mapUser)
    return {
      data: users,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: users.length,
      },
    } satisfies AdminUserListResult
  },

  search: async (q: string) => {
    const res = await axiosClient.get<ApiResponse<SearchUsersResponse>>(
      '/api/admin/users/search',
      { params: { keyword: q, page: 1, limit: 100 } },
    )
    return (res.data.data?.users ?? []).map(mapUser)
  },

  getDetail: async (id: number) => {
    const res = await axiosClient.get<ApiResponse<AdminUserApiItem>>(
      `/api/admin/users/${id}`,
    )
    return mapUser(res.data.data)
  },

  create: async (data: CreateUserRequest) => {
    const res = await axiosClient.post<ApiResponse<AdminUserApiItem>>(
      '/api/admin/users',
      data,
    )
    return mapUser(res.data.data)
  },

  update: async (id: number, data: UpdateUserRequest) => {
    const res = await axiosClient.put<ApiResponse<AdminUserApiItem>>(
      `/api/admin/users/${id}`,
      data,
    )
    return mapUser(res.data.data)
  },

  blockMany: async (ids: number[]) => {
    await softBlockUsers(ids)
  },

  deleteMany: async (ids: number[]) => {
    await softBlockUsers(ids)
  },

  restoreMany: async (ids: number[]) => {
    await softRestoreUsers(ids)
  },

  restoreOne: async (id: number) => {
    await softRestoreUsers([id])
  },
}
