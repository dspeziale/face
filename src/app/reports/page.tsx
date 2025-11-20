'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import toast from 'react-hot-toast'
import { FaFileAlt, FaDownload, FaChartBar } from 'react-icons/fa'
import {
  ACTIVITY_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS
} from '@/types'

interface Location {
  id: string
  name: string
}

interface ReportData {
  activities: any[]
  grouped: Record<string, any>
  summary: {
    total: number
    completed: number
    pending: number
    inProgress: number
    byType: Record<string, number>
  }
}

export default function ReportsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    locationId: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations')
      const data = await res.json()
      setLocations(data)
    } catch (error) {
      toast.error('Errore nel caricamento delle location')
    }
  }

  const generateReport = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.locationId) params.set('locationId', filters.locationId)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)

      const res = await fetch(`/api/reports?${params}`)
      const data = await res.json()

      if (res.ok) {
        setReportData(data)
        toast.success('Report generato')
      } else {
        toast.error(data.error || 'Errore nella generazione')
      }
    } catch (error) {
      toast.error('Errore di rete')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadPDF = () => {
    if (!reportData) return

    // Genera HTML per il report
    const locationName = filters.locationId
      ? locations.find(l => l.id === filters.locationId)?.name || 'Tutte'
      : 'Tutte le Location'

    const dateRange = filters.startDate && filters.endDate
      ? `Dal ${formatDate(filters.startDate)} al ${formatDate(filters.endDate)}`
      : 'Tutte le date'

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Report Attività - B&B Management</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
          h2 { color: #6c757d; margin-top: 30px; }
          .header { margin-bottom: 30px; }
          .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .summary-item { display: inline-block; margin-right: 30px; }
          .summary-value { font-size: 24px; font-weight: bold; color: #007bff; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #dee2e6; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #e9ecef; font-weight: bold; }
          tr:nth-child(even) { background: #f8f9fa; }
          .status-COMPLETED { color: #28a745; }
          .status-IN_PROGRESS { color: #17a2b8; }
          .status-PENDING { color: #ffc107; }
          .status-CANCELLED { color: #dc3545; }
          .footer { margin-top: 30px; font-size: 10px; color: #6c757d; text-align: center; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Report Attività</h1>
          <p><strong>Location:</strong> ${locationName}</p>
          <p><strong>Periodo:</strong> ${dateRange}</p>
          <p><strong>Generato il:</strong> ${new Date().toLocaleString('it-IT')}</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-value">${reportData.summary.total}</div>
            <div>Totale Attività</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #28a745;">${reportData.summary.completed}</div>
            <div>Completate</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #17a2b8;">${reportData.summary.inProgress}</div>
            <div>In Corso</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #ffc107;">${reportData.summary.pending}</div>
            <div>In Attesa</div>
          </div>
        </div>

        <h2>Riepilogo per Tipo</h2>
        <table>
          <tr>
            <th>Tipo</th>
            <th>Quantità</th>
          </tr>
          ${Object.entries(reportData.summary.byType)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => `
              <tr>
                <td>${ACTIVITY_TYPE_LABELS[type as keyof typeof ACTIVITY_TYPE_LABELS] || type}</td>
                <td>${count}</td>
              </tr>
            `).join('')}
        </table>

        <h2>Dettaglio Attività</h2>
        <table>
          <tr>
            <th>Data</th>
            <th>Titolo</th>
            <th>Tipo</th>
            <th>Location</th>
            <th>Assegnato a</th>
            <th>Stato</th>
            <th>Completato il</th>
          </tr>
          ${reportData.activities.map(activity => `
            <tr>
              <td>${formatDate(activity.createdAt)}</td>
              <td>${activity.title}</td>
              <td>${ACTIVITY_TYPE_LABELS[activity.type as keyof typeof ACTIVITY_TYPE_LABELS]}</td>
              <td>${activity.location.name}</td>
              <td>${activity.assignedTo?.name || '-'}</td>
              <td class="status-${activity.status}">
                ${STATUS_LABELS[activity.status as keyof typeof STATUS_LABELS]}
              </td>
              <td>${activity.completedAt ? formatDate(activity.completedAt) : '-'}</td>
            </tr>
          `).join('')}
        </table>

        <div class="footer">
          <p>B&B Management - Report generato automaticamente</p>
        </div>
      </body>
      </html>
    `

    // Apri in una nuova finestra per la stampa/download
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <MainLayout
      title="Report"
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Report' }
      ]}
    >
      {/* Filtri */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <FaChartBar className="mr-2" />
            Genera Report
          </h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="form-group">
                <label className="form-label">Location</label>
                <select
                  className="form-select"
                  value={filters.locationId}
                  onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}
                >
                  <option value="">Tutte le location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label className="form-label">Data Inizio</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label className="form-label">Data Fine</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-primary w-100"
                onClick={generateReport}
                disabled={isLoading}
              >
                {isLoading ? 'Generazione...' : 'Genera'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Risultati */}
      {reportData && (
        <>
          {/* Riepilogo */}
          <div className="row">
            <div className="col-md-3">
              <div className="small-box bg-info">
                <div className="inner">
                  <h3>{reportData.summary.total}</h3>
                  <p>Totale Attività</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="small-box bg-success">
                <div className="inner">
                  <h3>{reportData.summary.completed}</h3>
                  <p>Completate</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="small-box bg-warning">
                <div className="inner">
                  <h3>{reportData.summary.pending}</h3>
                  <p>In Attesa</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="small-box bg-primary">
                <div className="inner">
                  <h3>{reportData.summary.inProgress}</h3>
                  <p>In Corso</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabella dettaglio */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title">
                <FaFileAlt className="mr-2" />
                Dettaglio Attività ({reportData.activities.length})
              </h3>
              <button className="btn btn-success btn-sm" onClick={downloadPDF}>
                <FaDownload className="mr-1" />
                Scarica PDF
              </button>
            </div>
            <div className="card-body p-0">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Titolo</th>
                    <th>Tipo</th>
                    <th>Location</th>
                    <th>Assegnato a</th>
                    <th>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.activities.map((activity) => (
                    <tr key={activity.id}>
                      <td>{formatDate(activity.createdAt)}</td>
                      <td>{activity.title}</td>
                      <td>{ACTIVITY_TYPE_LABELS[activity.type as keyof typeof ACTIVITY_TYPE_LABELS]}</td>
                      <td>{activity.location.name}</td>
                      <td>{activity.assignedTo?.name || '-'}</td>
                      <td>
                        <span className={`badge badge-${STATUS_COLORS[activity.status as keyof typeof STATUS_COLORS]}`}>
                          {STATUS_LABELS[activity.status as keyof typeof STATUS_LABELS]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  )
}
