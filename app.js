const input = document.getElementById('input-file')
const handsontableContainer = document.getElementById('handsontable-container')
const dropZone = document.getElementById('drop-zone')
const loading = document.getElementById('loading')
const error = document.getElementById('error')
const fileInfo = document.getElementById('file-info')
const fileName = document.getElementById('file-name')
const fileNameInput = document.getElementById('file-name-input')
const renameFileBtn = document.getElementById('rename-file-btn')
const fileStats = document.getElementById('file-stats')
const toolbar = document.getElementById('toolbar')
const searchInput = document.getElementById('search-input')
const clearSearch = document.getElementById('clear-search')
const urlModal = document.getElementById('url-modal')
const urlInput = document.getElementById('url-input')
const loadUrlBtn = document.getElementById('load-url-btn')
const loadUrlSubmit = document.getElementById('load-url-submit')
const closeUrlModal = document.getElementById('close-url-modal')
const exportCsvBtn = document.getElementById('export-csv')
const exportJsonBtn = document.getElementById('export-json')
const copyDataBtn = document.getElementById('copy-data')
const printBtn = document.getElementById('print-btn')
const statsBtn = document.getElementById('stats-btn')
const statsPanel = document.getElementById('stats-panel')
const statsContent = document.getElementById('stats-content')
const closeStats = document.getElementById('close-stats')
const urlError = document.getElementById('url-error')
const chartBtn = document.getElementById('chart-btn')
const chartPanel = document.getElementById('chart-panel')
const closeChart = document.getElementById('close-chart')
const chartType = document.getElementById('chart-type')
const xAxisSelect = document.getElementById('x-axis')
const yAxisSelect = document.getElementById('y-axis')
const generateChartBtn = document.getElementById('generate-chart')
const clearChartBtn = document.getElementById('clear-chart')
const chartCanvas = document.getElementById('chart-canvas')
const addSeriesBtn = document.getElementById('add-series')
const seriesSelectors = document.getElementById('series-selectors')
const multiSeriesGroup = document.getElementById('multi-series-group')

let hotInstance = null
let currentData = null
let currentFile = null
let chartInstance = null
let seriesCount = 0

function hideError() {
  error.style.display = 'none'
  error.textContent = ''
}

function showError(message) {
  error.style.display = 'block'
  error.textContent = message
}

function showLoading() {
  loading.style.display = 'flex'
  dropZone.style.display = 'none'
  hideError()
}

function hideLoading() {
  loading.style.display = 'none'
}

function updateFileInfo(file, data) {
  fileInfo.style.display = 'flex'
  const displayName = file ? file.name : 'Loaded from URL'
  fileName.textContent = displayName
  fileNameInput.value = displayName
  const rowCount = data.data.length
  const colCount = data.meta.fields ? data.meta.fields.length : 0
  fileStats.textContent = `${rowCount} rows × ${colCount} columns`
  toolbar.style.display = 'flex'
  currentData = data
  currentFile = file
}

// File rename functionality
renameFileBtn.addEventListener('click', function() {
  fileName.style.display = 'none'
  renameFileBtn.style.display = 'none'
  fileNameInput.style.display = 'block'
  fileNameInput.focus()
  fileNameInput.select()
})

fileNameInput.addEventListener('blur', function() {
  saveFileName()
})

fileNameInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    saveFileName()
  } else if (e.key === 'Escape') {
    cancelRename()
  }
})

function saveFileName() {
  const newName = fileNameInput.value.trim()
  if (newName && newName.length > 0) {
    // Ensure .csv extension if it doesn't have one
    const finalName = newName.endsWith('.csv') ? newName : newName + '.csv'
    fileName.textContent = finalName
    fileNameInput.value = finalName
    
    // Update currentFile name if it exists
    if (currentFile) {
      // Create a new File object with the new name (read-only, but we update display)
      Object.defineProperty(currentFile, 'name', {
        writable: true,
        value: finalName
      })
    }
  } else {
    // Restore original name if empty
    const originalName = currentFile ? currentFile.name : 'Loaded from URL'
    fileName.textContent = originalName
    fileNameInput.value = originalName
  }
  
  fileName.style.display = 'inline'
  renameFileBtn.style.display = 'inline-flex'
  fileNameInput.style.display = 'none'
}

