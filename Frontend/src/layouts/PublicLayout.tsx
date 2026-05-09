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
      <main style={{ minHeight: 'calc(100vh - 200px)' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  ), [])

  return <>{layoutContent}</>
}

export default React.memo(PublicLayout)
