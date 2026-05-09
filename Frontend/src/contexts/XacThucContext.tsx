/**
 * Context để quản lý trạng thái xác thực toàn cầu
 * Chia sẻ user data và authentication status cho toàn app
 */

import React from 'react'

interface NguoiDung {
  id: string
  email: string
  hoTen: string
  vaiTro: 'khach-hang' | 'nhan-vien' | 'quan-ly'
}

interface XacThucContext {
  nguoiDung: NguoiDung | null
  dangNhap: boolean
  daDangNhap: (user: NguoiDung) => void
  dangXuat: () => void
}

export const XacThucContext = React.createContext<XacThucContext | undefined>(undefined)

export const XacThucProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nguoiDung, setNguoiDung] = React.useState<NguoiDung | null>(null)
  const [dangNhap, setDangNhap] = React.useState(false)

  const daDangNhap = React.useCallback((user: NguoiDung) => {
    setNguoiDung(user)
    setDangNhap(true)
  }, [])

  const dangXuat = React.useCallback(() => {
    setNguoiDung(null)
    setDangNhap(false)
  }, [])

  const value = React.useMemo(() => ({
    nguoiDung,
    dangNhap,
    daDangNhap,
    dangXuat
  }), [nguoiDung, dangNhap, daDangNhap, dangXuat])

  return (
    <XacThucContext.Provider value={value}>
      {children}
    </XacThucContext.Provider>
  )
}

export const useXacThuc = () => {
  const context = React.useContext(XacThucContext)
  if (!context) {
    throw new Error('useXacThuc phải được dùng trong XacThucProvider')
  }
  return context
}
