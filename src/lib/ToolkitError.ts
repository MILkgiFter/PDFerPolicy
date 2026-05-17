export type ToolkitParams = Record<string, string | number>

/** Ошибки pdfToolkit / локального парсинга с ключом для перевода в UI */
export class ToolkitError extends Error {
  readonly code: string
  readonly params?: ToolkitParams

  constructor(code: string, params?: ToolkitParams, options?: ErrorOptions) {
    super(code, options)
    this.name = 'ToolkitError'
    this.code = code
    this.params = params
  }
}
