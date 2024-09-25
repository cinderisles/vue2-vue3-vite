<template>
  <div>
    <div>
      {{ message }}
    </div>

    <button @click="click">click</button>
    <div>{{ vuexMessage }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue2'
import { useStore } from './store'

export default defineComponent({
  name: 'App',
  components: {},
  setup() {
    const message = ref('Vue 2')
    const store = useStore()

    const click = () => {
      store.commit('setMessage', 'hello from vuex')
    }

    const vuexMessage = computed(() => store.state.message)

    return {
      message,
      vuexMessage,
      click
    }
  }
})
</script>
