import { supabase } from './supabase.js'

let currentUnit = 'Unit 1'
let currentRecords = []
let clientMasterRecords = []
let autoRefreshTimer = null

export async function renderDashboard(root, unit = 'Unit 1') {
  currentUnit = unit

  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }

  root.innerHTML = `
    <div class="dashboard">

      <!-- HEADER -->
      <div class="dashboard-header page-header">
        <div>
          <h1>📋 CCTV Monitoring Dashboard</h1>
          <span class="unit-label">${escapeHtml(unit)}</span>
        </div>
      </div>

      <!-- TOOLBAR -->
      <div class="toolbar card">

        <div class="dashboard-meta">
          <span id="dashboardDate" class="date-badge"></span>
          <button id="darkModeBtn" class="dark-mode-btn" type="button" aria-label="Toggle dark mode">◐</button>
        </div>

        <button id="refreshBtn" class="btn">
          🔄 Refresh
        </button>

        <button id="addBtn" class="btn success">
          ➕ Add Client
        </button>

        <button id="masterBtn" class="btn master-btn" type="button">Client Master</button>
        <button id="exportBtn" class="btn excel-btn" type="button">Excel</button>
        <button id="reportBtn" class="btn report-btn" type="button">Report</button>

        <input
          id="searchInput"
          class="search-input"
          type="text"
          placeholder="🔎 Search client, panel, operator..."
        >

        <select id="shiftFilter" class="filter-select">
          <option value="">All Shifts</option>
        </select>

        <select id="vmsFilter" class="filter-select">
          <option value="">All VMS</option>
        </select>

      </div>

      <!-- STATISTICS -->
      <div class="stats total">

        <div class="stat total-clients">
          <span>Total Clients</span>
          <strong id="clientCount">0</strong>
        </div>

        <div class="stat total-cameras">
          <span>Total Cameras</span>
          <strong id="cameraCount">0</strong>
        </div>

        <div class="stat total-panels">
          <span>Total Panels</span>
          <strong id="panelCount">0</strong>
        </div>

      </div>

      <!-- PANELS -->
      <div id="panels" class="grid">

        <div class="loading">
          🔄 Loading CCTV data...
        </div>

      </div>

    </div>

    <!-- ADD / EDIT MODAL -->
    <div id="assignmentModal" class="modal hidden">

      <div class="modal-box">

        <div class="modal-header">

          <h2 id="modalTitle">
            ➕ Add Client
          </h2>

          <button
            id="closeModal"
            class="modal-close"
            type="button"
          >
            ✕
          </button>

        </div>

        <form id="assignmentForm">

          <input
            type="hidden"
            id="recordId"
          >

          <label>Unit</label>

          <input
            id="formUnit"
            type="text"
            readonly
          >

          <label>Panel</label>

          <input
            id="formPanel"
            type="text"
            placeholder="A1"
            required
          >

          <label>Client Name</label>

          <input
            id="formClient"
            type="text"
            placeholder="Client Name"
            required
          >

          <label>Cameras</label>

          <input
            id="formCameras"
            type="number"
            min="0"
            placeholder="50"
            required
          >

          <label>Shift</label>

          <input
            id="formShift"
            type="text"
            placeholder="9 AM to 6 PM"
          >

          <label>VMS</label>

          <input
            id="formVms"
            type="text"
            placeholder="Smart PSS"
          >

          <label>Operator Name</label>

          <input
            id="formOperator"
            type="text"
            placeholder="Operator Name"
          >

          <label>Client Color</label>

          <input
            id="formColor"
            type="text"
            value="#3b7cff"
            placeholder="#3b7cff"
          >

          <div class="modal-actions">

            <button
              type="button"
              id="cancelBtn"
              class="btn secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="btn success"
            >
              💾 Save
            </button>

          </div>

        </form>

      </div>

    </div>

    <div id="clientMasterModal" class="modal hidden">
      <div class="modal-box client-master-content">
        <div class="modal-header"><h2>Client Master</h2><button id="closeMasterModal" class="modal-close" type="button">×</button></div>
        <div class="master-toolbar"><input id="masterSearch" class="master-search" type="search" placeholder="Search client..."><button id="exportMasterBtn" class="btn excel-btn" type="button">Export CSV</button></div>
        <div class="stats-box"><span>Total Clients</span><strong id="masterClientCount">0</strong></div>
        <div class="master-table-container"><table class="master-table"><thead><tr><th>#</th><th>Client Name</th><th>Cameras</th><th>Shift</th><th>VMS</th><th>Color</th><th>Action</th></tr></thead><tbody id="masterTableBody"></tbody></table></div>
      </div>
    </div>
  `

  setupEvents()

  await loadRecords()

  // Auto refresh every 30 seconds
  autoRefreshTimer = setInterval(() => {
    loadRecords()
  }, 30000)
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

  const dateBadge = document.querySelector('#dashboardDate')
  const darkModeBtn = document.querySelector('#darkModeBtn')

  if (dateBadge) {
    dateBadge.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date())
  }

  darkModeBtn?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode')
    document.body.classList.toggle('dark', document.body.classList.contains('dark-mode'))
    darkModeBtn.setAttribute('aria-pressed', String(document.body.classList.contains('dark-mode')))
  })

  const refreshBtn =
    document.querySelector('#refreshBtn')

  const addBtn =
    document.querySelector('#addBtn')

  const masterBtn = document.querySelector('#masterBtn')
  const exportBtn = document.querySelector('#exportBtn')
  const reportBtn = document.querySelector('#reportBtn')
  const closeMasterModal = document.querySelector('#closeMasterModal')
  const masterSearch = document.querySelector('#masterSearch')
  const exportMasterBtn = document.querySelector('#exportMasterBtn')

  const searchInput =
    document.querySelector('#searchInput')

  const shiftFilter =
    document.querySelector('#shiftFilter')

  const vmsFilter =
    document.querySelector('#vmsFilter')

  const closeModal =
    document.querySelector('#closeModal')

  const cancelBtn =
    document.querySelector('#cancelBtn')

  const form =
    document.querySelector('#assignmentForm')


  refreshBtn.onclick = async () => {

    refreshBtn.disabled = true

    refreshBtn.textContent =
      '⏳ Loading...'

    await loadRecords()

    refreshBtn.disabled = false

    refreshBtn.textContent =
      '🔄 Refresh'
  }


  addBtn.onclick = () => {
    openAddModal()
  }

  masterBtn.onclick = () => openClientMasterModal()
  closeMasterModal.onclick = () => closeClientMasterModal()
  masterSearch.oninput = () => renderClientMasterTable(masterSearch.value)
  exportBtn.onclick = () => exportAssignmentsCsv(currentRecords, `${currentUnit.replace(' ', '-')}-assignments.csv`)
  exportMasterBtn.onclick = () => exportAssignmentsCsv(clientMasterRecords, 'client-master.csv')
  reportBtn.onclick = () => generateReport()


  searchInput.oninput = () => {
    applyFilters()
  }


  shiftFilter.onchange = () => {
    applyFilters()
  }


  vmsFilter.onchange = () => {
    applyFilters()
  }


  closeModal.onclick = () => {
    closeAssignmentModal()
  }


  cancelBtn.onclick = () => {
    closeAssignmentModal()
  }


  form.onsubmit = async event => {
    await saveAssignment(event)
  }
}


