import mutations from '@/store/mutations.js'

describe('mutations', () => {
  it('apiError updates state', () => {
    const state = { apiError: null }
    mutations.apiError(state, 'Some Error')
    expect(state.apiError).toBe('Some Error')
  })

  it('returnInfo merges into state.returnInfo', () => {
    const state = { returnInfo: { a: 1 } }
    mutations.returnInfo(state, { b: 2 })
    expect(state.returnInfo).toEqual({ a: 1, b: 2 })
    
    // Overriding existing key
    mutations.returnInfo(state, { a: 3 })
    expect(state.returnInfo).toEqual({ a: 3, b: 2 })
  })

  it('creditorsReduce decreases amount correctly', () => {
    const state = {
      creditors: {
        creditorsList: [
          { userId: 1, total: 100 },
          { userId: 2, total: 50 }
        ]
      }
    }
    mutations.creditorsReduce(state, { userId: 1, amount: 20 })
    expect(state.creditors.creditorsList[0].total).toBe(80)
    expect(state.creditors.creditorsList[1].total).toBe(50) // unchanged
  })

  it('setUpdatedFlag sets viewDataUpdated if boolean is passed', () => {
    // We suppress console.log to avoid spamming the test output
    jest.spyOn(console, 'log').mockImplementation(() => {})

    const state = { viewDataUpdated: false }
    mutations.setUpdatedFlag(state, true)
    expect(state.viewDataUpdated).toBe(true)

    expect(() => {
      mutations.setUpdatedFlag(state, 'not-a-boolean')
    }).toThrow('setUpdatedFlag should use boolean, currently: string')

    console.log.mockRestore()
  })
})
