import { isAddress } from 'viem'
import { MIN_ADDRESS_LENGTH, MAX_ADDRESS_LENGTH } from './config.js'

/**
 * Валидатор EVM адресов для 0G Airdrop Checker
 */
export class AddressValidator {
  /**
   * Проверяет, является ли строка валидным EVM адресом
   */
  static isValidAddress(address: string): boolean {
    if (!address || typeof address !== 'string') {
      return false
    }

    // Проверяем длину
    if (address.length < MIN_ADDRESS_LENGTH || address.length > MAX_ADDRESS_LENGTH) {
      return false
    }

    // Проверяем формат с помощью viem
    return isAddress(address, { strict: false })
  }

  /**
   * Нормализует адрес (приводит к правильному формату)
   */
  static normalizeAddress(address: string): string | null {
    if (!this.isValidAddress(address)) {
      return null
    }

    try {
      // Приводим к lowercase для консистентности
      return address.toLowerCase()
    } catch (error) {
      return null
    }
  }

  /**
   * Валидирует и нормализует массив адресов
   */
  static validateAddresses(addresses: string[]): {
    valid: string[]
    invalid: string[]
  } {
    const valid: string[] = []
    const invalid: string[] = []

    for (const address of addresses) {
      const normalized = this.normalizeAddress(address)
      if (normalized) {
        valid.push(normalized)
      } else {
        invalid.push(address)
      }
    }

    return { valid, invalid }
  }

  /**
   * Удаляет дубликаты из массива адресов
   */
  static removeDuplicates(addresses: string[]): string[] {
    const normalized = addresses
      .map(addr => this.normalizeAddress(addr))
      .filter((addr): addr is string => addr !== null)

    return [...new Set(normalized)]
  }

  /**
   * Проверяет, является ли адрес нулевым адресом
   */
  static isZeroAddress(address: string): boolean {
    const normalized = this.normalizeAddress(address)
    if (!normalized) return false

    return normalized === '0x0000000000000000000000000000000000000000'
  }

  /**
   * Проверяет, является ли адрес контрактом (базовая проверка)
   */
  static isContractAddress(address: string): boolean {
    // Это базовая проверка, для точной проверки нужен RPC вызов
    const normalized = this.normalizeAddress(address)
    if (!normalized) return false

    // Проверяем, что адрес не нулевой
    if (this.isZeroAddress(normalized)) return false

    // Дополнительные проверки можно добавить здесь
    return true
  }
}
