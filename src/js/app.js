import '../css/dashboard.css'
import { getSession, signIn, signOut } from './auth.js'
import { renderDashboard } from './dashboard.js'

const root = document.querySelector('#app')

async function showLogin() {
  root.innerHTML = `
    <div class="app">
      <div class="panel login-panel">

        <h2>🔐 Leader Login</h2>

        <form id="loginForm">

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter email"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              required
              autocomplete="current-password"
            />
          </div>

          <div id="loginError" class="login-error"></div>

          <button
            type="submit"
            id="loginButton"
            class="btn"
          >
            🔐 Login
          </button>

        </form>

      </div>
    </div>
  `

  const form = document.querySelector('#loginForm')
  const emailInput = document.querySelector('#email')
  const passwordInput = document.querySelector('#password')
  const loginButton = document.querySelector('#loginButton')
  const loginError = document.querySelector('#loginError')

  form.onsubmit = async (event) => {
    event.preventDefault()

    const email = emailInput.value.trim()
    const password = passwordInput.value

    loginError.textContent = ''

    loginButton.disabled = true
    loginButton.textContent = '⏳ Logging in...'

    try {
      const { error } = await signIn(email, password)

      if (error) {
        loginError.textContent = error.message || 'Invalid login credentials.'
        return
      }

      location.reload()

    } catch (error) {
      console.error('Login error:', error)
      loginError.textContent = 'Login failed. Please try again.'
    } finally {
      loginButton.disabled = false
      loginButton.textContent = '🔐 Login'
    }
  }
}

async function showDashboard(session) {

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

        <button
          id="unit1"
          class="btn unit-btn active"
        >
          Unit 1
        </button>

        <button
          id="unit2"
          class="btn unit-btn"
        >
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

    unit1Button.classList.toggle(
      'active',
      unit === 'Unit 1'
    )

    unit2Button.classList.toggle(
      'active',
      unit === 'Unit 2'
    )

    try {
      await renderDashboard(dashboard, unit)
    } catch (error) {
      console.error(`Error loading ${unit}:`, error)

      dashboard.innerHTML = `
        <div class="panel">
          <h3>❌ Dashboard Error</h3>
          <p>
            Unable to load ${unit}.
          </p>
          <small>
            ${error.message || 'Unknown error'}
          </small>
        </div>
      `
    }
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

    logoutButton.disabled = true
    logoutButton.textContent = '⏳ Logging out...'

    try {
      await signOut()
      location.reload()
    } catch (error) {
      console.error('Logout error:', error)

      logoutButton.disabled = false
      logoutButton.textContent = '🚪 Logout'
    }
  }

  // Default Unit 1
  await loadUnit('Unit 1')
}


// ------------------------------------
// APPLICATION START
// ------------------------------------

async function startApp() {

  try {

    const session = await getSession()

    if (!session) {
      await showLogin()
      return
    }

    await showDashboard(session)

  } catch (error) {

    console.error('Application error:', error)

    root.innerHTML = `
      <div class="app">
        <div class="panel">

          <h2>❌ Application Error</h2>

          <p>
            Unable to start the application.
          </p>

          <small>
            ${error.message || 'Unknown error'}
          </small>

        </div>
      </div>
    `
  }
}

startApp()