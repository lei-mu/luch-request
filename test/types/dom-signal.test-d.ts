/// <reference lib="dom" />

import {
  createLuchRequest
} from '../../src'

declare const controller: AbortController

createLuchRequest().get('/users', {
  signal: controller.signal
})
