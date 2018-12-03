const loading = document.createElement('div')
loading.innerHTML = 'loading...'
loading.setAttribute('id', 'loading')
document.getElementById('container').appendChild(loading)

document.addEventListener("DOMContentLoaded", (event) => {
  loading.remove()
});
