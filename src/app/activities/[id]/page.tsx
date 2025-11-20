'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  FaArrowLeft,
  FaPlay,
  FaCheck,
  FaTimes,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaCalendar
} from 'react-icons/fa'
import {
  ACTIVITY_TYPE_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  ActivityType,
  Priority
} from '@/types'

interface ChecklistItem {
  id: string
  text: string
  isCompleted: boolean
}

interface Attendance {
  id: string
  checkInAt: string
  checkOutAt: string | null
  user: { name: string }
}

interface Activity {
  id: string
  title: string
  description: string
  type: ActivityType
  status: string
  priority: Priority
  scheduledAt: string | null
  startedAt: string | null
  completedAt: string | null
  dueDate: string | null
  notes: string
  cost: number | null
  location: {
    id: string
    name: string
    address: string
    city: string
  }
  assignedTo: {
    id: string
    name: string
    email: string
  } | null
  createdBy: {
    name: string
  }
  checklistItems: ChecklistItem[]
  attendances: Attendance[]
  createdAt: string
}

export default function ActivityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActivity()
  }, [params.id])

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/activities/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setActivity(data)
      } else {
        toast.error('Attività non trovata')
        router.push('/activities')
      }
    } catch (error) {
      toast.error('Errore nel caricamento')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/activities/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        toast.success(`Stato aggiornato a: ${STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS]}`)
        fetchActivity()
      }
    } catch (error) {
      toast.error('Errore nell\'aggiornamento')
    }
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

  if (isLoading) {
    return (
      <MainLayout title="Dettaglio Attività">
        <div className="text-center p-4">
          <div className="spinner"></div>
        </div>
      </MainLayout>
    )
  }

  if (!activity) {
    return null
  }

  return (
    <MainLayout
      title={activity.title}
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Attività', href: '/activities' },
        { label: activity.title }
      ]}
    >
      <div className="mb-3">
        <Link href="/activities" className="btn btn-secondary">
          <FaArrowLeft className="mr-1" /> Torna alla lista
        </Link>
      </div>

      <div className="row">
        {/* Info principali */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title">{activity.title}</h3>
              <div className="d-flex gap-2">
                <span className={`badge badge-${PRIORITY_COLORS[activity.priority]}`}>
                  {PRIORITY_LABELS[activity.priority]}
                </span>
                <span className={`badge badge-${STATUS_COLORS[activity.status as keyof typeof STATUS_COLORS]}`}>
                  {STATUS_LABELS[activity.status as keyof typeof STATUS_LABELS]}
                </span>
              </div>
            </div>
            <div className="card-body">
              <p className="mb-3">{activity.description || 'Nessuna descrizione'}</p>

              <div className="row">
                <div className="col-md-6">
                  <p>
                    <strong>Tipo:</strong><br />
                    {ACTIVITY_TYPE_LABELS[activity.type]}
                  </p>
                  <p>
                    <strong><FaMapMarkerAlt className="mr-1" /> Location:</strong><br />
                    {activity.location.name}<br />
                    <small className="text-muted">
                      {activity.location.address}, {activity.location.city}
                    </small>
                  </p>
                  <p>
                    <strong><FaUser className="mr-1" /> Assegnato a:</strong><br />
                    {activity.assignedTo?.name || 'Non assegnato'}
                  </p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong><FaCalendar className="mr-1" /> Creato il:</strong><br />
                    {formatDate(activity.createdAt)}
                  </p>
                  <p>
                    <strong><FaClock className="mr-1" /> Scadenza:</strong><br />
                    {formatDate(activity.dueDate)}
                  </p>
                  {activity.cost && (
                    <p>
                      <strong>Costo:</strong><br />
                      €{activity.cost.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {activity.notes && (
                <div className="mt-3">
                  <strong>Note:</strong>
                  <p className="text-muted">{activity.notes}</p>
                </div>
              )}
            </div>
            <div className="card-footer">
              <div className="d-flex gap-2">
                {activity.status === 'PENDING' && (
                  <button
                    className="btn btn-info"
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                  >
                    <FaPlay className="mr-1" /> Inizia
                  </button>
                )}
                {activity.status === 'IN_PROGRESS' && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusChange('COMPLETED')}
                  >
                    <FaCheck className="mr-1" /> Completa
                  </button>
                )}
                {activity.status !== 'CANCELLED' && activity.status !== 'COMPLETED' && (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleStatusChange('CANCELLED')}
                  >
                    <FaTimes className="mr-1" /> Annulla
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Timeline</h3>
            </div>
            <div className="card-body">
              <div className="mb-2">
                <strong>Creato:</strong> {formatDate(activity.createdAt)}
                <span className="text-muted ml-2">da {activity.createdBy.name}</span>
              </div>
              {activity.scheduledAt && (
                <div className="mb-2">
                  <strong>Programmato:</strong> {formatDate(activity.scheduledAt)}
                </div>
              )}
              {activity.startedAt && (
                <div className="mb-2">
                  <strong>Iniziato:</strong> {formatDate(activity.startedAt)}
                </div>
              )}
              {activity.completedAt && (
                <div className="mb-2">
                  <strong>Completato:</strong> {formatDate(activity.completedAt)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Checklist */}
          {activity.checklistItems.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Checklist</h3>
              </div>
              <div className="card-body p-0">
                <ul className="list-group list-group-flush">
                  {activity.checklistItems.map((item) => (
                    <li key={item.id} className="list-group-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          readOnly
                          className="mr-2"
                        />
                        <span className={item.isCompleted ? 'text-muted' : ''}>
                          {item.text}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Presenze */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Registro Presenze</h3>
            </div>
            <div className="card-body p-0">
              {activity.attendances.length === 0 ? (
                <div className="text-center text-muted p-3">
                  Nessun check-in registrato
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {activity.attendances.map((attendance) => (
                    <li key={attendance.id} className="list-group-item">
                      <strong>{attendance.user.name}</strong>
                      <br />
                      <small className="text-muted">
                        In: {formatDate(attendance.checkInAt)}
                      </small>
                      {attendance.checkOutAt && (
                        <>
                          <br />
                          <small className="text-muted">
                            Out: {formatDate(attendance.checkOutAt)}
                          </small>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
