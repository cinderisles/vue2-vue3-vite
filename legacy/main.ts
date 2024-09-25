import Vue from 'vue2'
import App from './App.vue'
import store from './store'

export const createVue2App = () => {
  new Vue({
    store,
    render: (h) => h(App)
  }).$mount('#vue2')
}
