import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVue2App } from '../legacy/main'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

new Promise((resolve) => {
  setTimeout(() => {
    resolve(undefined)
  }, 5000)
}).then(() => {
  createVue2App()
})
