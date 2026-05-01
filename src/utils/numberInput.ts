import type { ChangeEvent } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

export function sanitizeNumericInput(value: string) {
  return value.replace(/[^\d]/g, '')
}

export function bindNumericInput(field: UseFormRegisterReturn) {
  return (event: ChangeEvent<HTMLInputElement>) => {
    event.currentTarget.value = sanitizeNumericInput(event.currentTarget.value)
    field.onChange(event)
  }
}
