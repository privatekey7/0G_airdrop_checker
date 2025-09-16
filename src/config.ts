/**
 * Конфигурация для 0G Airdrop Eligibility Checker
 */

// API endpoints
export const AIRDROP_BASE_URL = 'https://airdrop.0gfoundation.ai'
export const ELIGIBILITY_CHECK_ENDPOINT = '/api/eligibility'

// Настройки запросов
export const REQUEST_TIMEOUT = 30000
export const MAX_RETRIES = 3
export const RETRY_DELAY = 1000

// Настройки валидации
export const MIN_ADDRESS_LENGTH = 42
export const MAX_ADDRESS_LENGTH = 42

// Настройки UI
export const MAX_ADDRESSES_PER_BATCH = 100
export const RESULTS_PER_PAGE = 20

// Сообщения
export const MESSAGES = {
  eligible: '✅ Eligible',
  notEligible: '❌ Not Eligible',
  error: '⚠️ Error',
  invalidAddress: 'Invalid EVM address format',
  networkError: 'Network error occurred',
  rateLimit: 'Rate limit exceeded, please try again later'
} as const

// Типы результатов
export type EligibilityStatus = 'eligible' | 'not_eligible' | 'error'

export interface EligibilityResult {
  address: string
  status: EligibilityStatus
  message?: string
  timestamp: Date
}

export interface CheckerConfig {
  baseUrl: string
  timeout: number
  maxRetries: number
  retryDelay: number
}
