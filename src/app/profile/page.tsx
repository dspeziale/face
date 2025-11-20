'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import MainLayout from '@/components/layout/MainLayout'
import toast from 'react-hot-toast'
import { FaUser, FaSave, FaKey } from 'react-icons/fa'
import { ROLE_LABELS, UserRole } from '@/types'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (session?.user) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || ''
        })
      }
    } catch (error) {
      toast.error('Errore nel caricamento del profilo')
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success('Profilo aggiornato')
        // Update session with new name
        await update({ name: formData.name })
      } else {
        const error = await res.json()
        toast.error(error.error || 'Errore nell\'aggiornamento')
      }
    } catch (error) {
      toast.error('Errore di rete')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Le password non coincidono')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La password deve essere di almeno 6 caratteri')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (res.ok) {
        toast.success('Password aggiornata')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        const error = await res.json()
        toast.error(error.error || 'Errore nell\'aggiornamento')
      }
    } catch (error) {
      toast.error('Errore di rete')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout
      title="Profilo"
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Profilo' }
      ]}
    >
      <div className="row">
        {/* Informazioni Profilo */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <FaUser className="mr-2" />
                Informazioni Personali
              </h3>
            </div>
            <form onSubmit={handleProfileSubmit}>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Nome</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    disabled
                  />
                  <small className="text-muted">L'email non può essere modificata</small>
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
                  <label className="form-label">Ruolo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ROLE_LABELS[session?.user?.role as UserRole] || session?.user?.role || ''}
                    disabled
                  />
                </div>
              </div>
              <div className="card-footer">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  <FaSave className="mr-1" />
                  {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Cambio Password */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <FaKey className="mr-2" />
                Cambio Password
              </h3>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Password Attuale</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nuova Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Conferma Nuova Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="card-footer">
                <button
                  type="submit"
                  className="btn btn-warning"
                  disabled={isLoading}
                >
                  <FaKey className="mr-1" />
                  {isLoading ? 'Aggiornamento...' : 'Cambia Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
