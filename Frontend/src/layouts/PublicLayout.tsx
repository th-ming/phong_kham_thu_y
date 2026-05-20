import React, { useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '@components/Header'
import Footer from '@components/Footer'
import { ChatBot } from '@components/ChatBot'

/**
 * Layout công khai cho trang chủ, đăng nhập, ...
 * Includes: Topbar, Navigation, Emergency Banner, Footer
 */
const PublicLayout: React.FC = () => {
  const location = useLocation()

  const shouldShowChatBot = useMemo(() => {
    const hidePaths = ['/dang-nhap', '/dang-ky', '/error', '/404', '/forgot-password']
    return !hidePaths.some(p => location.pathname.startsWith(p))
  }, [location.pathname])

  return (
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
      {shouldShowChatBot && <ChatBot />}
    </>
  )
}

export default React.memo(PublicLayout)

