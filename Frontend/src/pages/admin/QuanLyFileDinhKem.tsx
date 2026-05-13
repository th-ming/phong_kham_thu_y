import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { Modal } from "@components/CommonUI";
import { toast } from "@components/Toast";

interface FileDinhKem {
  id: number;
  ten_file: string;
  duong_dan: string;
  loai: string;
  kich_thuoc: number;
  ngay_upload: string;
}

const QuanLyFileDinhKem: React.FC = () => {
  const [files, setFiles] = useState<FileDinhKem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadHoSoId, setUploadHoSoId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const API_BASE_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:8081";

  const fetchFiles = () => {
    setLoading(true);
    axiosInstance.get("/api/file-dinh-kem")
      .then(res => {
        setFiles(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải danh sách file:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleOpenUploadModal = () => {
    setSelectedFile(null);
    setUploadHoSoId("");
    setShowUploadModal(true);
  };

  const executeUpload = async () => {
    if (!selectedFile || !uploadHoSoId.trim()) {
      toast.error("Vui lòng chọn tệp và nhập Mã Hồ Sơ Bệnh Án!");
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("id_ho_so_benh_an", uploadHoSoId);

    try {
      await axiosInstance.post("/api/file-dinh-kem/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Tải tệp lên thành công!");
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadHoSoId("");
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error("Tải tệp lên thất bại. Vui lòng thử lại!");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tệp tin này?")) {
      try {
        await axiosInstance.delete(`/api/file-dinh-kem/${id}`);
        fetchFiles();
      } catch (err) {
        toast.error("Xóa tệp tin thất bại. Vui lòng thử lại!");
      }
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };



  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Kho tệp tin y tế</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Lưu trữ phim X-quang, kết quả xét nghiệm và các hồ sơ số hóa.</p>
        </div>
        <button className="btn btn-primary btn-pill" onClick={handleOpenUploadModal}>
          <span className="material-symbols-outlined">upload_file</span>
          Tải tệp lên
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {files.map(file => (
          <div key={file.id} className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', background: 'var(--primary-light)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                {file.loai?.toLowerCase().includes('hình ảnh') ? 'image' : 'description'}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.ten_file}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 700, margin: '4px 0' }}>{formatSize(file.kich_thuoc)} · {file.ngay_upload?.split('T')[0]}</p>
            </div>
            <a href={`${API_BASE_URL}${file.duong_dan}`} target="_blank" rel="noreferrer" className="btn" style={{ padding: '8px', background: 'var(--gray-50)', color: 'var(--ink)' }}>
              <span className="material-symbols-outlined">download</span>
            </a>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>TÊN TỆP TIN</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>LOẠI TỆP</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'right' }}>KÍCH THƯỚC</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id} style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.2s' }}>
                <td style={{ padding: '20px', fontWeight: 800, color: 'var(--ink)' }}>{file.ten_file}</td>
                <td style={{ padding: '20px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--gray-100)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink)' }}>
                    {file.loai}
                  </span>
                </td>
                <td style={{ padding: '20px', textAlign: 'right', fontWeight: 700 }}>{formatSize(file.kich_thuoc)}</td>
                <td style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <a href={`${API_BASE_URL}${file.duong_dan}`} target="_blank" rel="noreferrer" className="btn" style={{ padding: '8px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      <span className="material-symbols-outlined">visibility</span>
                    </a>
                    <button className="btn" style={{ padding: '8px', background: 'var(--danger-light, rgba(239, 68, 68, 0.15))', color: 'var(--danger)' }} onClick={() => handleDelete(file.id)}>
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL NHẬP MÃ HỒ SƠ KHI UPLOAD */}
      <Modal isOpen={showUploadModal} onClose={() => { setShowUploadModal(false); setSelectedFile(null); }} title="Tải tệp đính kèm mới" maxWidth="450px">
        <div style={{ display: 'grid', gap: '24px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>TỆP ĐÍNH KÈM</label>

            {!selectedFile ? (
              <div style={{ position: 'relative' }}>
                <input type="file" id="file-upload" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} style={{ display: 'none' }} />
                <label htmlFor="file-upload" style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
                  padding: '40px 20px', border: '2px dashed var(--gray-300)', borderRadius: '16px', background: 'var(--gray-50)',
                  cursor: 'pointer', transition: 'all 0.3s ease', color: 'var(--gray-500)'
                }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--gray-300)'; e.currentTarget.style.background = 'var(--gray-50)'; e.currentTarget.style.color = 'var(--gray-500)'; }}>
                  <div style={{ width: '64px', height: '64px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>cloud_upload</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 800, fontSize: '1.05rem', color: 'inherit' }}>Nhấn để chọn tệp tải lên</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, opacity: 0.8 }}>Hỗ trợ ảnh, PDF (Tối đa 20MB)</p>
                  </div>
                </label>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'var(--primary-light)', borderRadius: '16px', border: '1px solid rgba(15, 157, 138, 0.2)' }}>
                <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                    {selectedFile.type.includes('image') ? 'image' : selectedFile.type.includes('video') ? 'movie' : 'description'}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 800, color: 'var(--ink)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedFile.name}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button type="button" onClick={() => setSelectedFile(null)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>MÃ HỒ SƠ BỆNH ÁN (CẦN GẮN TỆP)</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }}>clinical_notes</span>
              <input type="number" className="form-input" placeholder="Ví dụ: 123" value={uploadHoSoId} onChange={e => setUploadHoSoId(e.target.value)} style={{ width: '100%', background: 'var(--gray-50)', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '1px solid var(--gray-200)', outline: 'none', color: 'var(--ink)', fontWeight: 700, fontSize: '1rem' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button className="btn btn-pill" onClick={() => { setShowUploadModal(false); setSelectedFile(null); setUploadHoSoId(""); }} style={{ background: 'var(--gray-100)', color: 'var(--ink)' }}>Hủy bỏ</button>
            <button className="btn btn-primary btn-pill" onClick={executeUpload} disabled={!selectedFile || !uploadHoSoId.trim()}>
              <span className="material-symbols-outlined">backup</span>
              Tải lên hệ thống
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default React.memo(QuanLyFileDinhKem);
