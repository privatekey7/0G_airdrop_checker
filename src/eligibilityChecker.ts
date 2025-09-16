import { AddressValidator } from './addressValidator.js'
import { ApiClient } from './apiClient.js'
import { 
  type EligibilityResult, 
  type EligibilityStatus,
  MAX_ADDRESSES_PER_BATCH 
} from './config.js'
import ExcelJS from 'exceljs'

/**
 * Основной класс для проверки eligibility адресов
 */
export class EligibilityChecker {
  private apiClient: ApiClient
  private addressValidator: typeof AddressValidator

  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || new ApiClient()
    this.addressValidator = AddressValidator
  }

  /**
   * Проверяет eligibility одного адреса
   */
  async checkAddress(address: string): Promise<EligibilityResult> {
    // Валидация адреса
    if (!this.addressValidator.isValidAddress(address)) {
      return {
        address,
        status: 'error',
        message: 'Invalid EVM address format',
        timestamp: new Date()
      }
    }

    // Нормализация адреса
    const normalizedAddress = this.addressValidator.normalizeAddress(address)
    if (!normalizedAddress) {
      return {
        address,
        status: 'error',
        message: 'Failed to normalize address',
        timestamp: new Date()
      }
    }

    // Проверка через API
    return this.apiClient.checkEligibility(normalizedAddress)
  }

  /**
   * Проверяет eligibility нескольких адресов
   */
  async checkAddresses(addresses: string[]): Promise<EligibilityResult[]> {
    if (addresses.length === 0) {
      return []
    }

    if (addresses.length > MAX_ADDRESSES_PER_BATCH) {
      throw new Error(`Too many addresses. Maximum allowed: ${MAX_ADDRESSES_PER_BATCH}`)
    }

    // Валидация и нормализация адресов
    const { valid, invalid } = this.addressValidator.validateAddresses(addresses)
    
    const results: EligibilityResult[] = []

    // Добавляем ошибки для невалидных адресов
    for (const invalidAddress of invalid) {
      results.push({
        address: invalidAddress,
        status: 'error',
        message: 'Invalid EVM address format',
        timestamp: new Date()
      })
    }

    // Удаляем дубликаты
    const uniqueAddresses = this.addressValidator.removeDuplicates(valid)

    // Проверяем валидные адреса через API
    if (uniqueAddresses.length > 0) {
      const apiResults = await this.apiClient.checkMultipleEligibility(uniqueAddresses)
      results.push(...apiResults)
    }

    return results
  }

  /**
   * Проверяет eligibility адресов из файла
   */
  async checkAddressesFromFile(filePath: string): Promise<EligibilityResult[]> {
    try {
      const fs = await import('fs/promises')
      const content = await fs.readFile(filePath, 'utf-8')
      
      // Парсим адреса (поддерживаем разные форматы)
      const addresses = this.parseAddressesFromContent(content)
      
      return this.checkAddresses(addresses)
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Парсит адреса из текстового содержимого
   */
  private parseAddressesFromContent(content: string): string[] {
    const lines = content.split('\n')
    const addresses: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        // Поддерживаем разные форматы: один адрес на строку, CSV, JSON
        if (trimmed.includes(',')) {
          const parts = trimmed.split(',')
          addresses.push(...parts.map(part => part.trim()))
        } else {
          addresses.push(trimmed)
        }
      }
    }

    return addresses
  }

  /**
   * Экспортирует результаты в CSV формат
   */
  exportToCSV(results: EligibilityResult[]): string {
    const headers = ['Address', 'Status', 'Message', 'Timestamp']
    const rows = results.map(result => [
      result.address,
      result.status,
      result.message || '',
      result.timestamp.toISOString()
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  /**
   * Экспортирует результаты в XLSX формат
   */
  async exportToXLSX(results: EligibilityResult[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('0G Airdrop Results')

    // Настройка заголовков
    worksheet.columns = [
      { header: 'Address', key: 'address', width: 45 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Message', key: 'message', width: 50 },
      { header: 'Timestamp', key: 'timestamp', width: 25 }
    ]

    // Стилизация заголовков
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    }

    // Добавление данных
    results.forEach(result => {
      const row = worksheet.addRow({
        address: result.address,
        status: result.status,
        message: result.message || '',
        timestamp: result.timestamp.toISOString()
      })

      // Цветовая индикация статуса
      switch (result.status) {
        case 'eligible':
          row.getCell('status').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD4EDDA' }
          }
          break
        case 'not_eligible':
          row.getCell('status').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8D7DA' }
          }
          break
        case 'error':
          row.getCell('status').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFEAA7' }
          }
          break
      }
    })

    // Автофильтр
    worksheet.autoFilter = 'A1:D1'

    // Заморозка первой строки
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]

    // Добавление статистики на отдельный лист
    const statsSheet = workbook.addWorksheet('Statistics')
    const stats = this.getStatistics(results)
    
    statsSheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 15 }
    ]

    statsSheet.getRow(1).font = { bold: true }
    statsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    }

    statsSheet.addRows([
      { metric: 'Total Addresses', value: stats.total },
      { metric: 'Eligible Addresses', value: stats.eligible },
      { metric: 'Not Eligible Addresses', value: stats.notEligible },
      { metric: 'Errors', value: stats.errors },
      { metric: 'Success Rate (%)', value: stats.eligiblePercentage.toFixed(2) }
    ])

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  /**
   * Получает статистику по результатам
   */
  getStatistics(results: EligibilityResult[]): {
    total: number
    eligible: number
    notEligible: number
    errors: number
    eligiblePercentage: number
  } {
    const total = results.length
    const eligible = results.filter(r => r.status === 'eligible').length
    const notEligible = results.filter(r => r.status === 'not_eligible').length
    const errors = results.filter(r => r.status === 'error').length
    const eligiblePercentage = total > 0 ? (eligible / total) * 100 : 0

    return {
      total,
      eligible,
      notEligible,
      errors,
      eligiblePercentage
    }
  }

  /**
   * Фильтрует результаты по статусу
   */
  filterResults(results: EligibilityResult[], status: EligibilityStatus): EligibilityResult[] {
    return results.filter(result => result.status === status)
  }
}
