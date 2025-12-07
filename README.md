# CSV Analyzer

A powerful, feature-rich web application for viewing, analyzing, and visualizing CSV files directly in your browser. No installation required - just upload your CSV file and start exploring your data.

### Live Demo
[https://csv-analyzer-online.github.io/](https://csv-analyzer-online.github.io/)

## Features

- **📊 Interactive Data Table** - View and edit CSV data in a spreadsheet-like interface
- **🔍 Search & Filter** - Real-time search across all data with instant highlighting
- **📈 Chart Analysis** - Create visualizations with 6 chart types (Line, Bar, Pie, Doughnut, Scatter, Radar)
- **📥 Load from URL** - Import CSV files directly from web URLs
- **💾 Export Options** - Export data as CSV or JSON
- **📋 Copy to Clipboard** - Quick data copying for use in other applications
- **🖨️ Print Support** - Print-friendly view of your data
- **📊 Statistics Panel** - Detailed column statistics including min, max, average, median, and unique counts
- **🎨 Modern UI** - Clean, responsive design with drag-and-drop file upload

## Technologies Used

- [PapaParse](https://github.com/mholt/PapaParse) - CSV parsing
- [Handsontable](https://github.com/handsontable/handsontable) - Interactive spreadsheet view
- [Chart.js](https://www.chartjs.org/) - Data visualization and charting

## Usage

1. Upload a CSV file by clicking "Choose CSV File" or drag and drop
2. Load from URL by clicking "Load URL" and entering a CSV file URL
3. Use the toolbar to search, export, analyze, and visualize your data
4. Click "Charts" to create visualizations from your data
5. Click "Stats" to view detailed column statistics

## Deployment

This project is set up for automatic deployment to GitHub Pages.

### ⚠️ Important: Enable GitHub Pages First

**Before pushing code, you must enable GitHub Pages:**

1. Go to your repository on GitHub
2. Click on **Settings** (top menu)
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions** (NOT "Deploy from a branch")
5. Save the settings

### Automatic Deployment

Once Pages is enabled:

1. Push your code to the `main` or `master` branch:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. GitHub Actions will automatically build and deploy to GitHub Pages
3. Check the **Actions** tab to see the deployment progress
4. Your site will be available at `https://[username].github.io/[repository-name]/`

### Troubleshooting

If you see the error: "Get Pages site failed"
- Make sure you've enabled GitHub Pages in Settings → Pages
- Select **GitHub Actions** as the source (not "Deploy from a branch")
- Wait a few minutes after enabling, then push your code again

### Local Development

Simply open `index.html` in a web browser or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.
