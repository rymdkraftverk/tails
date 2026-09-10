declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_ERROR_LOGGING?: string
    REACT_APP_VERSION?: string
    REACT_APP_WS_ADDRESS?: string
  }
}

declare const process: { env: NodeJS.ProcessEnv }

interface NetworkInformation {
  effectiveType?: string
  type?: string
}

interface Navigator {
  connection?: NetworkInformation
  mozConnection?: NetworkInformation
  webkitConnection?: NetworkInformation
  mozVibrate?: Navigator['vibrate']
  msVibrate?: Navigator['vibrate']
  webkitVibrate?: Navigator['vibrate']
}
