/**
 * ANSI заставка для 0G Labs Airdrop Checker
 * Красивое ASCII-арт оформление без эмодзи
 */

export class Banner {
  private static readonly COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgBlue: '\x1b[44m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m'
  }

  /**
   * Показать главную заставку
   */
  static show (): void {
    console.clear()
    console.log(this.createMainBanner())
    console.log(this.createSubtitle())
    console.log(this.createSeparator())
    console.log('')
  }

  /**
   * Создать главный баннер
   */
  private static createMainBanner (): string {
    const banner = `
${this.COLORS.cyan}${this.COLORS.bright}
          ██████╗  ██████╗     ██╗      █████╗ ██████╗ ███████╗
         ██    ██╗██╔════╝     ██║     ██╔══██╗██╔══██╗██╔════╝
         ██    ██║██║  ███╗    ██║     ███████║██████╔╝███████╗
         ██    ██║██║   ██║    ██║     ██╔══██║██╔══██╗╚════██║
          ██████╔╝╚██████╔╝    ███████╗██║  ██║██████╔╝███████║
          ╚═════╝  ╚═════╝     ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝
${this.COLORS.reset}`
    return banner
  }

  /**
   * Создать подзаголовок
   */
  private static createSubtitle (): string {
    const subtitle = `
${this.COLORS.yellow}${this.COLORS.bright}                     AIRDROP ELIGIBILITY CHECKER${this.COLORS.reset}
${this.COLORS.dim}                    Check your wallet eligibility${this.COLORS.reset}`
    return subtitle
  }

  /**
   * Создать разделитель
   */
  private static createSeparator (): string {
    const separator = `${this.COLORS.blue}${'='.repeat(55)}${this.COLORS.reset}`
    return separator
  }

  /**
   * Создать прогресс-бар с анимацией
   */
  static createProgressBar (current: number, total: number, width: number = 50): string {
    const percentage = Math.round((current / total) * 100)
    const filled = Math.round((current / total) * width)
    const empty = width - filled

    const bar = `${this.COLORS.green}${'█'.repeat(filled)}${this.COLORS.dim}${'░'.repeat(empty)}${this.COLORS.reset}`
    return `[${bar}] ${percentage}% (${current}/${total})`
  }

  /**
   * Показать баннер с информацией о проверке
   */
  static showCheckBanner (addressCount: number): void {
    console.log('')
    console.log(`${this.COLORS.cyan}${this.COLORS.bright}🔍 Checking ${addressCount} wallet address(es) for 0G Labs airdrop eligibility...${this.COLORS.reset}`)
    console.log('')
  }

  /**
   * Показать баннер результатов
   */
  static showResultsBanner (): void {
    console.log('')
    console.log(`${this.COLORS.green}${this.COLORS.bright}🎯 0G Labs Airdrop Eligibility Results${this.COLORS.reset}`)
    console.log(`${this.COLORS.blue}${'='.repeat(60)}${this.COLORS.reset}`)
  }

  /**
   * Показать баннер статистики
   */
  static showStatsBanner (): void {
    console.log('')
    console.log(`${this.COLORS.magenta}${this.COLORS.bright}📊 SUMMARY STATISTICS${this.COLORS.reset}`)
    console.log(`${this.COLORS.blue}${'='.repeat(50)}${this.COLORS.reset}`)
  }
}