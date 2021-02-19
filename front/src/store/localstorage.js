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
    const newCode = Math.random().toString().slice(2)
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

export default {
  createAuthCode,
  resetAuthCode,
  getAuthCode,
}
