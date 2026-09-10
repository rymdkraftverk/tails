const getUrlParams = (query?: string): Record<string, string> => {
  if (!query) {
    return {}
  }

  return (/^[?#]/.test(query) ? query.slice(1) : query)
    .split('&')
    .reduce<Record<string, string>>((params, param) => {
      const [key, value] = param.split('=')
      params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : ''
      return params
    }, {})
}

export default getUrlParams
