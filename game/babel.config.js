module.exports = {
  presets: [
    '@babel/preset-env',
  ],
  plugins: [
    ['transform-inline-environment-variables',
      {
        include: [
          'CONTROLLER_URL',
          'ERROR_LOGGING',
          'HTTP_ADDRESS',
          'VERSION',
          'WS_ADDRESS',
        ],
      }],
  ],
}
