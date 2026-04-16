import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DetailView from '../views/DetailView.vue'
import AdminView from '../views/AdminView.vue'
import SecretCenter from '../views/SecretCenter.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/post/:id',
    name: 'Detail',
    component: DetailView,
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
  },
  { path: '/secret', name: 'Secret', component: SecretCenter }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router