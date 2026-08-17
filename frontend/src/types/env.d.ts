/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly CBOMKIT_HTTP_API_BASE: string
  readonly CBOMKIT_WS_API_BASE: string
  readonly CBOMKIT_POLICY_NAME: string
  readonly CBOMKIT_TITLE: string
  readonly CBOMKIT_VIEWER_ONLY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
