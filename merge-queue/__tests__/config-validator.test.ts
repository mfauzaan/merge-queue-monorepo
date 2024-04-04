/**
 * Unit tests for the config validator, src/config-validator.ts
 *
 * These tests are designed to validate the functionality of the ConfigValidator class,
 * specifically focusing on the validation of configuration inputs for a workflow action.
 * The tests cover scenarios where the configuration is both valid and invalid, ensuring
 * that the ConfigValidator appropriately identifies errors and returns the expected results.
 */

import { ConfigValidator } from '../src/config-validator'
import { ConfigMockInput } from './config-input'

describe('ConfigValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not return error', async () => {
    const configValidator = new ConfigValidator()
    const validationErrors = await configValidator.validate(
      ConfigMockInput.application
    )

    expect(validationErrors.length).toBe(0)
  })

  it('should return error', async () => {
    const configValidator = new ConfigValidator()
    const validationErrors = await configValidator.validate({
      ...ConfigMockInput.application,
      enable: 'not a boolean',
      workflows: {}
    })

    expect(validationErrors.length).toBe(4)
    expect(validationErrors).toEqual([
      'enable must be a boolean value',
      'workflows.provider must be a string',
      'workflows.each value in excluded_workflows must be a string',
      'workflows.excluded_workflows must be an array'
    ])
  })
})
