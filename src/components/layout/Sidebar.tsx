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
  FaBoxes,
  FaTimes
} from 'react-icons/fa'
import { ROLE_LABELS } from '@/types'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  const userRole = session?.user?.role as keyof typeof ROLE_LABELS
  const isAdmin = userRole === 'ADMIN'
  const isOperator = userRole === 'OPERATOR'
  const canManage = isAdmin || isOperator

  return (
    <>
      {/* Overlay per mobile */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <aside className={`sidebar ${isOpen ? 'show' : ''}`}>
        <div className="sidebar-header">
          <Link href="/dashboard" className="sidebar-brand">
            <b>B&B</b>&nbsp;Management
          </Link>
          <button className="sidebar-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

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
                onClick={onClose}
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
                  onClick={onClose}
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
                onClick={onClose}
              >
                <FaTasks className="nav-icon" />
                <span>Attività</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link
                href="/activities?type=MAINTENANCE"
                className={`nav-link ${pathname?.includes('type=MAINTENANCE') ? 'active' : ''}`}
                onClick={onClose}
              >
                <FaWrench className="nav-icon" />
                <span>Manutenzione</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link
                href="/activities?type=LAUNDRY"
                className={`nav-link ${pathname?.includes('type=LAUNDRY') ? 'active' : ''}`}
                onClick={onClose}
              >
                <FaTshirt className="nav-icon" />
                <span>Biancheria</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link
                href="/activities?type=EMERGENCY"
                className={`nav-link ${pathname?.includes('type=EMERGENCY') ? 'active' : ''}`}
                onClick={onClose}
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
                  onClick={onClose}
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
                onClick={onClose}
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
                    onClick={onClose}
                  >
                    <FaStream className="nav-icon" />
                    <span>Flow Attività</span>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/reports"
                    className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
                    onClick={onClose}
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
                    onClick={onClose}
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
    </>
  )
}
