import React from 'react'

/**
 * Hook custom để fetch dữ liệu từ API
 * Tối ưu: useMemo và useCallback để tránh re-render
 */
export const useFetchData = (url: string) => {
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url)
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi không xác định')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url])

  return { data, loading, error }
}

/**
 * Hook custom để quản lý form
 */
export const useForm = (initialValues: Record<string, any>) => {
  const [values, setValues] = React.useState(initialValues)

  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleReset = React.useCallback(() => {
    setValues(initialValues)
  }, [initialValues])

  return { values, handleChange, handleReset, setValues }
}
