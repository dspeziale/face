import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import MainLayout from '@/components/layout/MainLayout'
import Link from 'next/link'
import {
  FaBuilding,
  FaTasks,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaWrench,
  FaTshirt
} from 'react-icons/fa'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userRole = session?.user?.role
  const userId = session?.user?.id

  // Statistiche generali
  const [
    locationsCount,
    totalActivities,
    pendingActivities,
    completedActivities,
    emergencies,
    recentActivities
  ] = await Promise.all([
    prisma.location.count({ where: { isActive: true } }),
    prisma.activity.count(),
    prisma.activity.count({ where: { status: 'PENDING' } }),
    prisma.activity.count({ where: { status: 'COMPLETED' } }),
    prisma.activity.count({ where: { type: 'EMERGENCY', status: { not: 'COMPLETED' } } }),
    prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        location: true,
        assignedTo: true,
      },
      where: userRole === 'ADMIN' || userRole === 'OPERATOR'
        ? {}
        : { assignedToId: userId }
    })
  ])

  // Attività assegnate all'utente corrente
  const myActivities = userRole !== 'ADMIN' && userRole !== 'OPERATOR'
    ? await prisma.activity.count({
        where: {
          assignedToId: userId,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      })
    : 0

  return (
    <MainLayout
      title="Dashboard"
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Dashboard' }
      ]}
    >
      {/* Info Boxes */}
      <div className="row">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="small-box bg-info">
            <div className="inner">
              <h3>{locationsCount}</h3>
              <p>Location</p>
            </div>
            <div className="icon">
              <FaBuilding />
            </div>
            <Link href="/locations" className="small-box-footer">
              Visualizza <i className="fas fa-arrow-circle-right"></i>
            </Link>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="small-box bg-warning">
            <div className="inner">
              <h3>{pendingActivities}</h3>
              <p>In Attesa</p>
            </div>
            <div className="icon">
              <FaClock />
            </div>
            <Link href="/activities?status=PENDING" className="small-box-footer">
              Visualizza <i className="fas fa-arrow-circle-right"></i>
            </Link>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="small-box bg-success">
            <div className="inner">
              <h3>{completedActivities}</h3>
              <p>Completate</p>
            </div>
            <div className="icon">
              <FaCheckCircle />
            </div>
            <Link href="/activities?status=COMPLETED" className="small-box-footer">
              Visualizza <i className="fas fa-arrow-circle-right"></i>
            </Link>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="small-box bg-danger">
            <div className="inner">
              <h3>{emergencies}</h3>
              <p>Emergenze</p>
            </div>
            <div className="icon">
              <FaExclamationTriangle />
            </div>
            <Link href="/activities?type=EMERGENCY" className="small-box-footer">
              Visualizza <i className="fas fa-arrow-circle-right"></i>
            </Link>
          </div>
        </div>
      </div>

      {/* Attività dell'utente (per non admin) */}
      {myActivities > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Le Mie Attività da Completare</h3>
          </div>
          <div className="card-body">
            <div className="alert alert-info">
              Hai <strong>{myActivities}</strong> attività assegnate da completare.
              <Link href="/activities" className="btn btn-sm btn-primary ml-3">
                Visualizza
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Attività Recenti</h3>
        </div>
        <div className="card-body p-0">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Titolo</th>
                <th>Tipo</th>
                <th>Location</th>
                <th>Assegnato a</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted p-4">
                    Nessuna attività trovata
                  </td>
                </tr>
              ) : (
                recentActivities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.title}</td>
                    <td>
                      {activity.type === 'MAINTENANCE' && <><FaWrench className="text-warning" /> Manutenzione</>}
                      {activity.type === 'LAUNDRY' && <><FaTshirt className="text-info" /> Biancheria</>}
                      {activity.type === 'EMERGENCY' && <><FaExclamationTriangle className="text-danger" /> Emergenza</>}
                      {activity.type === 'CLEANING' && <><FaTasks className="text-success" /> Pulizia</>}
                      {activity.type === 'INSPECTION' && <><FaTasks className="text-primary" /> Ispezione</>}
                      {activity.type === 'OTHER' && <><FaTasks className="text-secondary" /> Altro</>}
                    </td>
                    <td>{activity.location.name}</td>
                    <td>{activity.assignedTo?.name || '-'}</td>
                    <td>
                      <span className={`badge badge-${
                        activity.status === 'COMPLETED' ? 'success' :
                        activity.status === 'IN_PROGRESS' ? 'info' :
                        activity.status === 'CANCELLED' ? 'danger' : 'warning'
                      }`}>
                        {activity.status === 'COMPLETED' ? 'Completata' :
                         activity.status === 'IN_PROGRESS' ? 'In Corso' :
                         activity.status === 'CANCELLED' ? 'Annullata' : 'In Attesa'}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/activities/${activity.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        Dettagli
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  )
}
