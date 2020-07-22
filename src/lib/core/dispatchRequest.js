import adapter from '../adapters/index'


export default (config) => {
  return config.method === 'MULTIPLE' ? a : adapter(config)
}
