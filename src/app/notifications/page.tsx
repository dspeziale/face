'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import toast from 'react-hot-toast'
import { FaBell, FaCheck, FaTrash, FaCheckDouble } from 'react-icons/fa'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (error) {
      toast.error('Errore nel caricamento')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })

      if (res.ok) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ))
      }
    } catch (error) {
      toast.error('Errore nell\'aggiornamento')
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PUT'
      })

      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })))
        toast.success('Tutte le notifiche segnate come lette')
      }
    } catch (error) {
      toast.error('Errore nell\'aggiornamento')
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setNotifications(notifications.filter(n => n.id !== id))
        toast.success('Notifica eliminata')
      }
    } catch (error) {
      toast.error('Errore nell\'eliminazione')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Adesso'
    if (minutes < 60) return `${minutes} min fa`
    if (hours < 24) return `${hours} ore fa`
    if (days < 7) return `${days} giorni fa`

    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'success'
      case 'warning': return 'warning'
      case 'error': return 'danger'
      default: return 'info'
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <MainLayout
      title="Notifiche"
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Notifiche' }
      ]}
    >
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title">
            <FaBell className="mr-2" />
            Notifiche
            {unreadCount > 0 && (
              <span className="badge badge-danger ml-2">{unreadCount}</span>
            )}
          </h3>
          {unreadCount > 0 && (
            <button
              className="btn btn-sm btn-primary"
              onClick={markAllAsRead}
            >
              <FaCheckDouble className="mr-1" />
              Segna tutte come lette
            </button>
          )}
        </div>

        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center p-4">
              <div className="spinner"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-muted p-4">
              <FaBell size={48} className="mb-3" style={{ opacity: 0.3 }} />
              <p>Nessuna notifica</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 ${!notification.isRead ? 'bg-light' : ''}`}
                  style={{ borderBottom: '1px solid #dee2e6' }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-1">
                        <span className={`badge badge-${getTypeColor(notification.type)} mr-2`}>
                          {notification.type}
                        </span>
                        <strong>{notification.title}</strong>
                        {!notification.isRead && (
                          <span className="badge badge-primary ml-2">Nuovo</span>
                        )}
                      </div>
                      <p className="mb-1 text-muted">{notification.message}</p>
                      <small className="text-muted">
                        {formatDate(notification.createdAt)}
                      </small>
                    </div>
                    <div className="d-flex gap-2 ml-3">
                      {!notification.isRead && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => markAsRead(notification.id)}
                          title="Segna come letta"
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteNotification(notification.id)}
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
    </MainLayout>
  )
}