function cancelRename() {
  const originalName = currentFile ? currentFile.name : 'Loaded from URL'
  fileNameInput.value = originalName
  fileName.style.display = 'inline'
  renameFileBtn.style.display = 'inline-flex'
  fileNameInput.style.display = 'none'
}

function processCSV(file) {
  if (!file) return

  if (!file.name.toLowerCase().endsWith('.csv')) {
    showError('Please select a valid CSV file.')
    hideLoading()
    return
  }

  showLoading()

  const reader = new FileReader()

  reader.onload = function (e) {
    try {
      const csv = e.target.result
      const data = Papa.parse(csv, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header) => header.trim()
      })

      if (data.errors && data.errors.length > 0) {
        console.warn('CSV parsing warnings:', data.errors)
      }

      if (!data.data || data.data.length === 0) {
        showError('The CSV file appears to be empty or invalid.')
        hideLoading()
        dropZone.style.display = 'flex'
        return
      }

      // Clear previous instance
      if (hotInstance) {
        hotInstance.destroy()
        hotInstance = null
      }

      // Reset container
      handsontableContainer.innerHTML = ''
      handsontableContainer.className = 'table-container'

      // Create new Handsontable instance
      hotInstance = Handsontable(handsontableContainer, {
        data: data.data,
        rowHeaders: true,
        colHeaders: data.meta.fields || Object.keys(data.data[0] || {}),
        columnSorting: true,
        width: '100%',
        height: '100%',
        licenseKey: 'non-commercial-and-evaluation',
        stretchH: 'all',
        autoWrapRow: true,
        autoWrapCol: true,
        contextMenu: true,
        filters: true,
        dropdownMenu: true,
        manualColumnResize: true,
        manualRowResize: true,
        readOnly: false,
        search: true
      })

      updateFileInfo(file, data)
      hideLoading()
      dropZone.style.display = 'none'
      
      // Setup search functionality
      setupSearch()
      
      // Populate chart column selectors
      populateChartSelectors(data)
    } catch (err) {
      showError(`Error processing CSV file: ${err.message}`)
      hideLoading()
      dropZone.style.display = 'flex'
    }
  }

  reader.onerror = function () {
    showError('Error reading file. Please try again.')
    hideLoading()
    dropZone.style.display = 'flex'
  }

  reader.readAsText(file)
}

// File input change handler
input.onchange = function () {
  const file = this.files[0]
  if (file) {
    processCSV(file)
    // Reset input to allow selecting the same file again
    this.value = ''
  }
}

// Drag and drop handlers
dropZone.addEventListener('dragover', function (e) {
  e.preventDefault()
  e.stopPropagation()
  dropZone.classList.add('drag-over')
})

dropZone.addEventListener('dragleave', function (e) {
  e.preventDefault()
  e.stopPropagation()
  dropZone.classList.remove('drag-over')
})

dropZone.addEventListener('drop', function (e) {
  e.preventDefault()
  e.stopPropagation()
  dropZone.classList.remove('drag-over')

  const files = e.dataTransfer.files
  if (files.length > 0) {
    processCSV(files[0])
  }
})

// Click on drop zone to trigger file input
dropZone.addEventListener('click', function (e) {
  if (e.target === dropZone || e.target.closest('.drop-zone-content')) {
    input.click()
  }
})

// Prevent default drag behaviors on document
document.addEventListener('dragover', function (e) {
  e.preventDefault()
})

document.addEventListener('drop', function (e) {
  e.preventDefault()
})

// Search functionality
function setupSearch() {
  if (!hotInstance) return
  
  searchInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase()
    if (query) {
      clearSearch.style.display = 'block'
      hotInstance.search.query(query)
      hotInstance.render()
    } else {
      clearSearch.style.display = 'none'
      hotInstance.search.query('')
      hotInstance.render()
    }
  })
  
  clearSearch.addEventListener('click', function() {
    searchInput.value = ''
    clearSearch.style.display = 'none'
    if (hotInstance) {
      hotInstance.search.query('')
      hotInstance.render()
    }
  })
}

