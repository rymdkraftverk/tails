import QRCode from 'qrcode'

const ELEMENT_ID = 'qr-code'

export const hide = () => {
  const element = document.getElementById(ELEMENT_ID)
  if (element) element.remove()
}

export const display = (controllerUrl, gameCode) => {
  const url = `http://${controllerUrl}/?code=${gameCode}`
  QRCode.toCanvas(url, (_error, qrElement) => {
    qrElement.setAttribute('id', ELEMENT_ID)

    document
      .getElementById('game')
      .appendChild(qrElement)
  })
}
