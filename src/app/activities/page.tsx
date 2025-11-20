'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { FaPlus, FaEye, FaEdit, FaTrash, FaPlay, FaCheck } from 'react-icons/fa'
import {
  ACTIVITY_TYPE_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  ActivityType,
  Priority
} from '@/types'

interface Activity {
  id: string
  title: string
  description: string
  type: ActivityType
  status: string
  priority: Priority
  scheduledAt: string | null
  dueDate: string | null
  location: {
    id: string
    name: string
  }
  assignedTo: {
    id: string
    name: string
  } | null
  createdAt: string
}

interface Location {
  id: string
  name: string
}

interface User {
  id: string
  name: string
  role: string
}

export default function ActivitiesPage() {
  const searchParams = useSearchParams()
  const typeFilter = searchParams.get('type')
  const statusFilter = searchParams.get('status')

  const [activities, setActivities] = useState<Activity[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'MAINTENANCE' as ActivityType,
    priority: 'MEDIUM' as Priority,
    locationId: '',
    assignedToId: '',
    scheduledAt: '',
    dueDate: '',
    notes: ''
  })

  const [filters, setFilters] = useState({
    type: typeFilter || '',
    status: statusFilter || '',
    locationId: ''
  })

  useEffect(() => {
    fetchData()
  }, [filters])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.type) params.set('type', filters.type)
      if (filters.status) params.set('status', filters.status)
      if (filters.locationId) params.set('locationId', filters.locationId)

      const [activitiesRes, locationsRes, usersRes] = await Promise.all([
        fetch(`/api/activities?${params}`),
        fetch('/api/locations'),
        fetch('/api/users').catch(() => ({ json: () => [] }))
      ])

      const [activitiesData, locationsData, usersData] = await Promise.all([
        activitiesRes.json(),
        locationsRes.json(),
        usersRes.json ? usersRes.json() : []
      ])

      setActivities(activitiesData)
      setLocations(locationsData)
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      toast.error('Errore nel caricamento')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const method = selectedActivity ? 'PUT' : 'POST'
      const url = selectedActivity
        ? `/api/activities/${selectedActivity.id}`
        : '/api/activities'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success(selectedActivity ? 'Attività aggiornata' : 'Attività creata')
        setShowModal(false)
        resetForm()
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Errore')
      }
    } catch (error) {
      toast.error('Errore di rete')
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/activities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        toast.success(`Stato aggiornato a: ${STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS]}`)
        fetchData()
      }
    } catch (error) {
      toast.error('Errore nell\'aggiornamento')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa attività?')) return

    try {
      const res = await fetch(`/api/activities/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Attività eliminata')
        fetchData()
      }
    } catch (error) {
      toast.error('Errore nell\'eliminazione')
    }
  }

  const resetForm = () => {
    setSelectedActivity(null)
    setFormData({
      title: '',
      description: '',
      type: 'MAINTENANCE',
      priority: 'MEDIUM',
      locationId: '',
      assignedToId: '',
      scheduledAt: '',
      dueDate: '',
      notes: ''
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <MainLayout
      title="Attività"
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Attività' }
      ]}
    >
      {/* Filtri */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="form-group mb-0">
                <label className="form-label">Tipo</label>
                <select
                  className="form-select"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="">Tutti i tipi</option>
                  {Object.entries(ACTIVITY_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group mb-0">
                <label className="form-label">Stato</label>
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">Tutti gli stati</option>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group mb-0">
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
          </div>
        </div>
      </div>

      {/* Lista Attività */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title">Elenco Attività</h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
          >
            <FaPlus className="mr-1" /> Nuova Attività
          </button>
        </div>

        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center p-4">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Titolo</th>
                    <th>Tipo</th>
                    <th>Location</th>
                    <th>Assegnato a</th>
                    <th>Priorità</th>
                    <th>Stato</th>
                    <th>Scadenza</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted p-4">
                      Nessuna attività trovata
                    </td>
                  </tr>
                ) : (
                  activities.map((activity) => (
                    <tr key={activity.id}>
                      <td><strong>{activity.title}</strong></td>
                      <td>{ACTIVITY_TYPE_LABELS[activity.type]}</td>
                      <td>{activity.location.name}</td>
                      <td>{activity.assignedTo?.name || '-'}</td>
                      <td>
                        <span className={`badge badge-${PRIORITY_COLORS[activity.priority]}`}>
                          {PRIORITY_LABELS[activity.priority]}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${STATUS_COLORS[activity.status as keyof typeof STATUS_COLORS]}`}>
                          {STATUS_LABELS[activity.status as keyof typeof STATUS_LABELS]}
                        </span>
                      </td>
                      <td>{formatDate(activity.dueDate)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          {activity.status === 'PENDING' && (
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleStatusChange(activity.id, 'IN_PROGRESS')}
                              title="Inizia"
                            >
                              <FaPlay />
                            </button>
                          )}
                          {activity.status === 'IN_PROGRESS' && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleStatusChange(activity.id, 'COMPLETED')}
                              title="Completa"
                            >
                              <FaCheck />
                            </button>
                          )}
                          <Link
                            href={`/activities/${activity.id}`}
                            className="btn btn-sm btn-primary"
                            title="Dettagli"
                          >
                            <FaEye />
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(activity.id)}
                            title="Elimina"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Creazione */}
      {showModal && (
        <>
          <div className="modal-backdrop" onClick={() => setShowModal(false)}></div>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h5 className="modal-title">Nuova Attività</h5>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div className="row">
                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Titolo *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Descrizione</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Tipo *</label>
                      <select
                        className="form-select"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType })}
                        required
                      >
                        {Object.entries(ACTIVITY_TYPE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Priorità *</label>
                      <select
                        className="form-select"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                        required
                      >
                        {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Location *</label>
                      <select
                        className="form-select"
                        value={formData.locationId}
                        onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                        required
                      >
                        <option value="">Seleziona location</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {users.length > 0 && (
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Assegna a</label>
                        <select
                          className="form-select"
                          value={formData.assignedToId}
                          onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                        >
                          <option value="">Non assegnato</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Data Programmata</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Scadenza</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Note</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  Crea Attività
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </MainLayout>
  )
}
