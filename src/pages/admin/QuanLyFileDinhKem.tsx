import React, { useState, useMemo } from "react";

interface FileDinhKem {
  id_file: number;
  id_ho_so_benh_an: number;
  ten_file: string;
  duong_dan: string;
  loai_file: string;
  kich_thuoc: number;
  ngay_tai_len: string;
}

const QuanLyFileDinhKem: React.FC = () => {
  const [files, setFiles] = useState<FileDinhKem[]>([
    {
      id_file: 1,
      id_ho_so_benh_an: 1,
      ten_file: "xray_001.jpg",
      duong_dan: "/uploads/xray_001.jpg",
      loai_file: "image/jpeg",
      kich_thuoc: 2048000,
      ngay_tai_len: "2024-01-15",
    },
    {
      id_file: 2,
      id_ho_so_benh_an: 2,
      ten_file: "report.pdf",
      duong_dan: "/uploads/report.pdf",
      loai_file: "application/pdf",
      kich_thuoc: 1024000,
      ngay_tai_len: "2024-01-16",
    },
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<FileDinhKem>>({});

  const handleEdit = (file: FileDinhKem) => {
    setEditingId(file.id_file);
    setFormData(file);
  };

  const handleSave = () => {
    if (editingId) {
      setFiles(prev =>
        prev.map(f =>
          f.id_file === editingId ? { ...f, ...formData } : f
        )
      );
      setEditingId(null);
      setFormData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleAdd = () => {
    const newId = Math.max(...files.map(f => f.id_file)) + 1;
    const newFile: FileDinhKem = {
      id_file: newId,
      id_ho_so_benh_an: formData.id_ho_so_benh_an || 0,
      ten_file: formData.ten_file || "",
      duong_dan: formData.duong_dan || "",
      loai_file: formData.loai_file || "",
      kich_thuoc: formData.kich_thuoc || 0,
      ngay_tai_len: formData.ngay_tai_len || new Date().toISOString().split('T')[0],
    };
    setFiles(prev => [...prev, newFile]);
    setFormData({});
  };

  const handleDelete = (id: number) => {
    setFiles(prev => prev.filter(f => f.id_file !== id));
  };

  const totalSize = useMemo(() =>
    files.reduce((sum, f) => sum + f.kich_thuoc, 0),
    [files]
  );

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý File Đính Kèm</h1>
        <button
          onClick={() => setFormData({
            id_ho_so_benh_an: 0,
            ten_file: "",
            duong_dan: "",
            loai_file: "",
            kich_thuoc: 0,
            ngay_tai_len: new Date().toISOString().split('T')[0]
          })}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Thêm File
        </button>
      </div>

      {formData.ten_file !== undefined && (
        <div className="bg-gray-50 p-4 rounded mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Chỉnh Sửa File" : "Thêm File Mới"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="ID Hồ sơ bệnh án"
              value={formData.id_ho_so_benh_an || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, id_ho_so_benh_an: Number(e.target.value) }))}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Tên file"
              value={formData.ten_file || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, ten_file: e.target.value }))}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Đường dẫn"
              value={formData.duong_dan || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, duong_dan: e.target.value }))}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Loại file"
              value={formData.loai_file || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, loai_file: e.target.value }))}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Kích thước (bytes)"
              value={formData.kich_thuoc || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, kich_thuoc: Number(e.target.value) }))}
              className="border p-2 rounded"
            />
            <input
              type="date"
              placeholder="Ngày tải lên"
              value={formData.ngay_tai_len || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, ngay_tai_len: e.target.value }))}
              className="border p-2 rounded"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={editingId ? handleSave : handleAdd}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              {editingId ? "Lưu" : "Thêm"}
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID File
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID Hồ Sơ Bệnh Án
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên File
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại File
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kích Thước
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày Tải Lên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.id_file}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {file.id_file}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {file.id_ho_so_benh_an}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <a href={file.duong_dan} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    {file.ten_file}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {file.loai_file}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatSize(file.kich_thuoc)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {file.ngay_tai_len}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(file)}
                    className="text-indigo-600 hover:text-indigo-900 mr-2"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(file.id_file)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <p className="text-sm text-blue-800">
          Tổng số file: {files.length} | Tổng kích thước: {formatSize(totalSize)}
        </p>
      </div>
    </div>
  );
};

export default React.memo(QuanLyFileDinhKem);
