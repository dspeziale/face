'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumb?: { label: string; href?: string }[]
}

export default function MainLayout({ children, title, breadcrumb }: MainLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div>
      <Sidebar />
      <Header />

      <div className="content-wrapper">
        {(title || breadcrumb) && (
          <div className="content-header">
            <div className="d-flex justify-content-between align-items-center">
              {title && <h1>{title}</h1>}
              {breadcrumb && (
                <ol className="breadcrumb">
                  {breadcrumb.map((item, index) => (
                    <li
                      key={index}
                      className={`breadcrumb-item ${index === breadcrumb.length - 1 ? 'active' : ''}`}
                    >
                      {item.href ? (
                        <a href={item.href}>{item.label}</a>
                      ) : (
                        item.label
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}

        <section className="content">
          {children}
        </section>
      </div>
    </div>
  )
}
