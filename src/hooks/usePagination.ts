import { useState } from 'react'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/utils/constants'

type UsePaginationOptions = {
  initialPage?: number
  initialLimit?: number
}

export function usePagination({
  initialPage = DEFAULT_PAGE,
  initialLimit = DEFAULT_PAGE_SIZE,
}: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)

  const totalPages = (total: number) => Math.ceil(total / limit)

  const goToPage = (newPage: number) => {
    setPage(newPage)
  }

  const reset = () => {
    setPage(DEFAULT_PAGE)
  }

  return { page, limit, totalPages, goToPage, reset }
}
