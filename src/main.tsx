import { render } from 'preact'
import 'virtual:uno.css'
import './ui/global.css'
import { App } from './ui/App'

render(<App />, document.getElementById('app')!)

const loading = document.getElementById('loading-screen')
if (loading) {
  loading.classList.add('fade-out')
  loading.addEventListener('transitionend', () => loading.remove())
}
