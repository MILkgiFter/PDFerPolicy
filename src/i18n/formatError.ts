import type { ToolkitParams } from '../lib/ToolkitError'
import { ToolkitError } from '../lib/ToolkitError'

export type TFn = (key: string, params?: ToolkitParams) => string

export function messageFromCaught(err: unknown, t: TFn): string {
  if (err instanceof ToolkitError) return t(err.code, err.params)
  if (err instanceof Error) return err.message
  return t('err_generic')
}
