/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */
import { HttpClient, HttpClientResponse } from '@actions/http-client'
import * as http from 'http'
import * as core from '@actions/core'
import * as main from '../src/main'
import { ConfigValidator } from '../src/config-validator'
import * as github from '@actions/github'
import fs from 'fs-extra'
import { ConfigMockInput } from './config-input'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')
jest.mock('@actions/github')
jest.mock('@actions/core')
jest.mock('fs-extra')

// Mock the GitHub Actions core library
let infoMock: jest.SpyInstance
let setFailedMock: jest.SpyInstance
let configValidatorMock: jest.SpyInstance
let httpPostMock: jest.SpyInstance

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    infoMock = jest.spyOn(core, 'info')
    setFailedMock = jest.spyOn(core, 'setFailed')
    configValidatorMock = jest
      .spyOn(ConfigValidator.prototype, 'validate')
      .mockResolvedValue([])

    const httpClientResponse = new HttpClientResponse(
      {} as http.IncomingMessage
    )
    httpPostMock = jest
      .spyOn(HttpClient.prototype, 'post')
      .mockResolvedValue(httpClientResponse)
  })

  it("should not continue if the .wukong.toml file doesn't exist", async () => {
    jest.spyOn(fs, 'readFile').mockImplementationOnce(async () => {
      return Promise.reject(
        new Error("ENOENT: no such file or directory, open '.wukong.toml'")
      )
    })

    await main.run()

    expect(runMock).toHaveReturned()
    expect(infoMock).toHaveBeenNthCalledWith(
      2,
      'No config file found in the root of the repository'
    )
    expect(configValidatorMock).not.toHaveBeenCalled()
  })

  it('should validate if the .wukong.toml file exists', async () => {
    await main.run()

    expect(runMock).toHaveReturned()
    expect(configValidatorMock).toHaveBeenCalledWith(
      ConfigMockInput.application
    )
  })

  it('should fail if the .wukong.toml file has validation errors', async () => {
    configValidatorMock.mockResolvedValueOnce(['Error 1', 'Error 2'])

    await main.run()

    expect(runMock).toHaveReturned()
    expect(configValidatorMock).toHaveBeenCalledWith(
      ConfigMockInput.application
    )
    expect(setFailedMock).toHaveBeenCalledWith(
      'Validation errors: ["Error 1","Error 2"]'
    )
  })

  it('should sync the config file to the API if the event is a push and the branch is main or master', async () => {
    await main.run()

    expect(runMock).toHaveReturned()
    expect(infoMock).toHaveBeenNthCalledWith(
      5,
      '🔄 Syncing the config file to the API'
    )
    expect(httpPostMock).toHaveBeenCalledWith(
      'https://mv.com',
      JSON.stringify({
        ...ConfigMockInput,
        repo_name: 'your-repo'
      }),
      {
        authorization: 'my-secret',
        'MV-Canary-Stage': 'always',
        'Content-Type': 'application/json'
      }
    )
  })

  it('should return setFailed if the API request fails', async () => {
    httpPostMock.mockRejectedValueOnce(new Error('API request failed'))

    await main.run()

    expect(runMock).toHaveReturned()
    expect(setFailedMock).toHaveBeenCalledWith('API request failed')
  })

  it('should not sync the config file to the API if the branch is not main or master', async () => {
    github.context.ref = 'refs/heads/feature-branch'

    await main.run()

    expect(runMock).toHaveReturned()
    expect(infoMock).toHaveBeenNthCalledWith(
      5,
      `Not syncing because the branch is not main or master`
    )

    expect(httpPostMock).not.toHaveBeenCalled()
  })

  it('should not sync the config file to the API if the event is not a push or pull_request', async () => {
    github.context.eventName = 'workflow_dispatch'

    await main.run()

    expect(runMock).toHaveReturned()
    expect(infoMock).not.toHaveBeenNthCalledWith(
      4,
      '🔄 Syncing the config file to the API'
    )
    expect(httpPostMock).not.toHaveBeenCalled()
  })
})
