import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import 'primeicons/primeicons.css'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import InputNumber from 'primevue/inputnumber'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import DatePicker from 'primevue/datepicker'
import Drawer from 'primevue/drawer'
import ProgressSpinner from 'primevue/progressspinner'
import Menu from 'primevue/menu'
import Message from 'primevue/message'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Badge from 'primevue/badge'
import Chip from 'primevue/chip'

import App from './App.vue'
import router from './router'
import { authReady } from './firebase'
import { useAuthStore } from './stores/auth'

const { default: VConsole } = await import('vconsole')
  new VConsole()

const PetitgoPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{emerald.50}',
      100: '{emerald.100}',
      200: '{emerald.200}',
      300: '{emerald.300}',
      400: '{emerald.400}',
      500: '{emerald.500}',
      600: '{emerald.600}',
      700: '{emerald.700}',
      800: '{emerald.800}',
      900: '{emerald.900}',
      950: '{emerald.950}',
    },
  },
})

;(async () => {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  app.use(PrimeVue, {
    theme: {
      preset: PetitgoPreset,
      options: {
        darkModeSelector: '.dark-mode',
        cssLayer: false,
      },
    },
  })
  app.use(ToastService)

  // Global PrimeVue components
  app.component('Button', Button)
  app.component('Card', Card)
  app.component('InputText', InputText)
  app.component('Textarea', Textarea)
  app.component('Select', Select)
  app.component('DataTable', DataTable)
  app.component('Column', Column)
  app.component('Dialog', Dialog)
  app.component('Toast', Toast)
  app.component('Tag', Tag)
  app.component('Divider', Divider)
  app.component('InputNumber', InputNumber)
  app.component('Tabs', Tabs)
  app.component('TabList', TabList)
  app.component('Tab', Tab)
  app.component('TabPanels', TabPanels)
  app.component('TabPanel', TabPanel)
  app.component('DatePicker', DatePicker)
  app.component('Drawer', Drawer)
  app.component('ProgressSpinner', ProgressSpinner)
  app.component('Menu', Menu)
  app.component('Message', Message)
  app.component('IconField', IconField)
  app.component('InputIcon', InputIcon)
  app.component('Badge', Badge)
  app.component('Chip', Chip)

  const authStore = useAuthStore()
  await authReady

  if (authStore.isLoggedIn) {
    const ok = await authStore.fetchMe()
    if (!ok) {
      await router.replace('/login')
    }
  }

  app.mount('#app')
})()
