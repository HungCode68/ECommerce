import axiosClient from '@/lib/axiosClient'
import type { PaginatedResponse } from '@/types/api.types'

export type AdminAuditLog = {
  id: number
  admin_id: number
  admin_name: string
  action: string
  entity_type: string
  entity_id: string | null
  old_values: string
  new_values: string
  created_at: string
}

export type AuditLogListResult = {
  data: AdminAuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export const adminAuditApi = {
  getList: async (params: { page: number; limit: number; entity_type?: string; action?: string }) => {
    const res = await axiosClient.get<PaginatedResponse<AdminAuditLog>>(
      '/api/admin/audit-logs',
      { params },
    )
    return {
      data: res.data.data ?? [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: res.data.pagination?.total ?? 0,
      },
    } satisfies AuditLogListResult
  },
}
