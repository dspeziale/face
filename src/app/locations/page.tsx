'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { FaPlus, FaEdit, FaTrash, FaQrcode, FaWifi, FaParking, FaSnowflake } from 'react-icons/fa'
import { QRCodeSVG } from 'qrcode.react'

interface Location {
  id: string
  name: string
  address: string
  city: string
  postalCode: string
  phone: string
  email: string
  capacity: number
  rooms: number
  bathrooms: number
  hasWifi: boolean
  hasParking: boolean
  hasAC: boolean
  isActive: boolean
  qrCode: string
  _count: {
    activities: number
  }
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    description: '',
    capacity: 1,
    rooms: 1,
    bathrooms: 1,
    hasWifi: true,
    hasParking: false,
    hasAC: false,
    notes: ''
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const method = selectedLocation ? 'PUT' : 'POST'
      const url = selectedLocation
        ? `/api/locations/${selectedLocation.id}`
        : '/api/locations'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success(selectedLocation ? 'Location aggiornata' : 'Location creata')
        setShowModal(false)
        resetForm()
        fetchLocations()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Errore')
      }
    } catch (error) {
      toast.error('Errore di rete')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa location?')) return

    try {
      const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Location eliminata')
        fetchLocations()
      } else {
        toast.error('Errore nell\'eliminazione')
      }
    } catch (error) {
      toast.error('Errore di rete')
    }
  }

  const openEditModal = (location: Location) => {
    setSelectedLocation(location)
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      postalCode: location.postalCode || '',
      phone: location.phone || '',
      email: location.email || '',
      description: '',
      capacity: location.capacity,
      rooms: location.rooms,
      bathrooms: location.bathrooms,
      hasWifi: location.hasWifi,
      hasParking: location.hasParking,
      hasAC: location.hasAC,
      notes: ''
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setSelectedLocation(null)
    setFormData({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      email: '',
      description: '',
      capacity: 1,
      rooms: 1,
      bathrooms: 1,
      hasWifi: true,
      hasParking: false,
      hasAC: false,
      notes: ''
    })
  }

  const openQRModal = (location: Location) => {
    setSelectedLocation(location)
    setShowQRModal(true)
  }

  return (
    <MainLayout
      title="Location"
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Location' }
      ]}
    >
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title">Elenco Location</h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
          >
            <FaPlus className="mr-1" /> Nuova Location
          </button>
        </div>

        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center p-4">
              <div className="spinner"></div>
            </div>
          ) : (
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Indirizzo</th>
                  <th>Città</th>
                  <th>Capacità</th>
                  <th>Servizi</th>
                  <th>Attività</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {locations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted p-4">
                      Nessuna location trovata
                    </td>
                  </tr>
                ) : (
                  locations.map((location) => (
                    <tr key={location.id}>
                      <td><strong>{location.name}</strong></td>
                      <td>{location.address}</td>
                      <td>{location.city}</td>
                      <td>{location.capacity} ospiti</td>
                      <td>
                        {location.hasWifi && <FaWifi className="text-info mr-1" title="WiFi" />}
                        {location.hasParking && <FaParking className="text-success mr-1" title="Parcheggio" />}
                        {location.hasAC && <FaSnowflake className="text-primary" title="Aria Condizionata" />}
                      </td>
                      <td>
                        <span className="badge badge-info">{location._count.activities}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${location.isActive ? 'success' : 'danger'}`}>
                          {location.isActive ? 'Attiva' : 'Inattiva'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => openQRModal(location)}
                            title="QR Code"
                          >
                            <FaQrcode />
                          </button>
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => openEditModal(location)}
                            title="Modifica"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(location.id)}
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
                {selectedLocation ? 'Modifica Location' : 'Nuova Location'}
              </h5>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div className="row">
                  <div className="col-12">
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
                  </div>

                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Indirizzo *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Città *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">CAP</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Telefono</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Capacità</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Stanze</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={formData.rooms}
                        onChange={(e) => setFormData({ ...formData, rooms: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Bagni</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Servizi</label>
                      <div className="d-flex gap-3">
                        <label>
                          <input
                            type="checkbox"
                            checked={formData.hasWifi}
                            onChange={(e) => setFormData({ ...formData, hasWifi: e.target.checked })}
                          /> WiFi
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={formData.hasParking}
                            onChange={(e) => setFormData({ ...formData, hasParking: e.target.checked })}
                          /> Parcheggio
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={formData.hasAC}
                            onChange={(e) => setFormData({ ...formData, hasAC: e.target.checked })}
                          /> Aria Condizionata
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedLocation ? 'Aggiorna' : 'Crea'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Modal QR Code */}
      {showQRModal && selectedLocation && (
        <>
          <div className="modal-backdrop" onClick={() => setShowQRModal(false)}></div>
          <div className="modal">
            <div className="modal-header">
              <h5 className="modal-title">QR Code - {selectedLocation.name}</h5>
            </div>
            <div className="modal-body text-center">
              <QRCodeSVG
                value={selectedLocation.qrCode}
                size={256}
                level="H"
                includeMargin={true}
              />
              <p className="mt-3 text-muted">
                <small>Codice: {selectedLocation.qrCode}</small>
              </p>
              <p className="text-muted">
                Stampa questo QR code e posizionalo nella location per il check-in del personale.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowQRModal(false)}
              >
                Chiudi
              </button>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  )
}
