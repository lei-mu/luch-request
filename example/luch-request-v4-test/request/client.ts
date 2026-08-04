import { createLuchRequest } from 'luch-request'

export const MOCK_BASE_URL =
  'https://mock.quanzhan.co/mock/aa53d9066d5ddf616ad6b0d99c4061f2/luch_request_v4'

export const request = createLuchRequest({
  baseURL: MOCK_BASE_URL,
  timeout: 10000,
  header: {
    Accept: 'application/json'
  }
})
