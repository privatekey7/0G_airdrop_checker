/**
 * 0G Airdrop Eligibility Checker
 * 
 * Основной модуль для проверки eligibility адресов в airdrop 0G Foundation
 */

export { EligibilityChecker } from './eligibilityChecker.js'
export { AddressValidator } from './addressValidator.js'
export { ApiClient } from './apiClient.js'
export { 
  type EligibilityResult, 
  type EligibilityStatus,
  type CheckerConfig,
  MESSAGES,
  AIRDROP_BASE_URL,
  ELIGIBILITY_CHECK_ENDPOINT
} from './config.js'

// CLI интерфейс
export { AirdropCheckerCLI } from './cli.js'
