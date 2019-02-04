const getUrlParams = (query) => {
  if (!query) {
    return { };
  }

  return (/^[?#]/.test(query) ? query.slice(1) : query)
  .split('&')
  .reduce((params, param) => {
    const [key, value] = param.split('=');
    // eslint-disable-next-line no-param-reassign
    params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
    return params;
  }, { });
}

export default getUrlParams