// Load from URL
loadUrlBtn.addEventListener('click', function() {
  urlModal.style.display = 'flex'
  urlInput.focus()
})

closeUrlModal.addEventListener('click', function() {
  urlModal.style.display = 'none'
  urlInput.value = ''
  urlError.style.display = 'none'
})

urlModal.addEventListener('click', function(e) {
  if (e.target === urlModal) {
    urlModal.style.display = 'none'
    urlInput.value = ''
    urlError.style.display = 'none'
  }
})

loadUrlSubmit.addEventListener('click', async function() {
  const url = urlInput.value.trim()
  if (!url) {
    urlError.textContent = 'Please enter a valid URL'
    urlError.style.display = 'block'
    return
  }
  
  showLoading()
  urlError.style.display = 'none'
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const csv = await response.text()
    
    const data = Papa.parse(csv, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim()
    })
    
    if (!data.data || data.data.length === 0) {
      throw new Error('The CSV file appears to be empty or invalid.')
    }
    
    // Clear previous instance
    if (hotInstance) {
      hotInstance.destroy()
      hotInstance = null
    }
    
    handsontableContainer.innerHTML = ''
    handsontableContainer.className = 'table-container'
    
    hotInstance = Handsontable(handsontableContainer, {
      data: data.data,
      rowHeaders: true,
      colHeaders: data.meta.fields || Object.keys(data.data[0] || {}),
      columnSorting: true,
      width: '100%',
      height: '100%',
      licenseKey: 'non-commercial-and-evaluation',
      stretchH: 'all',
      autoWrapRow: true,
      autoWrapCol: true,
      contextMenu: true,
      filters: true,
      dropdownMenu: true,
      manualColumnResize: true,
      manualRowResize: true,
      readOnly: false,
      search: true
    })
    
    updateFileInfo(null, data)
    hideLoading()
    dropZone.style.display = 'none'
    urlModal.style.display = 'none'
    urlInput.value = ''
    setupSearch()
    populateChartSelectors(data)
  } catch (err) {
    urlError.textContent = `Error loading CSV: ${err.message}`
    urlError.style.display = 'block'
    hideLoading()
  }
})

urlInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    loadUrlSubmit.click()
  }
})

// Export to CSV
exportCsvBtn.addEventListener('click', function() {
  if (!hotInstance) return
  
  const data = hotInstance.getData()
  const headers = hotInstance.getColHeader()
  const csv = Papa.unparse({
    fields: headers,
    data: data
  })
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', (currentFile ? currentFile.name.replace('.csv', '') : 'export') + '_export.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
})

// Export to JSON
exportJsonBtn.addEventListener('click', function() {
  if (!hotInstance) return
  
  const data = hotInstance.getData()
  const headers = hotInstance.getColHeader()
  const jsonData = data.map(row => {
    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = row[index]
    })
    return obj
  })
  
  const json = JSON.stringify(jsonData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', (currentFile ? currentFile.name.replace('.csv', '') : 'export') + '_export.json')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
})

// Copy to clipboard
copyDataBtn.addEventListener('click', async function() {
  if (!hotInstance) return
  
  try {
    const data = hotInstance.getData()
    const headers = hotInstance.getColHeader()
    const csv = Papa.unparse({
      fields: headers,
      data: data
    })
    
    await navigator.clipboard.writeText(csv)
    
    // Show feedback
    const originalText = copyDataBtn.innerHTML
    copyDataBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!'
    copyDataBtn.style.background = '#4caf50'
    
    setTimeout(() => {
      copyDataBtn.innerHTML = originalText
      copyDataBtn.style.background = ''
    }, 2000)
  } catch (err) {
    showError('Failed to copy to clipboard')
  }
})

