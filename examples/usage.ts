/**
 * Примеры использования 0G Airdrop Eligibility Checker
 */

import { EligibilityChecker, AddressValidator } from '../src/index.js'

async function examples() {
  const checker = new EligibilityChecker()

  console.log('=== Примеры использования 0G Airdrop Checker ===\n')

  // Пример 1: Проверка одного адреса
  console.log('1. Проверка одного адреса:')
  const singleResult = await checker.checkAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
  console.log(singleResult)
  console.log('')

  // Пример 2: Проверка нескольких адресов
  console.log('2. Проверка нескольких адресов:')
  const addresses = [
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    '0x0000000000000000000000000000000000000000',
    '0xinvalid'
  ]
  
  const multipleResults = await checker.checkAddresses(addresses)
  multipleResults.forEach(result => {
    console.log(`${result.address}: ${result.status}`)
  })
  console.log('')

  // Пример 3: Валидация адресов
  console.log('3. Валидация адресов:')
  const testAddresses = [
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    '0xINVALID',
    '0x0000000000000000000000000000000000000000'
  ]
  
  testAddresses.forEach(address => {
    const isValid = AddressValidator.isValidAddress(address)
    const normalized = AddressValidator.normalizeAddress(address)
    console.log(`${address}: valid=${isValid}, normalized=${normalized}`)
  })
  console.log('')

  // Пример 4: Статистика
  console.log('4. Статистика результатов:')
  const stats = checker.getStatistics(multipleResults)
  console.log(stats)
  console.log('')

  // Пример 5: Экспорт в CSV
  console.log('5. Экспорт в CSV:')
  const csv = checker.exportToCSV(multipleResults)
  console.log(csv)
  console.log('')

  // Пример 6: Фильтрация результатов
  console.log('6. Фильтрация результатов:')
  const eligibleResults = checker.filterResults(multipleResults, 'eligible')
  const errorResults = checker.filterResults(multipleResults, 'error')
  
  console.log(`Eligible addresses: ${eligibleResults.length}`)
  console.log(`Error addresses: ${errorResults.length}`)
}

// Запуск примеров
examples().catch(console.error)
