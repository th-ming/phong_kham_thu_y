import React, { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '@components/Header'
import Footer from '@components/Footer'

/**
 * Layout công khai cho trang chủ, đăng nhập, ...
 * Includes: Topbar, Navigation, Emergency Banner, Footer
 */
const PublicLayout: React.FC = () => {
  const layoutContent = useMemo(() => (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <React.Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="dot-pulse"></div>
          </div>
        }>
          <Outlet />
        </React.Suspense>
      </main>
      <Footer />
    </>
  ), [])

  return <>{layoutContent}</>
}

export default React.memo(PublicLayout)