// Print
printBtn.addEventListener('click', function() {
  if (!hotInstance) return
  
  const printWindow = window.open('', '_blank')
  const data = hotInstance.getData()
  const headers = hotInstance.getColHeader()
  
  let html = `
    <html>
      <head>
        <title>CSV Viewer - Print</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          @media print {
            body { margin: 0; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <h2>${currentFile ? currentFile.name : 'CSV Data'}</h2>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `<tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `
  
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
})

// Statistics
statsBtn.addEventListener('click', function() {
  if (!hotInstance || !currentData) return
  
  const data = currentData.data
  const headers = currentData.meta.fields || Object.keys(data[0] || {})
  
  let statsHtml = '<div class="stats-grid">'
  
  headers.forEach((header, colIndex) => {
    const columnData = data.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '')
    const numericData = columnData.map(val => parseFloat(val)).filter(val => !isNaN(val))
    
    statsHtml += `<div class="stat-card">
      <h4>${header}</h4>
      <div class="stat-item"><strong>Total:</strong> ${columnData.length}</div>
      <div class="stat-item"><strong>Empty:</strong> ${data.length - columnData.length}</div>`
    
    if (numericData.length > 0) {
      const sorted = [...numericData].sort((a, b) => a - b)
      const sum = numericData.reduce((a, b) => a + b, 0)
      const avg = sum / numericData.length
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]
      const min = sorted[0]
      const max = sorted[sorted.length - 1]
      
      statsHtml += `
        <div class="stat-item"><strong>Numeric:</strong> ${numericData.length}</div>
        <div class="stat-item"><strong>Min:</strong> ${min.toFixed(2)}</div>
        <div class="stat-item"><strong>Max:</strong> ${max.toFixed(2)}</div>
        <div class="stat-item"><strong>Avg:</strong> ${avg.toFixed(2)}</div>
        <div class="stat-item"><strong>Median:</strong> ${median.toFixed(2)}</div>
      `
    } else {
      const unique = new Set(columnData)
      statsHtml += `<div class="stat-item"><strong>Unique:</strong> ${unique.size}</div>`
    }
    
    statsHtml += '</div>'
  })
  
  statsHtml += '</div>'
  statsContent.innerHTML = statsHtml
  statsPanel.style.display = 'block'
})

closeStats.addEventListener('click', function() {
  statsPanel.style.display = 'none'
})

statsPanel.addEventListener('click', function(e) {
  if (e.target === statsPanel) {
    statsPanel.style.display = 'none'
  }
})

// AdSense Configuration
// Set this to true to enable ads after AdSense approval
const ENABLE_ADS = false

function initAds() {
  if (ENABLE_ADS) {
    const adContainers = document.querySelectorAll('.ads-container')
    adContainers.forEach(container => {
      container.style.display = 'flex'
    })
    
    // Push ads to AdSense (if not already done)
    if (typeof adsbygoogle !== 'undefined') {
      try {
        (adsbygoogle = window.adsbygoogle || []).push({})
      } catch (e) {
        console.log('AdSense not ready yet')
      }
    }
  }
}

// Initialize ads on page load
document.addEventListener('DOMContentLoaded', function() {
  initAds()
})

// Chart Analysis Functions
function populateChartSelectors(data) {
  const headers = data.meta.fields || Object.keys(data.data[0] || {})
  
  // Clear existing options
  xAxisSelect.innerHTML = '<option value="">Select column...</option>'
  yAxisSelect.innerHTML = '<option value="">Select column...</option>'
  
  // Populate options
  headers.forEach(header => {
    const option1 = document.createElement('option')
    option1.value = header
    option1.textContent = header
    xAxisSelect.appendChild(option1)
    
    const option2 = document.createElement('option')
    option2.value = header
    option2.textContent = header
    yAxisSelect.appendChild(option2)
  })
}

function getNumericColumns(data) {
  const headers = data.meta.fields || Object.keys(data.data[0] || {})
  const numericCols = []
  
  headers.forEach(header => {
    const values = data.data.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '')
    const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v))
    if (numericValues.length > values.length * 0.5) { // At least 50% numeric
      numericCols.push(header)
    }
  })
  
  return numericCols
}

function generateChart() {
  if (!currentData || !hotInstance) {
    showError('Please load a CSV file first.')
    return
  }
  
  const type = chartType.value
  const xAxis = xAxisSelect.value
  const yAxis = yAxisSelect.value
  
  if (!xAxis || !yAxis) {
    showError('Please select both X-axis and Y-axis columns.')
    return
  }
  
  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  
  const data = currentData.data
  const headers = currentData.meta.fields || Object.keys(data[0] || {})
  
  // Get selected series
  const selectedSeries = []
  const seriesElements = seriesSelectors.querySelectorAll('.series-selector')
  seriesElements.forEach(el => {
    const select = el.querySelector('select')
    if (select && select.value) {
      selectedSeries.push(select.value)
    }
  })
  
  let chartConfig = {}
  
  if (type === 'pie' || type === 'doughnut') {
    // Pie/Doughnut charts: X-axis is labels, Y-axis is values
    const labels = data.map(row => String(row[xAxis] || ''))
    const values = data.map(row => parseFloat(row[yAxis]) || 0)
    
    chartConfig = {
      type: type,
      data: {
        labels: labels,
        datasets: [{
          label: yAxis,
          data: values,
          backgroundColor: generateColors(values.length)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right'
          },
          title: {
            display: true,
            text: `${yAxis} by ${xAxis}`
          }
        }
      }
    }
  } else if (type === 'scatter') {
    // Scatter plot: both axes are numeric
    const xValues = data.map(row => parseFloat(row[xAxis]) || 0)
    const yValues = data.map(row => parseFloat(row[yAxis]) || 0)
    
    const scatterData = xValues.map((x, i) => ({
      x: x,
      y: yValues[i]
    }))
    
    chartConfig = {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${yAxis} vs ${xAxis}`,
          data: scatterData,
          backgroundColor: 'rgba(102, 126, 234, 0.6)',
          borderColor: 'rgba(102, 126, 234, 1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          x: {
            title: {
              display: true,
              text: xAxis
            }
          },
          y: {
            title: {
              display: true,
              text: yAxis
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: `${yAxis} vs ${xAxis}`
          }
        }
      }
    }
  } else if (type === 'radar') {
    // Radar chart: X-axis is categories, Y-axis and series are values
    const labels = [...new Set(data.map(row => String(row[xAxis] || '')))]
    const values = labels.map(label => {
      const matching = data.filter(row => String(row[xAxis] || '') === label)
      return matching.reduce((sum, row) => sum + (parseFloat(row[yAxis]) || 0), 0) / matching.length
    })
    
    const datasets = [{
      label: yAxis,
      data: values,
      borderColor: 'rgba(102, 126, 234, 1)',
      backgroundColor: 'rgba(102, 126, 234, 0.2)'
    }]
    
    // Add additional series
    selectedSeries.forEach((series, idx) => {
      const seriesValues = labels.map(label => {
        const matching = data.filter(row => String(row[xAxis] || '') === label)
        return matching.reduce((sum, row) => sum + (parseFloat(row[series]) || 0), 0) / matching.length
      })
      datasets.push({
        label: series,
        data: seriesValues,
        borderColor: generateColor(idx + 1),
        backgroundColor: generateColor(idx + 1, 0.2)
      })
    })
    
    chartConfig = {
      type: 'radar',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: `Radar Chart: ${xAxis}`
          }
        }
      }
    }
  } else {
    // Line and Bar charts
    const labels = [...new Set(data.map(row => String(row[xAxis] || '')))]
    
    const datasets = []
    
    // Main Y-axis series
    const mainValues = labels.map(label => {
      const matching = data.filter(row => String(row[xAxis] || '') === label)
      return matching.reduce((sum, row) => sum + (parseFloat(row[yAxis]) || 0), 0)
    })
    
    datasets.push({
      label: yAxis,
      data: mainValues,
      borderColor: 'rgba(102, 126, 234, 1)',
      backgroundColor: type === 'bar' ? 'rgba(102, 126, 234, 0.6)' : 'rgba(102, 126, 234, 0.1)',
      tension: type === 'line' ? 0.4 : 0
    })
    
    // Add additional series
    selectedSeries.forEach((series, idx) => {
      const seriesValues = labels.map(label => {
        const matching = data.filter(row => String(row[xAxis] || '') === label)
        return matching.reduce((sum, row) => sum + (parseFloat(row[series]) || 0), 0)
      })
      const color = generateColor(idx + 1)
      datasets.push({
        label: series,
        data: seriesValues,
        borderColor: color,
        backgroundColor: type === 'bar' ? color.replace('1)', '0.6)') : color.replace('1)', '0.1)'),
        tension: type === 'line' ? 0.4 : 0
      })
    })
    
    chartConfig = {
      type: type,
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Value'
            }
          },
          x: {
            title: {
              display: true,
              text: xAxis
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: `${yAxis} by ${xAxis}`
          },
          legend: {
            display: datasets.length > 1
          }
        }
      }
    }
  }
  
  // Create chart
  const ctx = chartCanvas.getContext('2d')
  chartInstance = new Chart(ctx, chartConfig)
}

