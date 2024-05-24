# Wukong GitHub action

This action validates the `.wukong.toml` in the current repository
and sync the latest changes to the `wukong-api`

## Inputs

### `base_url`

**Required** The base URL for wukong API

### `secret_key`

**Required** The secret key used to in the API to sync the changes

## Example usage

```yaml
uses: mindvalley/mv-wukong-gh-action
with:
  secret_key: 'SECRET_KEY'
  base_url: 'BASE_URL'
  is_canary: false (Optional field)
```
