export const formatTienVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

export const formatNgayThang = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('vi-VN')
}

export const formatGio = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('vi-VN')
}

export const kiemTraEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const kiemTraSDT = (sdt: string): boolean => {
  const regex = /^(0|\+84)(\d{9,10})$/
  return regex.test(sdt)
}

export const layTenTuEmail = (email: string): string => {
  return email.split('@')[0]
}
