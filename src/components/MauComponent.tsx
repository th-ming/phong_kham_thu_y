import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface ThuCung {
  id_thu_cung: number;
  ten_thu_cung: string;
  loai: string;
  giong: string;
  trong_luong: number;
  ngay_sinh?: string;
}

interface MauComponentProps {
  tieuDe: string;
  onRecordSelect?: (pet: ThuCung) => void;
}

const MauComponent: React.FC<MauComponentProps> = ({ tieuDe, onRecordSelect }) => {
  const [dsThuCung, setDsThuCung] = useState<ThuCung[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockData: ThuCung[] = [
        { id_thu_cung: 1, ten_thu_cung: 'Mimi', loai: 'Mèo', giong: 'Anh lông ngắn', trong_luong: 4.2 },
        { id_thu_cung: 2, ten_thu_cung: 'Lu', loai: 'Chó', giong: 'Poodle', trong_luong: 3.5 },
      ];
      
      setDsThuCung(mockData);
      setLoading(false);
    };
    loadData();
  }, []);

  const dataHienThi = useMemo(() => {
    return dsThuCung.filter(p => 
      p.ten_thu_cung.toLowerCase().includes(search.toLowerCase())
    );
  }, [dsThuCung, search]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu từ hệ thống...</div>;

  return (
    <div className="card" style={{ padding: '24px', margin: '16px' }}>
      <h2 style={{ color: 'var(--teal)', marginBottom: '20px', fontSize: '24px' }}>{tieuDe}</h2>
      
      <input 
        type="text" 
        placeholder="Tìm nhanh tên thú cưng..." 
        value={search}
        onChange={handleSearchChange}
        style={{ 
          padding: '12px', width: '100%', maxWidth: '400px', 
          borderRadius: '12px', border: '1px solid var(--gray-200)', marginBottom: '24px'
        }}
      />

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--gray-100)', textAlign: 'left', color: 'var(--gray-600)' }}>
              <th style={{ padding: '12px' }}>Tên Thú Cưng</th>
              <th style={{ padding: '12px' }}>Chủng Loại</th>
              <th style={{ padding: '12px' }}>Cân Nặng</th>
              <th style={{ padding: '12px' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {dataHienThi.map(pet => (
              <tr key={pet.id_thu_cung} style={{ borderBottom: '1px solid var(--gray-50)' }}>
                <td style={{ padding: '16px 12px', fontWeight: '700' }}>{pet.ten_thu_cung}</td>
                <td style={{ padding: '12px' }}>{pet.loai} - {pet.giong}</td>
                <td style={{ padding: '12px' }}>{pet.trong_luong} kg</td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => onRecordSelect?.(pet)}
                    className="btn btn-primary"
                    style={{ padding: '6px 16px', borderRadius: '8px' }}
                  >
                    Xem bệnh án
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(MauComponent);
