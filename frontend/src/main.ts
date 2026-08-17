import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { router } from './router'
import './styles/main.scss'

// Carbon Web Components self-register as custom elements on import.
import '@carbon/web-components/es/components/ui-shell/header.js'
import '@carbon/web-components/es/components/ui-shell/header-name.js'
import '@carbon/web-components/es/components/ui-shell/header-global-action.js'
import '@carbon/web-components/es/components/icon-button/index.js'
import '@carbon/web-components/es/components/button/index.js'
import '@carbon/web-components/es/components/tile/index.js'
import '@carbon/web-components/es/components/tag/index.js'
import '@carbon/web-components/es/components/link/index.js'
import '@carbon/web-components/es/components/loading/index.js'
import '@carbon/web-components/es/components/inline-loading/index.js'
import '@carbon/web-components/es/components/skeleton-text/index.js'
import '@carbon/web-components/es/components/file-uploader/index.js'
import '@carbon/web-components/es/components/data-table/index.js'
import '@carbon/web-components/es/components/search/index.js'
import '@carbon/web-components/es/components/tooltip/index.js'
import '@carbon/web-components/es/components/notification/index.js'
import '@carbon/web-components/es/components/checkbox/index.js'
import '@carbon/web-components/es/components/tabs/index.js'
import '@carbon/web-components/es/components/text-input/index.js'
import '@carbon/web-components/es/components/modal/index.js'
import '@carbon/web-components/es/components/structured-list/index.js'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