function generateColors(count) {
  const colors = []
  const hueStep = 360 / count
  for (let i = 0; i < count; i++) {
    const hue = i * hueStep
    colors.push(`hsla(${hue}, 70%, 60%, 0.8)`)
  }
  return colors
}

function generateColor(index, alpha = 1) {
  const hues = [102, 162, 222, 282, 342, 42]
  const hue = hues[index % hues.length]
  return `hsla(${hue}, 70%, 60%, ${alpha})`
}

// Chart event listeners
chartBtn.addEventListener('click', function() {
  if (!currentData) {
    showError('Please load a CSV file first.')
    return
  }
  chartPanel.style.display = 'block'
})

closeChart.addEventListener('click', function() {
  chartPanel.style.display = 'none'
})

chartPanel.addEventListener('click', function(e) {
  if (e.target === chartPanel) {
    chartPanel.style.display = 'none'
  }
})

chartType.addEventListener('change', function() {
  const type = this.value
  // Show multi-series for line, bar, and radar charts
  if (type === 'line' || type === 'bar' || type === 'radar') {
    multiSeriesGroup.style.display = 'block'
  } else {
    multiSeriesGroup.style.display = 'none'
    // Clear series when hiding
    seriesSelectors.innerHTML = ''
    seriesCount = 0
  }
})

