import {
  isObject, isFunction
} from '../../libs/mobius-utils.js'

/**
* @param { Function | {  position?, mode?, func } } lifetimes
*/
export const equipLifetimes = (options, lifetimes) => {
  Object.entries(lifetimes).forEach(([name, lifetime]) => {
    if (!isObject(lifetime) && !isFunction(lifetime)) {
      throw (new TypeError(`"lifetime" is expected to be type of "Object" | "Function", but received "${typeof lifetime}".`))
    }
    const { position = 'pre', mode = 'inject', func } = isFunction(lifetime) ? ({ func: lifetime }) : lifetime

    if (!func) {
      throw (new TypeError('"func" is required when lifetime is of type "Object".'))
    }

    if (!options[name] || mode === 'overwrite') {
      options[name] = function (...args) {
        func.call(this, ...args)
      }
    } else if (mode === 'inject') {
      const _origin = options[name]
      options[name] = function (...args) {
        if (position === 'pre') {
          func.call(this, ...args)
        }
        _origin.call(this, ...args)
        if (position === 'post') {
          func.call(this, ...args)
        }
      }
    }
  })
  return options
}
