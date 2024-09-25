module.exports = {
  hooks: {
    readPackage(pkg, context) {
      if (['@vitejs/plugin-vue2', 'vuex', 'vue-template-compiler'].includes(pkg.name)) {
        context.log(`Adding vue@2 as a direct dependency of ${pkg.name}@${pkg.version}`)
        delete pkg.peerDependencies.vue
        delete pkg.devDependencies.vue
        pkg.dependencies.vue = 'npm:vue@2.7.16'
      }

      return pkg
    }
  }
}
