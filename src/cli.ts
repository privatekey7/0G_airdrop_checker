#!/usr/bin/env node

import { EligibilityChecker } from './eligibilityChecker.js'
import { AddressValidator } from './addressValidator.js'
import { MESSAGES } from './config.js'
import { Banner } from './banner.js'
import { promises as fs } from 'fs'
import { resolve } from 'path'

/**
 * CLI интерфейс для 0G Airdrop Eligibility Checker
 */
export class AirdropCheckerCLI {
  private checker: EligibilityChecker

  constructor() {
    this.checker = new EligibilityChecker()
  }

  /**
   * Основная функция CLI
   */
  async run(): Promise<void> {
    const args = process.argv.slice(2)
    
    if (args.length === 0) {
      this.showHelp()
      return
    }

    const command = args[0]

    switch (command) {
      case 'check':
        await this.checkAddresses(args.slice(1))
        break
      case 'file':
        await this.checkFromFile(args.slice(1))
        break
      case 'help':
      case '--help':
      case '-h':
        this.showHelp()
        break
      default:
        console.error(`Unknown command: ${command}`)
        this.showHelp()
        process.exit(1)
    }
  }

  /**
   * Проверяет адреса из командной строки
   */
  private async checkAddresses(addresses: string[]): Promise<void> {
    if (addresses.length === 0) {
      console.error('No addresses provided')
      this.showHelp()
      return
    }

    Banner.show()
    Banner.showCheckBanner(addresses.length)

    try {
      const results = await this.checker.checkAddresses(addresses)
      this.displayResults(results)
    } catch (error) {
      console.error('Full error in CLI checkAddresses:', error)
      console.error('Error checking addresses:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  }

  /**
   * Проверяет адреса из файла
   */
  private async checkFromFile(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.error('No file path provided')
      this.showHelp()
      return
    }

    const filePath = resolve(args[0])
    const outputPath = args[1] ? resolve(args[1]) : null

    Banner.show()
    console.log(`📁 Reading addresses from: ${filePath}`)
    console.log('')

    try {
      // Проверяем существование файла
      await fs.access(filePath)
      
      const results = await this.checker.checkAddressesFromFile(filePath)
      this.displayResults(results)

      if (outputPath) {
        const xlsxBuffer = await this.checker.exportToXLSX(results)
        await fs.writeFile(outputPath, xlsxBuffer)
        console.log(`\n💾 Results exported to: ${outputPath}`)
      }
    } catch (error) {
      console.error('Full error in CLI:', error)
      if (error instanceof Error && error.message.includes('ENOENT')) {
        console.error(`File not found: ${filePath}`)
      } else {
        console.error('Error checking addresses from file:', error instanceof Error ? error.message : 'Unknown error')
      }
      process.exit(1)
    }
  }


  /**
   * Отображает результаты проверки
   */
  private displayResults(results: any[]): void {
    if (results.length === 0) {
      console.log('No results to display')
      return
    }

    Banner.showResultsBanner()

    // Группируем результаты по статусу
    const eligible = results.filter(r => r.status === 'eligible')
    const notEligible = results.filter(r => r.status === 'not_eligible')
    const errors = results.filter(r => r.status === 'error')

    // Показываем eligible адреса
    if (eligible.length > 0) {
      console.log('')
      console.log('✅ ELIGIBLE ADDRESSES:')
      console.log('-'.repeat(50))
      eligible.forEach((result, index) => {
        console.log(`${(index + 1).toString().padStart(2, ' ')}. ${result.address}`)
        if (result.message) {
          console.log(`    ${result.message}`)
        }
      })
    }

    // Показываем not eligible адреса
    if (notEligible.length > 0) {
      console.log('')
      console.log('❌ NOT ELIGIBLE ADDRESSES:')
      console.log('-'.repeat(50))
      notEligible.forEach((result, index) => {
        console.log(`${(index + 1).toString().padStart(2, ' ')}. ${result.address}`)
        if (result.message) {
          console.log(`    ${result.message}`)
        }
      })
    }

    // Показываем ошибки
    if (errors.length > 0) {
      console.log('')
      console.log('⚠️  ERRORS:')
      console.log('-'.repeat(50))
      errors.forEach((result, index) => {
        console.log(`${(index + 1).toString().padStart(2, ' ')}. ${result.address}`)
        if (result.message) {
          console.log(`    ${result.message}`)
        }
      })
    }

    console.log('')
    this.displayStatistics(results)
  }

  /**
   * Отображает статистику
   */
  private displayStatistics(results: any[]): void {
    const stats = this.checker.getStatistics(results)
    
    Banner.showStatsBanner()
    console.log(`📋 Total addresses checked: ${stats.total}`)
    console.log(`✅ Eligible addresses: ${stats.eligible}`)
    console.log(`❌ Not eligible addresses: ${stats.notEligible}`)
    console.log(`⚠️  Errors: ${stats.errors}`)
    console.log('')
    console.log(`🎯 Success rate: ${stats.eligiblePercentage.toFixed(2)}%`)
    
    // Добавляем визуальный прогресс-бар
    const progressBar = Banner.createProgressBar(stats.eligible, stats.total, 30)
    console.log(`📈 Progress: ${progressBar}`)
    
    console.log('')
    console.log('💡 Tip: Eligible addresses can claim 0G tokens in the airdrop!')
  }


  /**
   * Возвращает эмодзи для статуса
   */
  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'eligible':
        return '✅'
      case 'not_eligible':
        return '❌'
      case 'error':
        return '⚠️'
      default:
        return '❓'
    }
  }

  /**
   * Показывает справку
   */
  private showHelp(): void {
    console.log(`
0G Airdrop Eligibility Checker

Usage:
  npm run dev check <address1> [address2] ...     Check specific addresses
  npm run dev file <input.txt> [output.xlsx]     Check addresses from file
  npm run dev help                               Show this help

Examples:
  npm run dev check 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
  npm run dev file addresses.txt results.xlsx
  npm run dev file wallets.txt

File format:
  - One address per line
  - Lines starting with # are ignored
  - CSV format supported (comma-separated)
`)
  }
}

// Запуск CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new AirdropCheckerCLI()
  cli.run().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
} else {
  // Запуск CLI для tsx
  const cli = new AirdropCheckerCLI()
  cli.run().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
