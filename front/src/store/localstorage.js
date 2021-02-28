const localHeapStorage = {}

const getStorage = () => {
  if (window.localStorage) {
    return window.localStorage
  }
  // fallback
  return localHeapStorage
}

const createAuthCode = (state) => {
  let storage = getStorage();

  if (storage['code']) {
    state.authCode = storage['code']
  } else {
    const newCode = 'auth' + Math.random().toString().slice(2)
    storage['code'] = newCode
    state.authCode = newCode
  }
}

const getAuthCode = () => {
  let storage = getStorage();
  return storage['code'] || '';
}

const resetAuthCode = (state) => {
  let storage = getStorage()
  delete storage['code']
  state.authCode = ''
}

const setAuthCode = (state, prop = '') => {
  let storage = getStorage();
  storage['code'] = prop
  state.authCode = prop
}

export default {
  createAuthCode,
  getAuthCode,
  resetAuthCode,
  setAuthCode,
}
