declare namespace NodeJS {
  interface ProcessEnv {
    CONTROLLER_URL?: string
    SENTRY_DSN?: string
    HTTP_ADDRESS?: string
    REACT_APP_VERSION?: string
    REACT_APP_WS_ADDRESS?: string
    VERSION?: string
    WS_ADDRESS?: string
  }
}

declare const process: { env: NodeJS.ProcessEnv }

interface Window {
  debug: Record<string, unknown>
}
