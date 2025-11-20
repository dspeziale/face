'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import toast from 'react-hot-toast'
import { FaPlus, FaEdit, FaTrash, FaUserCheck, FaUserTimes } from 'react-icons/fa'
import { ROLE_LABELS, UserRole } from '@/types'

interface User {
  id: string
  email: string
  name: string
  phone: string
  role: UserRole
  isActive: boolean
  createdAt: string
  _count: {
    assignedActivities: number
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'WORKER' as UserRole
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      } else {
        toast.error('Non autorizzato')
      }
    } catch (error) {
      toast.error('Errore nel caricamento')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const method = selectedUser ? 'PUT' : 'POST'
      const url = selectedUser
        ? `/api/users/${selectedUser.id}`
        : '/api/users'

      // Don't send empty password on edit
      const payload = selectedUser && !formData.password
        ? { ...formData, password: undefined }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(selectedUser ? 'Utente aggiornato' : 'Utente creato')
        setShowModal(false)
        resetForm()
        fetchUsers()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Errore')
      }
    } catch (error) {
      toast.error('Errore di rete')
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (res.ok) {
        toast.success(`Utente ${!isActive ? 'attivato' : 'disattivato'}`)
        fetchUsers()
      }
    } catch (error) {
      toast.error('Errore nell\'aggiornamento')
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente? Tutte le sue attività e presenze verranno eliminate.')) return

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Utente eliminato')
        fetchUsers()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Errore nell\'eliminazione')
      }
    } catch (error) {
      toast.error('Errore di rete')
    }
  }

  const resetForm = () => {
    setSelectedUser(null)
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'WORKER'
    })
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      phone: user.phone || '',
      role: user.role
    })
    setShowModal(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT')
  }

  return (
    <MainLayout
      title="Gestione Utenti"
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Utenti' }
      ]}
    >
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title">Elenco Utenti</h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
          >
            <FaPlus className="mr-1" /> Nuovo Utente
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
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Telefono</th>
                    <th>Ruolo</th>
                    <th>Attività</th>
                    <th>Stato</th>
                    <th>Creato il</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted p-4">
                      Nessun utente trovato
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td><strong>{user.name}</strong></td>
                      <td>{user.email}</td>
                      <td>{user.phone || '-'}</td>
                      <td>
                        <span className={`badge badge-${
                          user.role === 'ADMIN' ? 'danger' :
                          user.role === 'OPERATOR' ? 'primary' :
                          user.role === 'WORKER' ? 'warning' : 'info'
                        }`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-secondary">
                          {user._count.assignedActivities}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${user.isActive ? 'success' : 'danger'}`}>
                          {user.isActive ? 'Attivo' : 'Inattivo'}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => openEditModal(user)}
                            title="Modifica"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className={`btn btn-sm btn-${user.isActive ? 'warning' : 'success'}`}
                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                            title={user.isActive ? 'Disattiva' : 'Attiva'}
                          >
                            {user.isActive ? <FaUserTimes /> : <FaUserCheck />}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(user.id)}
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
          <div className="modal">
            <div className="modal-header">
              <h5 className="modal-title">{selectedUser ? 'Modifica Utente' : 'Nuovo Utente'}</h5>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
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
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!selectedUser}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Password {selectedUser ? '(lascia vuoto per non modificare)' : '*'}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!selectedUser}
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefono</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ruolo *</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    required
                  >
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedUser ? 'Aggiorna' : 'Crea Utente'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </MainLayout>
  )
}
