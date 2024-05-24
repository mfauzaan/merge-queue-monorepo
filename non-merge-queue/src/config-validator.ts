import 'reflect-metadata'
import { Type, plainToInstance } from 'class-transformer'
import { iterate } from 'iterare'
import {
  validate,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  ValidationError
} from 'class-validator'

class ApplicationNamespaceBuildConfig {
  @IsString()
  build_workflow: string
}

class ApplicationNamespaceDeliveryConfig {
  @IsString()
  target: string

  @IsNumber()
  base_replica: number

  @IsString()
  rollout_strategy: string
}

class ApplicationNamespaceAppsignalConfig {
  @IsBoolean()
  enable: boolean

  @IsString()
  environment: string

  @IsString()
  default_namespace: string
}

class ApplicationNamespaceHoneycombConfig {
  @IsBoolean()
  enable: boolean

  @IsString()
  dataset: string
}

class ApplicationWorkflowConfig {
  @IsString()
  provider: string

  @IsArray()
  @IsString({ each: true })
  excluded_workflows: string[]
}

class ApplicationNamespaceCloudsqlConfig {
  @IsBoolean()
  enable: boolean

  @IsString()
  project_id: string
}

class ApplicationAddonElixirLivebookConfig {
  @IsBoolean()
  enable: boolean

  @IsArray()
  @IsString({ each: true })
  allowed_admins: string[]
}

class ApplicationAddonsConfig {
  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationAddonElixirLivebookConfig)
  elixir_livebook?: ApplicationAddonElixirLivebookConfig
}

class ApplicationNamespaceConfig {
  @IsString()
  type: string

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationNamespaceBuildConfig)
  build?: ApplicationNamespaceBuildConfig

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationNamespaceDeliveryConfig)
  delivery?: ApplicationNamespaceDeliveryConfig

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationNamespaceAppsignalConfig)
  appsignal?: ApplicationNamespaceAppsignalConfig

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationNamespaceHoneycombConfig)
  honeycomb?: ApplicationNamespaceHoneycombConfig

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationNamespaceCloudsqlConfig)
  cloudsql?: ApplicationNamespaceCloudsqlConfig
}

class ApplicationConfig {
  @IsString()
  name: string

  @IsBoolean()
  enable: boolean

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationWorkflowConfig)
  workflows?: ApplicationWorkflowConfig

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationNamespaceConfig)
  namespaces: ApplicationNamespaceConfig[]

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationAddonsConfig)
  addons?: ApplicationAddonsConfig
}

export class ConfigValidator {
  async validate(parsedConfig: Record<string, unknown>): Promise<string[]> {
    const errors = await validate(
      plainToInstance(ApplicationConfig, parsedConfig),
      {
        skipMissingProperties: false,
        skipNullProperties: false,
        skipUndefinedProperties: false,
        enableDebugMessages: true,
        forbidUnknownValues: true
      }
    )

    return this.flattenValidationErrors(errors)
  }

  protected flattenValidationErrors(
    validationErrors: ValidationError[]
  ): string[] {
    return iterate(validationErrors)
      .map(error => this.mapChildrenToValidationErrors(error))
      .flatten()
      .filter(item => !!item.constraints)
      .map(item => Object.values(item.constraints))
      .flatten()
      .toArray()
  }

  protected mapChildrenToValidationErrors(
    error: ValidationError,
    parentPath?: string
  ): ValidationError[] {
    if (!(error.children && error.children.length)) {
      return [error]
    }

    const validationErrors = []
    parentPath = parentPath ? `${parentPath}.${error.property}` : error.property

    for (const item of error.children) {
      if (item.children && item.children.length) {
        validationErrors.push(
          ...this.mapChildrenToValidationErrors(item, parentPath)
        )
      }
      validationErrors.push(
        this.prependConstraintsWithParentProp(parentPath, item)
      )
    }

    return validationErrors
  }

  protected prependConstraintsWithParentProp(
    parentPath: string,
    error: ValidationError
  ): ValidationError {
    const constraints: Record<string, string> = {}

    for (const key in error.constraints) {
      constraints[key] = `${parentPath}.${error.constraints[key]}`
    }

    return {
      ...error,
      constraints
    }
  }
}
