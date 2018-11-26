const soundPath = fileName => `./sounds/${fileName}.wav`

export default {
  COUNTDOWN:       soundPath('countdown'),
  COUNTDOWN_END:   soundPath('countdown_end'),
  EXPLOSION:       soundPath('explosion'),
  JOIN1:           soundPath('join1'),
  JOIN2:           soundPath('join2'),
  JOIN3:           soundPath('join3'),
  POWERUP_EXPIRED: soundPath('powerup-expired'),
}
