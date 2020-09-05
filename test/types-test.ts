import LuchRequest from "../src/lib/luch-request"
const luchRequest = new LuchRequest();

// LuchRequestAbstract
luchRequest

// LuchRequestConfig
luchRequest.config

// LuchRequestAbstract.interceptors
luchRequest.interceptors.request.use(config => {
  return config
})
luchRequest.interceptors.response.use(
  response => {
    return response
  },
  (response) => {
    return Promise.reject(response)
  }
)


// mock request login
interface UserInfo {
  username: string;
  phone: string | number;
}
export const reqLogin = () => {
  return luchRequest.get<UserInfo>("/api/login")
}
// mock get userInfo
(async () => {
  const result = await reqLogin()
  // interface UserInfo
  result.data
})