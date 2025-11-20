'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  FaTachometerAlt,
  FaBuilding,
  FaTasks,
  FaWrench,
  FaTshirt,
  FaExclamationTriangle,
  FaQrcode,
  FaFileAlt,
  FaUsers,
  FaStream,
  FaBoxes
} from 'react-icons/fa'
import { ROLE_LABELS } from '@/types'

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  const userRole = session?.user?.role as keyof typeof ROLE_LABELS
  const isAdmin = userRole === 'ADMIN'
  const isOperator = userRole === 'OPERATOR'
  const canManage = isAdmin || isOperator

  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="sidebar-brand">
        <b>B&B</b>&nbsp;Management
      </Link>

      {session?.user && (
        <div className="user-panel">
          <div className="info">
            <div className="user-name">{session.user.name}</div>
            <div className="user-role">{ROLE_LABELS[userRole] || userRole}</div>
          </div>
        </div>
      )}

      <nav>
        <ul className="sidebar-nav">
          <li className="nav-item">
            <Link
              href="/dashboard"
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              <FaTachometerAlt className="nav-icon" />
              <span>Dashboard</span>
            </Link>
          </li>

          <li className="nav-header">Gestione</li>

          {canManage && (
            <li className="nav-item">
              <Link
                href="/locations"
                className={`nav-link ${isActive('/locations') ? 'active' : ''}`}
              >
                <FaBuilding className="nav-icon" />
                <span>Location</span>
              </Link>
            </li>
          )}

          <li className="nav-item">
            <Link
              href="/activities"
              className={`nav-link ${isActive('/activities') ? 'active' : ''}`}
            >
              <FaTasks className="nav-icon" />
              <span>Attività</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link
              href="/activities?type=MAINTENANCE"
              className={`nav-link ${pathname?.includes('type=MAINTENANCE') ? 'active' : ''}`}
            >
              <FaWrench className="nav-icon" />
              <span>Manutenzione</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link
              href="/activities?type=LAUNDRY"
              className={`nav-link ${pathname?.includes('type=LAUNDRY') ? 'active' : ''}`}
            >
              <FaTshirt className="nav-icon" />
              <span>Biancheria</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link
              href="/activities?type=EMERGENCY"
              className={`nav-link ${pathname?.includes('type=EMERGENCY') ? 'active' : ''}`}
            >
              <FaExclamationTriangle className="nav-icon" />
              <span>Emergenze</span>
            </Link>
          </li>

          {canManage && (
            <li className="nav-item">
              <Link
                href="/inventory"
                className={`nav-link ${isActive('/inventory') ? 'active' : ''}`}
              >
                <FaBoxes className="nav-icon" />
                <span>Inventario</span>
              </Link>
            </li>
          )}

          <li className="nav-header">Strumenti</li>

          <li className="nav-item">
            <Link
              href="/attendance"
              className={`nav-link ${isActive('/attendance') ? 'active' : ''}`}
            >
              <FaQrcode className="nav-icon" />
              <span>Check-in QR</span>
            </Link>
          </li>

          {canManage && (
            <>
              <li className="nav-item">
                <Link
                  href="/templates"
                  className={`nav-link ${isActive('/templates') ? 'active' : ''}`}
                >
                  <FaStream className="nav-icon" />
                  <span>Flow Attività</span>
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  href="/reports"
                  className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
                >
                  <FaFileAlt className="nav-icon" />
                  <span>Report</span>
                </Link>
              </li>
            </>
          )}

          {isAdmin && (
            <>
              <li className="nav-header">Amministrazione</li>

              <li className="nav-item">
                <Link
                  href="/users"
                  className={`nav-link ${isActive('/users') ? 'active' : ''}`}
                >
                  <FaUsers className="nav-icon" />
                  <span>Utenti</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  )
}
