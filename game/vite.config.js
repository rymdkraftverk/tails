import { defineConfig } from 'vite'

const inlined = [
  'CONTROLLER_URL',
  'ERROR_LOGGING',
  'HTTP_ADDRESS',
  'VERSION',
  'WS_ADDRESS',
]

// bounded-kd-tree reads ramda off `.default`, which the ES build does not have
const RAMDA_WITH_DEFAULT = '\0ramda-with-default'

const ramdaDefaultForBoundedKdTree = {
  name:    'ramda-default-for-bounded-kd-tree',
  enforce: 'pre',
  resolveId(source, importer) {
    const needsDefault = source === 'ramda'
      && importer
      && importer.includes('bounded-kd-tree')

    return needsDefault ? RAMDA_WITH_DEFAULT : null
  },
  load(id) {
    return id === RAMDA_WITH_DEFAULT
      ? "import * as R from 'ramda'\nexport default R\n"
      : null
  },
}

export default defineConfig({
  base:    './',
  plugins: [ramdaDefaultForBoundedKdTree],
  define:  Object.fromEntries(
    inlined.map(key => [
      `process.env.${key}`,
      JSON.stringify(process.env[key] ?? null),
    ]),
  ),
  build: {
    assetsDir: 'bundle',
  },
  test: {
    globals: true,
  },
  server: {
    port:       8081,
    strictPort: true,
    host:       true,
  },
})
