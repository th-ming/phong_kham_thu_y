import axiosInstance from './axios';

export interface Thuoc {
  id_thuoc?: string;
  ten_thuoc: string;
  ma_thuoc: string;
  loai_thuoc: string;
  don_vi_tinh: string;
  gia_ban: number;
  cach_dung: string;
  da_xoa: boolean;
}

const thuocService = {
  getAll: async () => {
    const response = await axiosInstance.get('/api/thuoc');
    return response.data;
  },
  create: async (data: Thuoc) => {
    const response = await axiosInstance.post('/api/thuoc', data);
    return response.data;
  }
};

export default thuocService;
