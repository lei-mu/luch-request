'use strict'

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
export function isArray (val) {
  return toString.call(val) === '[object Array]'
}


/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
export function isObject (val) {
  return val !== null && typeof val === 'object'
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
export function isDate (val) {
  return toString.call(val) === '[object Date]'
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
export function isURLSearchParams (val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams
}


/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
export function forEach (obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj]
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj)
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj)
      }
    }
  }
}

/**
 * 是否为boolean 值
 * @param val
 * @returns {boolean}
 */
export function isBoolean(val) {
  return typeof val === 'boolean'
}

/**
 * 是否为真正的对象{} new Object
 * @param {any} obj - 检测的对象
 * @returns {boolean}
 */
export function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}




/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
export function merge(/* obj1, obj2, obj3, ... */) {
  var result = {}
  function assignValue(val, key) {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val)
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val)
    } else if (isArray(val)) {
      result[key] = val.slice()
    } else {
      result[key] = val
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue)
  }
  return result
}

export function isUndefined (val) {
  return typeof val === 'undefined'
}
