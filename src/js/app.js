import '../css/dashboard.css'
import { getSession, signOut } from './auth.js'
import { renderDashboard } from './dashboard.js'

const root = document.querySelector('#app')
const session = await getSession()

if (!session) {
  root.innerHTML = `
    <div class="app">
      <div class="panel">
        <h2>🔐 Leader Login</h2>
        <p>Configure Supabase Auth before using the dashboard.</p>
      </div>
    </div>
  `
} else {

  root.innerHTML = `
    <div class="app">

      <!-- Top User Bar -->
      <div class="user-bar">
        <span>👤 ${session.user.email}</span>
        <button id="logout" class="btn secondary">
          🚪 Logout
        </button>
      </div>

      <!-- Unit Navigation -->
      <div class="unit-nav">
        <button id="unit1" class="btn unit-btn active">
          Unit 1
        </button>

        <button id="unit2" class="btn unit-btn">
          Unit 2
        </button>
      </div>

      <!-- Dashboard -->
      <div id="dashboard"></div>

    </div>
  `

  const dashboard = document.querySelector('#dashboard')
  const unit1Button = document.querySelector('#unit1')
  const unit2Button = document.querySelector('#unit2')
  const logoutButton = document.querySelector('#logout')

  async function loadUnit(unit) {

    unit1Button.classList.toggle('active', unit === 'Unit 1')
    unit2Button.classList.toggle('active', unit === 'Unit 2')

    await renderDashboard(dashboard, unit)
  }

  // Unit 1
  unit1Button.onclick = async () => {
    await loadUnit('Unit 1')
  }

  // Unit 2
  unit2Button.onclick = async () => {
    await loadUnit('Unit 2')
  }

  // Logout
  logoutButton.onclick = async () => {
    await signOut()
    location.reload()
  }

  // Default
  await loadUnit('Unit 1')
}