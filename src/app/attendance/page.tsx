'use client'

import { useState, useEffect, useRef } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import toast from 'react-hot-toast'
import { FaQrcode, FaMapMarkerAlt, FaClock, FaHistory } from 'react-icons/fa'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface Attendance {
  id: string
  checkInAt: string
  checkOutAt: string | null
  location: {
    name: string
    address: string
  }
  user: {
    name: string
  }
  activity: {
    title: string
    type: string
  } | null
}

export default function AttendancePage() {
  const [isScanning, setIsScanning] = useState(false)
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastAction, setLastAction] = useState<{action: string, message: string, location: string} | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    fetchAttendances()
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    }
  }, [])

  const fetchAttendances = async () => {
    try {
      const res = await fetch('/api/attendance')
      const data = await res.json()
      setAttendances(data)
    } catch (error) {
      toast.error('Errore nel caricamento')
    } finally {
      setIsLoading(false)
    }
  }

  const startScanner = () => {
    setIsScanning(true)

    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      )

      scanner.render(onScanSuccess, onScanFailure)
      scannerRef.current = scanner
    }, 100)
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  const onScanSuccess = async (qrCode: string) => {
    // Ferma lo scanner dopo la scansione
    stopScanner()

    try {
      // Ottieni la posizione GPS (opzionale)
      let latitude: number | undefined
      let longitude: number | undefined

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000
            })
          })
          latitude = position.coords.latitude
          longitude = position.coords.longitude
        } catch (geoError) {
          console.log('GPS non disponibile')
        }
      }

      // Invia il check-in/check-out
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode,
          latitude,
          longitude
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message)
        setLastAction({
          action: data.action,
          message: data.message,
          location: data.location.name
        })
        fetchAttendances()
      } else {
        toast.error(data.error || 'Errore nella registrazione')
      }
    } catch (error) {
      toast.error('Errore di rete')
    }
  }

  const onScanFailure = (error: string) => {
    // Ignora errori di scansione continua
    console.log('Scan error:', error)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return 'In corso'

    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60) // minuti

    if (diff < 60) return `${diff} min`
    const hours = Math.floor(diff / 60)
    const mins = diff % 60
    return `${hours}h ${mins}m`
  }

  return (
    <MainLayout
      title="Check-in QR"
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Check-in QR' }
      ]}
    >
      <div className="row">
        {/* Scanner QR */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <FaQrcode className="mr-2" />
                Scanner QR Code
              </h3>
            </div>
            <div className="card-body text-center">
              {!isScanning ? (
                <div>
                  <p className="text-muted mb-3">
                    Scansiona il QR code della location per registrare la tua presenza.
                  </p>
                  <button className="btn btn-primary btn-lg" onClick={startScanner}>
                    <FaQrcode className="mr-2" />
                    Avvia Scanner
                  </button>
                </div>
              ) : (
                <div>
                  <div id="qr-reader" className="qr-scanner-container"></div>
                  <button className="btn btn-secondary mt-3" onClick={stopScanner}>
                    Chiudi Scanner
                  </button>
                </div>
              )}

              {lastAction && (
                <div className={`alert alert-${lastAction.action === 'checkin' ? 'success' : 'info'} mt-3`}>
                  <strong>
                    {lastAction.action === 'checkin' ? 'Check-in' : 'Check-out'}
                  </strong>
                  <br />
                  {lastAction.message}
                </div>
              )}
            </div>
          </div>

          {/* Istruzioni */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Come funziona</h3>
            </div>
            <div className="card-body">
              <ol>
                <li className="mb-2">
                  <strong>Trova il QR code</strong> posizionato nella location
                </li>
                <li className="mb-2">
                  <strong>Avvia lo scanner</strong> cliccando il pulsante
                </li>
                <li className="mb-2">
                  <strong>Inquadra il codice</strong> con la fotocamera
                </li>
                <li className="mb-2">
                  <strong>Conferma automatica</strong> - Il sistema registra check-in o check-out
                </li>
              </ol>
              <p className="text-muted">
                <small>
                  <FaMapMarkerAlt className="mr-1" />
                  La posizione GPS viene registrata automaticamente se disponibile.
                </small>
              </p>
            </div>
          </div>
        </div>

        {/* Storico presenze */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <FaHistory className="mr-2" />
                Ultime Presenze
              </h3>
            </div>
            <div className="card-body p-0">
              {isLoading ? (
                <div className="text-center p-4">
                  <div className="spinner"></div>
                </div>
              ) : attendances.length === 0 ? (
                <div className="text-center text-muted p-4">
                  Nessuna presenza registrata
                </div>
              ) : (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {attendances.map((attendance) => (
                    <div
                      key={attendance.id}
                      className="p-3"
                      style={{ borderBottom: '1px solid #dee2e6' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{attendance.location.name}</strong>
                          <br />
                          <small className="text-muted">
                            <FaClock className="mr-1" />
                            {formatDate(attendance.checkInAt)}
                          </small>
                        </div>
                        <div className="text-right">
                          <span className={`badge badge-${attendance.checkOutAt ? 'success' : 'warning'}`}>
                            {calculateDuration(attendance.checkInAt, attendance.checkOutAt)}
                          </span>
                        </div>
                      </div>
                      {attendance.activity && (
                        <div className="mt-2">
                          <small className="text-muted">
                            Attività: {attendance.activity.title}
                          </small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
