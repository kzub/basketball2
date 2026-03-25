import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import BootstrapVue from 'bootstrap-vue'
import MyGames from '@/components/MyGames.vue'
import Games from '@/components/Games.vue'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(BootstrapVue)

describe('MyGames.vue', () => {
  let store
  let state

  beforeEach(() => {
    state = {
      games: [
        { gameId: 1, title: 'Game 1' },
        { gameId: 2, title: 'Game 2' }
      ]
    }
    store = new Vuex.Store({
      state
    })
  })

  it('renders title and passes games to Games component', () => {
    const wrapper = shallowMount(MyGames, {
      store,
      localVue,
      stubs: {
        Games: true
      }
    })

    expect(wrapper.text()).toContain('Мои последние игры')
    const gamesComponent = wrapper.findComponent(Games)
    expect(gamesComponent.exists()).toBe(true)
    expect(gamesComponent.attributes('mygamesonly')).toBe('true')
  })

  it('navigates back when back method is called', () => {
    const $router = {
      push: jest.fn()
    }

    const wrapper = shallowMount(MyGames, {
      store,
      localVue,
      mocks: {
        $router
      },
      stubs: {
        Games: true
      }
    })

    // Call the method directly
    wrapper.vm.back()

    expect($router.push).toHaveBeenCalledWith({ path: '/' })
  })
})