/* =========================================================
   LOAD RECORDS
========================================================= */

async function loadRecords() {

  const panels =
    document.querySelector('#panels')

  if (!panels) return


  panels.innerHTML = `
    <div class="loading">
      🔄 Loading CCTV data...
    </div>
  `


  const { data, error } = await supabase
    .from('cctv_assignments')
    .select(`
      id,
      unit,
      panel,
      client_name,
      cameras,
      shift,
      vms,
      client_color,
      operator_name,
      created_at,
      updated_at
    `)
    .eq('unit', currentUnit)
    .order('panel', {
      ascending: true
    })
    .order('created_at', {
      ascending: true
    })


  if (error) {

    console.error(
      'Supabase error:',
      error
    )

    panels.innerHTML = `
      <div class="error">

        <h3>❌ Database Error</h3>

        <p>
          ${escapeHtml(error.message)}
        </p>

      </div>
    `

    currentRecords = []

    updateStatistics([])

    return
  }


  currentRecords = data || []

  await loadClientMasterRecords()


  console.log(
    `Loaded ${currentRecords.length} records`
  )


  updateStatistics(currentRecords)

  populateFilters()

  applyFilters()
}

async function loadClientMasterRecords() {
  const { data, error } = await supabase
    .from('cctv_assignments')
    .select('id, client_name, cameras, shift, vms, client_color, operator_name, updated_at')
    .not('client_name', 'is', null)
    .order('client_name', { ascending: true })

  if (error) {
    console.error('Client master load error:', error)
    clientMasterRecords = []
    return
  }

  const uniqueClients = new Map()
  ;(data || []).forEach(record => {
    const name = String(record.client_name || '').trim().toLowerCase()
    if (name && !uniqueClients.has(name)) uniqueClients.set(name, record)
  })
  clientMasterRecords = [...uniqueClients.values()]
}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics(records) {

  /*
    UNIQUE CLIENT COUNT

    Example:

    A1 → TEST CLIENT → 50
    A1 → TEST CLIENT → 20
    A2 → TEST CLIENT → 50

    Unique Clients = 1
    Cameras = 120
    Panels = 2
  */

  const uniqueClients =
    new Set(
      records
        .map(record =>
          String(
            record.client_name || ''
          )
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    )


  const uniquePanels =
    new Set(
      records
        .map(record =>
          String(
            record.panel || ''
          ).trim()
        )
        .filter(Boolean)
    )


  const totalCameras =
    records.reduce(
      (total, record) => {

        return total +
          Number(
            record.cameras || 0
          )

      },
      0
    )


  const clientCount =
    document.querySelector('#clientCount')

  const cameraCount =
    document.querySelector('#cameraCount')

  const panelCount =
    document.querySelector('#panelCount')


  if (clientCount) {
    clientCount.textContent =
      uniqueClients.size
  }


  if (cameraCount) {
    cameraCount.textContent =
      totalCameras
  }


  if (panelCount) {
    panelCount.textContent =
      uniquePanels.size
  }
}


/* =========================================================
   CLIENT MASTER / EXPORT / REPORT
========================================================= */

function openClientMasterModal() {
  renderClientMasterTable()
  document.querySelector('#clientMasterModal')?.classList.remove('hidden')
}

function closeClientMasterModal() {
  document.querySelector('#clientMasterModal')?.classList.add('hidden')
}

function renderClientMasterTable(query = '') {
  const body = document.querySelector('#masterTableBody')
  const count = document.querySelector('#masterClientCount')
  if (!body || !count) return

  const search = query.trim().toLowerCase()
  const clients = clientMasterRecords.filter(record => String(record.client_name || '').toLowerCase().includes(search))
  count.textContent = clientMasterRecords.length
  body.innerHTML = clients.map((record, index) => `
    <tr>
      <td>${index + 1}</td><td>${escapeHtml(record.client_name)}</td><td>${Number(record.cameras || 0)}</td>
      <td>${escapeHtml(record.shift || '—')}</td><td>${escapeHtml(record.vms || '—')}</td>
      <td><span class="color-swatch" style="background:${escapeHtml(record.client_color || '#3b7cff')}"></span>${escapeHtml(record.client_color || '#3b7cff')}</td>
      <td><button class="master-edit-btn" data-id="${escapeHtml(record.id)}" type="button">Edit</button><button class="master-delete-btn" data-id="${escapeHtml(record.id)}" type="button">Delete</button></td>
    </tr>`).join('') || '<tr><td colspan="7">No clients found.</td></tr>'

  body.querySelectorAll('.master-edit-btn').forEach(button => {
    button.onclick = () => {
      const record = clientMasterRecords.find(item => item.id === button.dataset.id)
      if (record) {
        closeClientMasterModal()
        openEditModal(record)
      }
    }
  })

  body.querySelectorAll('.master-delete-btn').forEach(button => {
    button.onclick = async () => {
      const record = clientMasterRecords.find(item => item.id === button.dataset.id)
      if (!record || !confirm(`Delete the client record for ${record.client_name}?`)) return
      const { error } = await supabase.from('cctv_assignments').delete().eq('id', record.id)
      if (error) {
        alert(`Unable to delete client: ${error.message}`)
        return
      }
      await loadRecords()
      renderClientMasterTable(query)
    }
  })
}

function exportAssignmentsCsv(records, fileName) {
  const header = ['Client Name', 'Cameras', 'Shift', 'VMS', 'Color']
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`
  const rows = records.map(record => [record.client_name, record.cameras, record.shift, record.vms, record.client_color].map(quote).join(','))
  const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)
}

function generateReport() {
  const totalCameras = currentRecords.reduce((total, record) => total + Number(record.cameras || 0), 0)
  const totalClients = new Set(currentRecords.map(record => String(record.client_name || '').trim().toLowerCase()).filter(Boolean)).size
  const report = `CCTV Daily Monitoring Report – ${currentUnit}\n\nTotal Clients: ${totalClients}\nTotal Cameras: ${totalCameras}\n\nGenerated: ${new Date().toLocaleString()}`
  navigator.clipboard?.writeText(report).catch(() => {})
  alert(report)
}

/* =========================================================
   FILTER OPTIONS
========================================================= */

function populateFilters() {

  const shiftFilter =
    document.querySelector('#shiftFilter')

  const vmsFilter =
    document.querySelector('#vmsFilter')


  if (!shiftFilter || !vmsFilter) {
    return
  }


  const currentShift =
    shiftFilter.value

  const currentVms =
    vmsFilter.value


  const shifts =
    [
      ...new Set(
        currentRecords
          .map(record =>
            record.shift
          )
          .filter(Boolean)
      )
    ]
      .sort()


  const vmsList =
    [
      ...new Set(
        currentRecords
          .map(record =>
            record.vms
          )
          .filter(Boolean)
      )
    ]
      .sort()


  shiftFilter.innerHTML = `
    <option value="">
      All Shifts
    </option>

    ${
      shifts
        .map(shift => `
          <option value="${escapeHtml(shift)}">
            ${escapeHtml(shift)}
          </option>
        `)
        .join('')
    }
  `


  vmsFilter.innerHTML = `
    <option value="">
      All VMS
    </option>

    ${
      vmsList
        .map(vms => `
          <option value="${escapeHtml(vms)}">
            ${escapeHtml(vms)}
          </option>
        `)
        .join('')
    }
  `


  if (
    shifts.includes(currentShift)
  ) {
    shiftFilter.value =
      currentShift
  }


  if (
    vmsList.includes(currentVms)
  ) {
    vmsFilter.value =
      currentVms
  }
}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyFilters() {

  const searchInput =
    document.querySelector('#searchInput')

  const shiftFilter =
    document.querySelector('#shiftFilter')

  const vmsFilter =
    document.querySelector('#vmsFilter')


  const search =
    (
      searchInput?.value || ''
    )
      .trim()
      .toLowerCase()


  const shift =
    shiftFilter?.value || ''


  const vms =
    vmsFilter?.value || ''


  const filtered =
    currentRecords.filter(record => {

      const matchesSearch =
        !search ||
        [
          record.panel,
          record.client_name,
          record.operator_name,
          record.shift,
          record.vms
        ]
          .filter(Boolean)
          .some(value =>
            String(value)
              .toLowerCase()
              .includes(search)
          )


      const matchesShift =
        !shift ||
        record.shift === shift


      const matchesVms =
        !vms ||
        record.vms === vms


      return (
        matchesSearch &&
        matchesShift &&
        matchesVms
      )
    })


  renderPanels(filtered)
}


/* =========================================================
   RENDER PANELS
========================================================= */

function renderPanels(records) {

  const container =
    document.querySelector('#panels')


  if (!container) return


  if (false && !records.length) {

    container.innerHTML = `
      <div class="empty">

        <h3>📭 No CCTV Records</h3>

        <p>
          No records found for
          ${escapeHtml(currentUnit)}.
        </p>

      </div>
    `

    return
  }


  /*
    GROUP BY PANEL

    Example:

    A1
      TEST CLIENT → 50
      TEST CLIENT → 20

    A2
      TEST CLIENT → 50
  */


  const groupedPanels = {}

  const defaultPanels = currentUnit === 'Unit 1'
    ? ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'R1', 'R2', 'R3']
    : ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10']

  defaultPanels.forEach(panel => {
    groupedPanels[panel] = []
  })


  records.forEach(record => {

    const panel =
      record.panel || 'No Panel'


    if (!groupedPanels[panel]) {
      groupedPanels[panel] = []
    }


    groupedPanels[panel].push(record)
  })


  container.innerHTML =
    Object.entries(groupedPanels)
      .map(
        ([panel, panelRecords]) =>
          renderReferencePanel(
            panel,
            panelRecords
          )
      )
      .join('')


  setupCardButtons()
  setupPanelSearches()
  setupAssignmentSelects()
}


/* =========================================================
   RENDER PANEL
========================================================= */

function renderReferencePanel(panel, records) {
  const isReport = /^R\d+$/i.test(panel)
  const totalPanelCameras = records.reduce((total, record) => total + Number(record.cameras || 0), 0)
  const operators = [...new Set(records.map(record => record.operator_name).filter(Boolean))]
  const clientOptions = clientMasterRecords.map(record =>
    `<option value="${escapeHtml(record.id)}">${escapeHtml(record.client_name)}</option>`
  ).join('')
  const emptyRows = Array.from({ length: Math.max(1, 5 - records.length) }, () => `
    <tr class="empty-assignment-row"><td><select class="assignment-client-select" data-panel="${escapeHtml(panel)}"><option value="">Select</option>${clientOptions}</select></td><td></td><td></td><td></td></tr>`).join('')

  return `
    <section class="box ${isReport ? 'report-panel' : 'normal-panel'}" aria-label="Panel ${escapeHtml(panel)}">
      <div class="section">${escapeHtml(panel)}</div>
      <input class="search panel-search" type="search" placeholder="Search …" aria-label="Search ${escapeHtml(panel)}">
      <table class="assignment-table">
        <thead><tr><th>Clients</th><th>Cam</th><th>Shift</th><th>VMS</th></tr></thead>
        <tbody class="assignment-table-body">
          ${records.map(renderReferenceRow).join('')}${emptyRows}
        </tbody>
        <tbody class="lightsnap"><tr><td colspan="4">LightSnap</td></tr></tbody>
        <tfoot class="total"><tr><td>Total</td><td>${totalPanelCameras}</td><td colspan="2">${escapeHtml(operators.join(', ') || '—')}</td></tr></tfoot>
      </table>
    </section>
  `
}

function renderReferenceRow(record) {
  const color = escapeHtml(record.client_color || '#3b7cff')
  const textColor = contrastColor(record.client_color || '#3b7cff')
  return `
    <tr class="assignment-row client-row-colored" data-search="${escapeHtml([record.client_name, record.shift, record.vms, record.operator_name].filter(Boolean).join(' '))}" style="--client-color:${color};--client-text:${textColor}">
      <td><span class="client-name">${escapeHtml(record.client_name || 'Select')}</span><span class="row-actions"><button class="edit-btn" data-id="${escapeHtml(record.id)}" type="button" title="Edit">✎</button><button class="delete-btn" data-id="${escapeHtml(record.id)}" type="button" title="Delete">×</button></span></td>
      <td>${Number(record.cameras || 0)}</td>
      <td>${escapeHtml(record.shift || '—')}</td>
      <td>${escapeHtml(record.vms || '—')}</td>
    </tr>
  `
}

function contrastColor(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  if (!match) return '#ffffff'
  const luminance = (Number.parseInt(match[1], 16) * 299 + Number.parseInt(match[2], 16) * 587 + Number.parseInt(match[3], 16) * 114) / 255000
  return luminance > 0.56 ? '#1e293b' : '#ffffff'
}

function renderPanel(
  panel,
  records
) {

  const panelClass = /report/i.test(panel)
    ? 'report-panel'
    : 'normal-panel'

  const totalPanelCameras =
    records.reduce(
      (total, record) =>
        total +
        Number(
          record.cameras || 0
        ),
      0
    )


  return `
    <div class="assignment-panel ${panelClass}">

      <div class="panel-header">

        <div>

          <h2>
            ${escapeHtml(panel)}
          </h2>

          <span class="record-count">

            ${records.length}

            ${
              records.length === 1
                ? 'client record'
                : 'client records'
            }

          </span>

        </div>


        <strong class="panel-camera-total">

          📹
          ${totalPanelCameras}

        </strong>

      </div>


      <label class="panel-search-wrap">
        <span>Search panel</span>
        <input class="panel-search" type="search" placeholder="Search client...">
      </label>

      <div class="panel-table-head" aria-hidden="true">
        <span>Clients</span><span>Cam</span><span>Shift</span><span>VMS</span><span></span>
      </div>

      <div class="client-list">

        ${
          records.length
            ? records
            .map(record =>
              renderTableClient(record)
            )
            .join('')
            : `<div class="client-card client-table-row empty-table-row">
                <strong class="table-client-name">Select ▾</strong><span class="table-camera-count">—</span>
                <span class="table-value">Select ▾</span><span class="table-value">Select ▾</span><span></span>
              </div>`
        }

      </div>

      <div class="panel-footer">
        <span>Total Cameras</span>
        <strong>${totalPanelCameras}</strong>
        <small>${escapeHtml(records.map(record => record.operator_name).filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(' · ') || 'Operator: Not assigned')}</small>
      </div>

    </div>
  `
}


/* =========================================================
   RENDER CLIENT
========================================================= */

function renderTableClient(record) {

  const color = record.client_color || '#3b7cff'

  return `
    <div class="client-card client-table-row" data-search="${escapeHtml([
      record.client_name,
      record.shift,
      record.vms,
      record.operator_name
    ].filter(Boolean).join(' '))}" style="border-left-color:${escapeHtml(color)}">
      <strong class="table-client-name">${escapeHtml(record.client_name || 'Select')}</strong>
      <span class="table-camera-count">${Number(record.cameras || 0)}</span>
      <span class="table-value">${escapeHtml(record.shift || 'Select ▾')}</span>
      <span class="table-value">${escapeHtml(record.vms || 'Select ▾')}</span>
      <span class="client-actions">
        <button class="edit-btn" data-id="${escapeHtml(record.id)}" title="Edit client" type="button">&#9998;</button>
        <button class="delete-btn" data-id="${escapeHtml(record.id)}" title="Delete client" type="button">&#128465;</button>
      </span>
    </div>
  `
}

function setupPanelSearches() {
  document.querySelectorAll('.panel-search').forEach(input => {
    input.oninput = () => {
      const query = input.value.trim().toLowerCase()
      const panel = input.closest('.assignment-panel, .box')
      panel?.querySelectorAll('.client-table-row, .assignment-row, .empty-assignment-row').forEach(row => {
        row.hidden = Boolean(query) && !(row.dataset.search || row.textContent).toLowerCase().includes(query)
      })
    }
  })
}

function setupAssignmentSelects() {
  document.querySelectorAll('.assignment-client-select').forEach(select => {
    select.onchange = async () => {
      const masterRecord = clientMasterRecords.find(record => record.id === select.value)
      if (!masterRecord) return

      select.disabled = true
      const { error } = await supabase.from('cctv_assignments').insert([{
        unit: currentUnit,
        panel: select.dataset.panel,
        client_name: masterRecord.client_name,
        cameras: Number(masterRecord.cameras || 0),
        shift: masterRecord.shift || null,
        vms: masterRecord.vms || null,
        client_color: masterRecord.client_color || '#3b7cff',
        operator_name: null,
        updated_at: new Date().toISOString()
      }])

      if (error) {
        console.error('Assignment creation error:', error)
        alert(`Unable to assign client: ${error.message}`)
        select.disabled = false
        return
      }
      await loadRecords()
    }
  })
}

function renderClient(record) {

  const color =
    record.client_color ||
    '#3b7cff'


  return `
    <div
      class="client-card"
      style="
        border-left-color:
        ${escapeHtml(color)};
      "
    >

      <div class="client-main">

        <div class="client-title">

          <span
            class="status-dot status-online"
          ></span>

          <h3>
            ${escapeHtml(
              record.client_name ||
              'No Client'
            )}
          </h3>

          <span
            class="status-text online-text"
          >
            Active
          </span>

        </div>


        <div class="client-details">

          <span class="detail-badge">

            📹
            ${Number(
              record.cameras || 0
            )}
            Cameras

          </span>


          ${
            record.shift
              ? `
                <span class="detail-badge">

                  🕐
                  ${escapeHtml(
                    record.shift
                  )}

                </span>
              `
              : ''
          }


          ${
            record.vms
              ? `
                <span class="detail-badge">

                  🖥️
                  ${escapeHtml(
                    record.vms
                  )}

                </span>
              `
              : ''
          }


          ${
            record.operator_name
              ? `
                <span class="detail-badge">

                  👤
                  ${escapeHtml(
                    record.operator_name
                  )}

                </span>
              `
              : ''
          }

        </div>

      </div>


      <div class="client-actions">

        <button
          class="edit-btn"
          data-id="${escapeHtml(record.id)}"
          title="Edit"
          type="button"
        >
          ✏️
        </button>


        <button
          class="delete-btn"
          data-id="${escapeHtml(record.id)}"
          title="Delete"
          type="button"
        >
          🗑️
        </button>

      </div>

    </div>
  `
}


/* =========================================================
   CARD BUTTON EVENTS
========================================================= */

function setupCardButtons() {

  document
    .querySelectorAll('.edit-btn')
    .forEach(button => {

      button.onclick = () => {

        const id =
          button.dataset.id


        const record =
          currentRecords.find(
            item =>
              item.id === id
          )


        if (record) {
          openEditModal(record)
        }
      }
    })


  document
    .querySelectorAll('.delete-btn')
    .forEach(button => {

      button.onclick = async () => {

        const id =
          button.dataset.id


        await deleteAssignment(id)
      }
    })
}


/* =========================================================
   OPEN ADD MODAL
========================================================= */

function openAddModal() {

  document.querySelector(
    '#modalTitle'
  ).textContent =
    '➕ Add Client'


  document.querySelector(
    '#recordId'
  ).value = ''


  document.querySelector(
    '#formUnit'
  ).value =
    currentUnit


  document.querySelector(
    '#formPanel'
  ).value = ''


  document.querySelector(
    '#formClient'
  ).value = ''


  document.querySelector(
    '#formCameras'
  ).value = ''


  document.querySelector(
    '#formShift'
  ).value = ''


  document.querySelector(
    '#formVms'
  ).value = ''


  document.querySelector(
    '#formOperator'
  ).value = ''


  document.querySelector(
    '#formColor'
  ).value =
    '#3b7cff'


  document.querySelector(
    '#assignmentModal'
  ).classList.remove('hidden')
}


/* =========================================================
   OPEN EDIT MODAL
========================================================= */

function openEditModal(record) {

  document.querySelector(
    '#modalTitle'
  ).textContent =
    '✏️ Edit Client'


  document.querySelector(
    '#recordId'
  ).value =
    record.id


  document.querySelector(
    '#formUnit'
  ).value =
    record.unit || currentUnit


  document.querySelector(
    '#formPanel'
  ).value =
    record.panel || ''


  document.querySelector(
    '#formClient'
  ).value =
    record.client_name || ''


  document.querySelector(
    '#formCameras'
  ).value =
    record.cameras || 0


  document.querySelector(
    '#formShift'
  ).value =
    record.shift || ''


  document.querySelector(
    '#formVms'
  ).value =
    record.vms || ''


  document.querySelector(
    '#formOperator'
  ).value =
    record.operator_name || ''


  document.querySelector(
    '#formColor'
  ).value =
    record.client_color ||
    '#3b7cff'


  document.querySelector(
    '#assignmentModal'
  ).classList.remove('hidden')
}


/* =========================================================
   SAVE ASSIGNMENT
========================================================= */

async function saveAssignment(event) {

  event.preventDefault()


  const id =
    document.querySelector(
      '#recordId'
    ).value


  const payload = {

    unit:
      document.querySelector(
        '#formUnit'
      ).value,

    panel:
      document.querySelector(
        '#formPanel'
      ).value.trim(),

    client_name:
      document.querySelector(
        '#formClient'
      ).value.trim(),

    cameras:
      Number(
        document.querySelector(
          '#formCameras'
        ).value || 0
      ),

    shift:
      document.querySelector(
        '#formShift'
      ).value.trim() || null,

    vms:
      document.querySelector(
        '#formVms'
      ).value.trim() || null,

    operator_name:
      document.querySelector(
        '#formOperator'
      ).value.trim() || null,

    client_color:
      document.querySelector(
        '#formColor'
      ).value.trim() ||
      '#3b7cff',

    updated_at:
      new Date().toISOString()
  }


  if (
    !payload.panel ||
    !payload.client_name
  ) {

    alert(
      'Please enter Panel and Client Name.'
    )

    return
  }


  let result


  if (id) {

    // EDIT
    result =
      await supabase
        .from('cctv_assignments')
        .update(payload)
        .eq('id', id)

  } else {

    // ADD
    result =
      await supabase
        .from('cctv_assignments')
        .insert([
          payload
        ])
  }


  if (result.error) {

    console.error(
      'Save error:',
      result.error
    )

    alert(
      '❌ Database Error\n\n' +
      result.error.message
    )

    return
  }


  closeAssignmentModal()

  await loadRecords()
}


/* =========================================================
   DELETE
========================================================= */

async function deleteAssignment(id) {

  const record =
    currentRecords.find(
      item =>
        item.id === id
    )


  if (!record) return


  const confirmed =
    confirm(
      `Delete this assignment?\n\n` +
      `${record.panel} → ` +
      `${record.client_name} → ` +
      `${record.cameras} cameras`
    )


  if (!confirmed) return


  const { error } =
    await supabase
      .from('cctv_assignments')
      .delete()
      .eq('id', id)


  if (error) {

    console.error(
      'Delete error:',
      error
    )

    alert(
      '❌ Delete failed\n\n' +
      error.message
    )

    return
  }


  await loadRecords()
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeAssignmentModal() {

  const modal =
    document.querySelector(
      '#assignmentModal'
    )


  if (modal) {
    modal.classList.add('hidden')
  }
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  return String(value ?? '')
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    )
}
