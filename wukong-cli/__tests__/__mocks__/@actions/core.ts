export function getInput(input: string): string | undefined {
  switch (input) {
    case 'secret':
      return 'my-secret'
    case 'base_url':
      return 'https://mv.com'
    case 'is_canary':
      return 'true'
  }
}

export function setFailed(): void {}

export function info(): void {}
