# vue2-vue3-vite

A collection of workarounds for getting a Vue 2 and Vue 3 app to build from the same Vite config

This is a Vue 3 template app created with `pnpm create vue@latest` with added support for a Vue 2 app that lives in the `legacy` folder.

## Running the app

Assuming you're on a version of Nodejs with corepack, make sure it is enabled with `corepack enable`.

Then run `pnpm install`

To use the dev server, run `pnpm dev`.

To test a prod build, run `pnpm build` then `pnpm serve`

You should see text that says "Vue 3". That is the entire Vue 3 app (I stripped down the template for simplicity).

In 5 seconds, the Vue 2 app will mount in a div underneath the Vue 3 app entry div, showing that they both can live on the same page.

## Workarounds in-depth

Hopefully this app will help guide you in the right direction, but keep in mind that your project may run into issues not described here, depending on what dependencies you use

First you need Vue 2 and Vue 3 to live in the same `package.json`, or maybe you don't _need_ to but you just want to

```jsonc
// package.json
"vue": "^3.4.29",
"vue2": "npm:vue@2.7.16",
```

Now you'll run into the issue where your Vue 2 app dependencies will continue trying to import `vue` and not your new `vue2` alias. The problem is that now `vue` is Vue 3, not Vue 2. Vue 2 deps trying to use Vue 3 just wont work.

You need a way to tell your Vue 2 dependencies about your new Vue 2 alias.

Unfortunately, this is easier said than done. From my research and experimentation, no JavaScript package manager gets this 100% correct out of the box. I tried NPM, Yarn Classic, Yarn Berry, PNPM, and Bun.

I would expect a package manager to see the alias and automatically understand that any time a Vue 2 dependency tries to load `vue`, it should make that dependency think that `vue` is Vue 2 and have it import the alias.

I finally found that PNPM is the only package manager that lets me do this in a somewhat easy way, but it's not plug and play.

I created a file called `.pnpmfile.cjs` in the root of the project. You can read about its `readPackage` hook [here](https://pnpm.io/pnpmfile).

This file contains logic that forces Vue 2 dependencies to use the Vue2 alias when needed.

```js
readPackage(pkg, context) {
    if (['@vitejs/plugin-vue2', 'vuex', 'vue-template-compiler'].includes(pkg.name)) {
    context.log(`Adding vue@2 as a direct dependency of ${pkg.name}@${pkg.version}`)
    delete pkg.peerDependencies.vue
    delete pkg.devDependencies.vue
    pkg.dependencies.vue = 'npm:vue@2.7.16'
    }

    return pkg
}
```

Actually, you can see in that file that I'm deleting `vue` from each package's peerDependencies and devDependencies.

The reason for this is that it's not completely the package manager's fault for resolving `vue` as Vue 3 even when a Vue 2 dependency looks for `vue`.

The issue is with the `peerDependencies`. Having peerDependencies set means that dependency will _always_ look at the root project's package.json for `vue`, which, in our project is Vue 3. It basically bypasses any dependency resolution the package manager would do to understand that `vuex` is looking for `vue@2`

You could argue either that's an issue with the usage of peer deps or with the package manager's handling of them. Either way, this `readPackage` hook is the only way I could get this to work, and it's still not perfect.

For the dependencies listed in the `readPackage` hook, things seem to work. But in older packages with different ways of importing, sometimes the `readPackage` hook isnt enough. They still try to load Vue 3 when `import('vue')`. In those cases, I have to use `pnpm patch` to change the import in every file in that dependency from `import {} from 'vue'` to `import {} from 'vue2`', where `vue2` is the alias we defined above.

Now that dependencies are being resolved correctly, we configure the Vite plugins.

`legacy` here is the name of the folder where all the Vue 2 app files live. So in the case of this app, we want the Vue 3 plugin to exclude the legacy files, and the Vue 2 plugin should only include the legacy folder and exclude everything else

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import vue2 from '@vitejs/plugin-vue2'

export default defineConfig({
  plugins: [
    vue({
      exclude: /^\/(?:[^\/]+\/)*legacy\/(?:[^\/]+\/)*[^\/]+\.vue(?:[^\/]*)$/
    }),
    vue2({
      include: /^\/(?:[^\/]+\/)*legacy\/(?:[^\/]+\/)*[^\/]+\.vue(?:[^\/]*)$/,
      exclude: /^(?!\/(?:[^\/]+\/)*legacy\/(?:[^\/]+\/)*[^\/]+\.vue(?:[^\/]*)$).*$/
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

Unfortunately, include/exclude just dont work at all because of what is arguably a bug in both the Vue 3 and Vue 2 Vite plugins

Rather than make an maintain a fork, I just patched both depedencies with `pnpm patch`. You can see the `.patch` files in the `patches` folder in this repository. Both vite plugins have the issue where the include/exclude in their config just wont work if `query.vue` is true. The problem is that `uery.vue` is always true whether its a Vue 2 or Vue 3 file, so the above filters never run, without the patches. I don't really understand the logic in those plugins enough to explain why, I just know that my patches work.

At this point, we're done with workarounds.

The last step is to decide where the Vue 2 app is going to get mounted. In my real world use case, I needed Vue 2 and Vue 3 apps to live on the same page and also share state with each other.

For this demo app, I added a div with id of `#vue` to `index.html`

Then in `legacy/main.ts` created a function that will mount the Vue app so that I can decide when and where exactly Vue 2 gets mounted (like, if for example, I wanted to mount it with some predefined state from an API call)

In the main Vue 3 entry file `main.ts`, just for the sake of example, I have the Vue 2 getting mounted 5 seconds after the Vue 3 one does

```ts
new Promise((resolve) => {
  setTimeout(() => {
    resolve(undefined)
  }, 5000)
}).then(() => {
  createVue2App()
})
```

Of course your app will be different, but the point is just to show that you can mount it anywhere, because I assume if you're reading this page, you're probably like me and are trying to incrementally convert portions of an app from Vue 2 to 3.

## Sharing state

While this section isn't necessarily a part of the Vite workarounds, state sharing between these two apps will be a problem you inevitably run into, unless your use case doesn't require it (lucky you!).

In my case, I needed to share state between the Vue 2 and Vue 3 apps that are living on the same page (imagine: the same form with a mixture of Vue 2 and Vue 3 form fields).

The obvious solution is to use Pinia, which has support for Vue 2 and Vue 3. However, from my testing, sharing a Pinia store between both apps has change detection issues --- it just doesnt work. I would expect a two-way binding between both apps, but it doesnt work that way. I didn't have enough time to debug why or come up with a workaround. If you can get it to work I think a shared Pinia store will make your life easier. In my case, I decided to use [windowed-observable](https://www.npmjs.com/package/windowed-observable) to share state between Vue 2 and Vue 3.
