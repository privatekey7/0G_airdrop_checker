import fetch, { type Response } from 'node-fetch'
import { 
  AIRDROP_BASE_URL, 
  ELIGIBILITY_CHECK_ENDPOINT, 
  REQUEST_TIMEOUT, 
  MAX_RETRIES, 
  RETRY_DELAY,
  type EligibilityResult,
  type EligibilityStatus 
} from './config.js'

/**
 * HTTP клиент для работы с API 0G Foundation
 */
export class ApiClient {
  private baseUrl: string
  private timeout: number
  private maxRetries: number
  private retryDelay: number

  constructor(
    baseUrl: string = AIRDROP_BASE_URL,
    timeout: number = REQUEST_TIMEOUT,
    maxRetries: number = MAX_RETRIES,
    retryDelay: number = RETRY_DELAY
  ) {
    this.baseUrl = baseUrl
    this.timeout = timeout
    this.maxRetries = maxRetries
    this.retryDelay = retryDelay
  }

  /**
   * Получает базовые заголовки для запросов
   */
  private getBaseHeaders(): Record<string, string> {
    return {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'ru,ru-RU;q=0.9,en-US;q=0.8,en;q=0.7',
      'clq-app-id': '0g',
      'DNT': '1',
      'Priority': 'u=1, i',
      'Referer': 'https://airdrop.0gfoundation.ai/flow',
      'Sec-Ch-Ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      'X-Kl-Saas-Ajax-Request': 'Ajax_Request'
    }
  }

  /**
   * Выполняет HTTP запрос с retry логикой
   */
  private async makeRequest(
    url: string, 
    options: any = {}, 
    retryCount: number = 0
  ): Promise<Response> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': '0G-Airdrop-Checker/1.0.0',
          ...options.headers
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.log(`Retry ${retryCount + 1}/${this.maxRetries} for ${url}`)
        await this.delay(this.retryDelay * (retryCount + 1))
        return this.makeRequest(url, options, retryCount + 1)
      }
      throw error
    }
  }

  /**
   * Задержка между запросами
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Проверяет eligibility одного адреса
   */
  async checkEligibility(address: string): Promise<EligibilityResult> {
    try {
      console.log(`Checking eligibility for: ${address}`)
      
      // Используем GET запрос с параметром walletAddresses
      const url = `${this.baseUrl}${ELIGIBILITY_CHECK_ENDPOINT}?walletAddresses=${address}`
      
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers: this.getBaseHeaders()
      })

      const data = await response.json() as any

      return {
        address,
        status: this.parseEligibilityStatus(data),
        message: data.message || this.getStatusMessage(this.parseEligibilityStatus(data)),
        timestamp: new Date()
      }
    } catch (error) {
      console.error(`Error checking eligibility for ${address}:`, error)
      console.error('Full error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        url: `${this.baseUrl}${ELIGIBILITY_CHECK_ENDPOINT}?walletAddresses=${address}`
      })
      
      return {
        address,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  /**
   * Получает сообщение для статуса
   */
  private getStatusMessage(status: EligibilityStatus): string {
    switch (status) {
      case 'eligible':
        return 'Address is eligible for airdrop'
      case 'not_eligible':
        return 'Address is not eligible for airdrop'
      case 'error':
        return 'Error checking eligibility'
      default:
        return 'Unknown status'
    }
  }

  /**
   * Проверяет eligibility нескольких адресов
   */
  async checkMultipleEligibility(addresses: string[]): Promise<EligibilityResult[]> {
    if (addresses.length === 0) {
      return []
    }

    try {
      console.log(`Checking eligibility for ${addresses.length} addresses`)
      
      // Используем GET запрос с несколькими адресами через запятую
      const walletAddresses = addresses.join(',')
      const url = `${this.baseUrl}${ELIGIBILITY_CHECK_ENDPOINT}?walletAddresses=${walletAddresses}`
      
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers: this.getBaseHeaders()
      })

      const data = await response.json() as any

      // Парсим ответ для каждого адреса
      return this.parseMultipleEligibilityResponse(addresses, data)
    } catch (error) {
      console.error('Error checking multiple eligibility:', error)
      console.error('Full error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        url: `${this.baseUrl}${ELIGIBILITY_CHECK_ENDPOINT}?walletAddresses=${addresses.join(',')}`
      })
      
      // В случае ошибки возвращаем ошибку для всех адресов
      return addresses.map(address => ({
        address,
        status: 'error' as EligibilityStatus,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }))
    }
  }

  /**
   * Парсит ответ для нескольких адресов
   */
  private parseMultipleEligibilityResponse(addresses: string[], data: any): EligibilityResult[] {
    const results: EligibilityResult[] = []

    for (const address of addresses) {
      let status: EligibilityStatus = 'error'
      let message = 'Unknown status'

      // Пытаемся найти данные для конкретного адреса
      if (data && typeof data === 'object') {
        // Новый формат: {"total":"1","detail":{"evm":{"0x...":"1"}}}
        if (data.detail && data.detail.evm) {
          const evmData = data.detail.evm
          const normalizedAddress = address.toLowerCase()
          
          if (evmData[normalizedAddress]) {
            const score = evmData[normalizedAddress]
            status = (score && score !== '0' && score !== 0) ? 'eligible' : 'not_eligible'
            message = status === 'eligible' ? `Eligible with score: ${score}` : 'Not eligible'
          } else {
            status = 'not_eligible'
            message = 'Not eligible'
          }
        } else if (data[address]) {
          status = this.parseEligibilityStatus(data[address])
          message = data[address].message || this.getStatusMessage(status)
        } else if (data.eligible && Array.isArray(data.eligible)) {
          // Если API возвращает массив eligible адресов
          status = data.eligible.includes(address) ? 'eligible' : 'not_eligible'
          message = this.getStatusMessage(status)
        } else if (data.notEligible && Array.isArray(data.notEligible)) {
          // Если API возвращает массив not eligible адресов
          status = data.notEligible.includes(address) ? 'not_eligible' : 'eligible'
          message = this.getStatusMessage(status)
        } else {
          // Пытаемся парсить общий статус
          status = this.parseEligibilityStatus(data)
          message = data.message || this.getStatusMessage(status)
        }
      }

      results.push({
        address,
        status,
        message,
        timestamp: new Date()
      })
    }

    return results
  }

  /**
   * Парсит статус eligibility из ответа API
   */
  private parseEligibilityStatus(data: any): EligibilityStatus {
    if (!data || typeof data !== 'object') {
      return 'error'
    }

    // Парсим ответ в формате {"total":"1","detail":{"evm":{"0x...":"1"}}}
    if (data.detail && data.detail.evm) {
      const evmData = data.detail.evm
      // Если есть данные для адреса, считаем eligible
      for (const address in evmData) {
        const score = evmData[address]
        if (score && score !== '0' && score !== 0) {
          return 'eligible'
        }
      }
      return 'not_eligible'
    }

    // Старый формат для совместимости
    const status = data.status || data.eligible
    
    if (status === true || status === 'eligible') {
      return 'eligible'
    } else if (status === false || status === 'not_eligible') {
      return 'not_eligible'
    } else {
      return 'error'
    }
  }

  /**
   * Проверяет доступность API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/health`, {
        method: 'GET'
      })
      return response.ok
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }
}
