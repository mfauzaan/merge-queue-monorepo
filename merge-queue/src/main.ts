import { HttpClient } from '@actions/http-client'
import { getInput, info, setFailed } from '@actions/core'
import { context } from '@actions/github'
import path from 'path'
import fs from 'fs-extra'
import toml from 'toml'
import { ConfigValidator } from './config-validator'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const secret: string = getInput('secret', { required: true })
    const base_url: string = getInput('base_url', { required: true })
    const is_canary = getInput('is_canary')
    const configPath = path.resolve('.wukong.toml')

    info(`👉 Config Path: (${configPath})`)

    let bufferConfig: Buffer | null

    try {
      bufferConfig = await fs.readFile(configPath)
    } catch (error) {
      bufferConfig = null
    }

    if (!bufferConfig) {
      info(`No config file found in the root of the repository`)
      return
    }

    const jsonConfig = toml.parse(bufferConfig.toString())

    info(`✅ Config file found: ${configPath}`)

    info('🔍 Validating the config file')
    const configValidator = new ConfigValidator()
    const validationErrors = await configValidator.validate(
      jsonConfig.application
    )

    if (validationErrors.length > 0) {
      setFailed(`Validation errors: ${JSON.stringify(validationErrors)}`)
      return
    }

    info('🎉 Wukong config successfully validated')

    await syncConfigFile(base_url, secret, is_canary, jsonConfig)

    info('🏁 Wukong action complete')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) setFailed(error.message)
  }
}

async function syncConfigFile(
  base_url: string,
  secret: string,
  is_canary: string,
  config: Record<string, unknown>
): Promise<void> {
  if (context.eventName === 'push' || context.eventName === 'pull_request') {
    const branchName = context.ref?.split('/').pop()

    if (branchName !== 'main' && branchName !== 'master') {
      info(`Not syncing because the branch is not main or master`)
      return
    }

    Object.assign(config, {
      repo_name: context.repo.repo
    })

    info('🔄 Syncing the config file to the API')

    const httpClient = new HttpClient()
    const response = await httpClient.post(base_url, JSON.stringify(config), {
      authorization: secret,
      'MV-Canary-Stage': is_canary === 'true' ? 'always' : '',
      'Content-Type': 'application/json'
    })

    if (response.message.statusCode !== 200) {
      setFailed(
        `Failed to sync the config file to the API: ${response.message.statusCode}`
      )
    }
  }
}
