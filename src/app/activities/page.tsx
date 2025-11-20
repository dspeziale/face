'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { FaPlus, FaEye, FaEdit, FaTrash, FaPlay, FaCheck, FaTimes } from 'react-icons/fa'
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
  notes: string | null
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

interface Template {
  id: string
  name: string
  description: string
  type: string
  role: string
  steps: {
    id: string
    title: string
    description: string
    order: number
    isRequired: boolean
  }[]
}

export default function ActivitiesPage() {
  const searchParams = useSearchParams()
  const typeFilter = searchParams.get('type')
  const statusFilter = searchParams.get('status')

  const [activities, setActivities] = useState<Activity[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
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
    notes: '',
    templateId: '',
    checklistItems: [] as string[]
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

      const [activitiesRes, locationsRes, usersRes, templatesRes] = await Promise.all([
        fetch(`/api/activities?${params}`),
        fetch('/api/locations'),
        fetch('/api/users').catch(() => ({ json: () => [] })),
        fetch('/api/templates').catch(() => ({ json: () => [] }))
      ])

      const [activitiesData, locationsData, usersData, templatesData] = await Promise.all([
        activitiesRes.json(),
        locationsRes.json(),
        usersRes.json ? usersRes.json() : [],
        templatesRes.json ? templatesRes.json() : []
      ])

      setActivities(activitiesData)
      setLocations(locationsData)
      setUsers(Array.isArray(usersData) ? usersData : [])
      setTemplates(Array.isArray(templatesData) ? templatesData : [])
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

  const openEditModal = (activity: Activity) => {
    setSelectedActivity(activity)
    setFormData({
      title: activity.title,
      description: activity.description || '',
      type: activity.type,
      priority: activity.priority,
      locationId: activity.location.id,
      assignedToId: activity.assignedTo?.id || '',
      scheduledAt: activity.scheduledAt ? new Date(activity.scheduledAt).toISOString().slice(0, 16) : '',
      dueDate: activity.dueDate ? new Date(activity.dueDate).toISOString().slice(0, 16) : '',
      notes: activity.notes || '',
      templateId: '',
      checklistItems: []
    })
    setShowModal(true)
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
      notes: '',
      templateId: '',
      checklistItems: []
    })
  }

  const handleTemplateChange = (templateId: string) => {
    setFormData({ ...formData, templateId })

    if (templateId) {
      const template = templates.find(t => t.id === templateId)
      if (template) {
        setFormData(prev => ({
          ...prev,
          templateId,
          type: template.type as ActivityType,
          checklistItems: template.steps.map(s => s.title)
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        templateId: '',
        checklistItems: []
      }))
    }
  }

  const addChecklistItem = () => {
    setFormData({
      ...formData,
      checklistItems: [...formData.checklistItems, '']
    })
  }

  const updateChecklistItem = (index: number, value: string) => {
    const items = [...formData.checklistItems]
    items[index] = value
    setFormData({ ...formData, checklistItems: items })
  }

  const removeChecklistItem = (index: number) => {
    const items = formData.checklistItems.filter((_, i) => i !== index)
    setFormData({ ...formData, checklistItems: items })
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

  // Filter templates by selected type
  const filteredTemplates = templates.filter(t =>
    !formData.type || t.type === formData.type
  )

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
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => openEditModal(activity)}
                            title="Modifica"
                          >
                            <FaEdit />
                          </button>
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

      {/* Modal Creazione/Modifica */}
      {showModal && (
        <>
          <div className="modal-backdrop" onClick={() => setShowModal(false)}></div>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h5 className="modal-title">
                {selectedActivity ? 'Modifica Attività' : 'Nuova Attività'}
              </h5>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div className="row">
                  {/* Template selection (only for new activities) */}
                  {!selectedActivity && filteredTemplates.length > 0 && (
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Usa Template</label>
                        <select
                          className="form-select"
                          value={formData.templateId}
                          onChange={(e) => handleTemplateChange(e.target.value)}
                        >
                          <option value="">Nessun template</option>
                          {filteredTemplates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name} ({template.steps.length} step)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

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
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType, templateId: '' })}
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

                  {/* Checklist Items (only for new activities) */}
                  {!selectedActivity && (
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label d-flex justify-content-between align-items-center">
                          <span>Checklist</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={addChecklistItem}
                          >
                            <FaPlus className="mr-1" /> Aggiungi
                          </button>
                        </label>
                        {formData.checklistItems.length > 0 ? (
                          <div className="mt-2">
                            {formData.checklistItems.map((item, index) => (
                              <div key={index} className="d-flex gap-2 mb-2">
                                <input
                                  type="text"
                                  className="form-control"
                                  value={item}
                                  onChange={(e) => updateChecklistItem(index, e.target.value)}
                                  placeholder={`Step ${index + 1}`}
                                />
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => removeChecklistItem(index)}
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted small mt-2">
                            Nessun elemento nella checklist. Seleziona un template o aggiungi manualmente.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedActivity ? 'Aggiorna' : 'Crea Attività'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </MainLayout>
  )
}
