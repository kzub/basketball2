import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import Success from '@/components/Success.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

describe('Success.vue', () => {
  it('renders correctly and generates retUrl for a gameId', () => {
    const $router = {
      currentRoute: {
        query: {
          gameId: '123'
        }
      }
    }

    const wrapper = shallowMount(Success, {
      localVue,
      mocks: {
        $router
      }
    })

    // It should render text "Успешная оплата!"
    expect(wrapper.text()).toContain('Успешная оплата!')
    
    // Check if retUrl is properly computed based on gameId
    expect(wrapper.vm.retUrl).toBe('/#/game?gameId=123')
  })

  it('renders default retUrl if no gameId in query', () => {
    const $router = {
      currentRoute: {
        query: {}
      }
    }

    const wrapper = shallowMount(Success, {
      localVue,
      mocks: {
        $router
      }
    })

    expect(wrapper.vm.retUrl).toBe('/#/')
  })
})