generateChartBtn.addEventListener('click', generateChart)

clearChartBtn.addEventListener('click', function() {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  xAxisSelect.value = ''
  yAxisSelect.value = ''
  chartType.value = 'line'
  seriesSelectors.innerHTML = ''
  seriesCount = 0
  multiSeriesGroup.style.display = 'none'
})

addSeriesBtn.addEventListener('click', function() {
  if (!currentData) return
  
  const headers = currentData.meta.fields || Object.keys(currentData.data[0] || {})
  const selectedY = yAxisSelect.value
  const existingSeries = Array.from(seriesSelectors.querySelectorAll('select')).map(s => s.value).filter(v => v)
  
  const seriesDiv = document.createElement('div')
  seriesDiv.className = 'series-selector'
  const select = document.createElement('select')
  select.className = 'chart-select'
  select.innerHTML = '<option value="">Select column...</option>'
  
  headers.forEach(header => {
    if (header !== selectedY && !existingSeries.includes(header)) {
      const option = document.createElement('option')
      option.value = header
      option.textContent = header
      select.appendChild(option)
    }
  })
  
  const removeBtn = document.createElement('button')
  removeBtn.className = 'remove-series-btn'
  removeBtn.textContent = '×'
  removeBtn.onclick = function() {
    seriesDiv.remove()
  }
  
  seriesDiv.appendChild(select)
  seriesDiv.appendChild(removeBtn)
  seriesSelectors.appendChild(seriesDiv)
  seriesCount++
})
