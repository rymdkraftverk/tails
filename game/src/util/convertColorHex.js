// Pixi.Graphics requires color code to start with 0x instead of #
export default color =>
  `0x${color.substring(1, color.length)}`
