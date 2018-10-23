const soundPath = fileName => `./sounds/${fileName}.wav`

export default {
  EXPLOSION:       soundPath('explosion'),
  COUNTDOWN_END:   soundPath('countdown_end'),
  COUNTDOWN:       soundPath('countdown'),
  JOIN1:           soundPath('join1'),
  JOIN2:           soundPath('join2'),
  JOIN3:           soundPath('join3'),
  POWERUP_EXPIRED: soundPath('powerup-expired'),
}
