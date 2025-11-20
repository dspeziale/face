'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import toast from 'react-hot-toast'
import { FaPlus, FaEdit, FaTrash, FaStream, FaListOl } from 'react-icons/fa'
import { ACTIVITY_TYPE_LABELS, ROLE_LABELS, ActivityType, UserRole } from '@/types'

interface TemplateStep {
  id: string
  title: string
  description: string
  order: number
  isRequired: boolean
}

interface Template {
  id: string
  name: string
  description: string
  type: ActivityType
  role: UserRole
  isDefault: boolean
  steps: TemplateStep[]
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'CLEANING' as ActivityType,
    role: 'HOUSEKEEPER' as UserRole,
    isDefault: false,
    steps: [{ title: '', isRequired: true }]
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (error) {
      toast.error('Errore nel caricamento')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Filtra step vuoti
    const validSteps = formData.steps.filter(s => s.title.trim())

    if (validSteps.length === 0) {
      toast.error('Aggiungi almeno uno step')
      return
    }

    try {
      const method = selectedTemplate ? 'PUT' : 'POST'
      const url = selectedTemplate
        ? `/api/templates/${selectedTemplate.id}`
        : '/api/templates'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          steps: validSteps
        })
      })

      if (res.ok) {
        toast.success(selectedTemplate ? 'Template aggiornato' : 'Template creato')
        setShowModal(false)
        resetForm()
        fetchTemplates()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Errore')
      }
    } catch (error) {
      toast.error('Errore di rete')
    }
  }

  const openEditModal = (template: Template) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      type: template.type,
      role: template.role,
      isDefault: template.isDefault,
      steps: template.steps.map(s => ({ title: s.title, isRequired: s.isRequired }))
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo template?')) return

    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Template eliminato')
        fetchTemplates()
      }
    } catch (error) {
      toast.error('Errore nell\'eliminazione')
    }
  }

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { title: '', isRequired: true }]
    })
  }

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index)
    setFormData({ ...formData, steps: newSteps })
  }

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...formData.steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setFormData({ ...formData, steps: newSteps })
  }

  const resetForm = () => {
    setSelectedTemplate(null)
    setFormData({
      name: '',
      description: '',
      type: 'CLEANING',
      role: 'HOUSEKEEPER',
      isDefault: false,
      steps: [{ title: '', isRequired: true }]
    })
  }

  return (
    <MainLayout
      title="Flow Attività"
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Flow Attività' }
      ]}
    >
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title">
            <FaStream className="mr-2" />
            Template Flow Attività
          </h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
          >
            <FaPlus className="mr-1" /> Nuovo Template
          </button>
        </div>

        <div className="card-body">
          {isLoading ? (
            <div className="text-center p-4">
              <div className="spinner"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center text-muted p-4">
              Nessun template trovato. Crea il tuo primo flow di attività!
            </div>
          ) : (
            <div className="row">
              {templates.map((template) => (
                <div key={template.id} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between">
                      <strong>{template.name}</strong>
                      {template.isDefault && (
                        <span className="badge badge-primary">Default</span>
                      )}
                    </div>
                    <div className="card-body">
                      <p className="text-muted">{template.description || 'Nessuna descrizione'}</p>
                      <div className="mb-2">
                        <span className="badge badge-info mr-2">
                          {ACTIVITY_TYPE_LABELS[template.type]}
                        </span>
                        <span className="badge badge-secondary">
                          {ROLE_LABELS[template.role]}
                        </span>
                      </div>
                      <div>
                        <strong><FaListOl className="mr-1" /> Steps ({template.steps.length}):</strong>
                        <ol className="mt-2 mb-0" style={{ paddingLeft: '1.2rem' }}>
                          {template.steps.slice(0, 5).map((step) => (
                            <li key={step.id} className="text-sm">
                              {step.title}
                              {!step.isRequired && <span className="text-muted"> (opzionale)</span>}
                            </li>
                          ))}
                          {template.steps.length > 5 && (
                            <li className="text-muted">... e altri {template.steps.length - 5}</li>
                          )}
                        </ol>
                      </div>
                    </div>
                    <div className="card-footer d-flex justify-content-end gap-2">
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => openEditModal(template)}
                        title="Modifica"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(template.id)}
                        title="Elimina"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
              <h5 className="modal-title">{selectedTemplate ? 'Modifica Template' : 'Nuovo Template Flow'}</h5>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrizione</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Tipo Attività *</label>
                      <select
                        className="form-select"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType })}
                      >
                        {Object.entries(ACTIVITY_TYPE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Ruolo *</label>
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      >
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    />{' '}
                    Imposta come default per questo tipo/ruolo
                  </label>
                </div>

                <hr />

                <div className="form-group">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label mb-0">Steps del Flow *</label>
                    <button type="button" className="btn btn-sm btn-success" onClick={addStep}>
                      <FaPlus /> Aggiungi Step
                    </button>
                  </div>

                  {formData.steps.map((step, index) => (
                    <div key={index} className="d-flex gap-2 mb-2 align-items-center">
                      <span className="text-muted">{index + 1}.</span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Descrizione step"
                        value={step.title}
                        onChange={(e) => updateStep(index, 'title', e.target.value)}
                      />
                      <label className="mb-0" style={{ whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={step.isRequired}
                          onChange={(e) => updateStep(index, 'isRequired', e.target.checked)}
                        />{' '}
                        Obblig.
                      </label>
                      {formData.steps.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removeStep(index)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedTemplate ? 'Aggiorna' : 'Crea Template'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </MainLayout>
  )
}
