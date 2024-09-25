import Vue from 'vue2'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  strict: true,
  state: {
    message: ''
  },
  mutations: {
    setMessage(state, payload) {
      state.message = payload
    }
  }
})

export const useStore = () => store

export default store
