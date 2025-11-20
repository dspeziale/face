'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import toast from 'react-hot-toast'
import { FaPlus, FaEdit, FaTrash, FaBoxes } from 'react-icons/fa'

interface Location {
  id: string
  name: string
}

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  minQuantity: number
  unit: string
  location: {
    id: string
    name: string
  }
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    minQuantity: 0,
    unit: 'pz',
    locationId: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [itemsRes, locationsRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/locations')
      ])

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json()
        setItems(itemsData)
      }

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json()
        setLocations(locationsData)
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
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success('Articolo aggiunto')
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

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo articolo?')) return

    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Articolo eliminato')
        fetchData()
      }
    } catch (error) {
      toast.error('Errore nell\'eliminazione')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: 0,
      minQuantity: 0,
      unit: 'pz',
      locationId: ''
    })
  }

  const categories = ['biancheria', 'prodotti pulizia', 'amenities', 'altro']

  return (
    <MainLayout
      title="Inventario"
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Inventario' }
      ]}
    >
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title">
            <FaBoxes className="mr-2" />
            Gestione Inventario
          </h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
          >
            <FaPlus className="mr-1" /> Nuovo Articolo
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
                  <th>Categoria</th>
                  <th>Location</th>
                  <th>Quantità</th>
                  <th>Min</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted p-4">
                      Nessun articolo trovato
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.category}</td>
                      <td>{item.location.name}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>{item.minQuantity} {item.unit}</td>
                      <td>
                        <span className={`badge badge-${
                          item.quantity <= item.minQuantity ? 'danger' :
                          item.quantity <= item.minQuantity * 1.5 ? 'warning' : 'success'
                        }`}>
                          {item.quantity <= item.minQuantity ? 'Esaurito' :
                           item.quantity <= item.minQuantity * 1.5 ? 'Basso' : 'OK'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(item.id)}
                          title="Elimina"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Creazione */}
      {showModal && (
        <>
          <div className="modal-backdrop" onClick={() => setShowModal(false)}></div>
          <div className="modal">
            <div className="modal-header">
              <h5 className="modal-title">Nuovo Articolo</h5>
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
                  <label className="form-label">Categoria *</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Seleziona categoria</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

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

                <div className="row">
                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Quantità</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Minimo</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={formData.minQuantity}
                        onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Unità</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
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
                  Aggiungi
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </MainLayout>
  )
}
