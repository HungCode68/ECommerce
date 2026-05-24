import axiosClient from '@/lib/axiosClient'
import type { ApiResponse } from '@/types/api.types'

type UserRole = 'user' | 'admin'
export type AdminUserStatus = 'active' | 'offline' | 'blocked'

export type AdminUser = {
  id: number
  username: string
  email: string
  role: UserRole
  status: AdminUserStatus
  is_active: boolean
  last_active_at: string | null
  blocked_reason: string | null
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
  blocked_reason?: string | null
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
  role?: UserRole
  is_active?: boolean
  blocked_reason?: string | null
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

  const activityReference = Number.isFinite(parseDate(user.last_active_at))
    ? parseDate(user.last_active_at)
    : parseDate(user.created_at)

  const elapsed = Date.now() - activityReference
  if (elapsed <= DAY_MS) {
    return 'active'
  }
  return 'offline'
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
    blocked_reason: user.blocked_reason ?? null,
    created_at: user.created_at,
    updated_at: user.updated_at,
    deleted_at: user.deleted_at ?? null,
  }
}

function softBlockUsers(ids: number[], reason: string) {
  return axiosClient.delete('/api/admin/users', { data: { ids, reason } })
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

  blockMany: async (ids: number[], reason: string) => {
    await softBlockUsers(ids, reason)
  },

  deleteMany: async (ids: number[], reason = 'Không có lý do') => {
    await softBlockUsers(ids, reason)
  },

  restoreMany: async (ids: number[]) => {
    await softRestoreUsers(ids)
  },

  restoreOne: async (id: number) => {
    await softRestoreUsers([id])
  },
}
