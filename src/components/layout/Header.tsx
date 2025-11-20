'use client'

import { signOut, useSession } from 'next-auth/react'
import { FaSignOutAlt, FaBell, FaUser, FaBars } from 'react-icons/fa'
import Link from 'next/link'

interface HeaderProps {
  onToggleSidebar?: () => void
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="main-header">
      <div className="d-flex align-items-center">
        <button
          className="mobile-toggle"
          onClick={onToggleSidebar}
        >
          <FaBars size={20} />
        </button>
      </div>

      <nav>
        <ul className="navbar-nav">
          <li className="nav-item">
            <Link href="/notifications" className="nav-link">
              <FaBell />
            </Link>
          </li>

          <li className="nav-item">
            <Link href="/profile" className="nav-link">
              <FaUser />
            </Link>
          </li>

          <li className="nav-item">
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              title="Esci"
            >
              <FaSignOutAlt />
            </button>
          </li>
        </ul>
      </nav>
    </header>
  )
}
