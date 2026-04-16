import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 完整引入 Vant
import Vant from 'vant'
import 'vant/lib/index.css'

// 全局样式
import './style.css'

const app = createApp(App)
app.use(router)
app.use(Vant)
app.mount('#app')