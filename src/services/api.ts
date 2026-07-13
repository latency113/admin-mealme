import axios from 'axios';
import type { UserCountStats, UserProfile, FoodLog } from '../types/admin';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

export const adminApi = {
  login: async (idToken: string): Promise<{ token: string; admin: any }> => {
    try {
      const response = await api.post('/api/admin/login', { idToken });
      return response.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'ล็อกอินล้มเหลว: ไม่มีสิทธิ์เข้าถึง';
      throw new Error(errMsg);
    }
  },

  getStats: async (token: string): Promise<UserCountStats> => {
    try {
      const response = await api.get('/api/admin/dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error(err.response?.data?.error || 'ไม่สามารถดึงสถิติแดชบอร์ดได้');
    }
  },

  getUsers: async (token: string): Promise<UserProfile[]> => {
    try {
      const response = await api.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error(err.response?.data?.error || 'ไม่สามารถดึงรายชื่อผู้ใช้ได้');
    }
  },

  getUserLogs: async (lineUserId: string): Promise<FoodLog[]> => {
    try {
      const response = await api.get(`/api/history/${lineUserId}`);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'ไม่สามารถดึงประวัติอาหารได้');
    }
  },

  exportExcel: async (token: string): Promise<Blob> => {
    try {
      const response = await api.get('/api/admin/export-excel', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      return response.data;
    } catch (err: any) {
      throw new Error('ไม่สามารถสร้างไฟล์ Excel ได้');
    }
  },

  getWhitelist: async (token: string): Promise<any[]> => {
    try {
      const response = await api.get('/api/admin/whitelist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'ไม่สามารถดึงรายชื่อ Whitelist ได้');
    }
  },

  addToWhitelist: async (token: string, lineUserId: string, displayName?: string): Promise<any> => {
    try {
      const response = await api.post('/api/admin/whitelist', { lineUserId, displayName }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'ไม่สามารถเพิ่มผู้ใช้งานลงใน Whitelist ได้');
    }
  },

  removeFromWhitelist: async (token: string, lineUserId: string): Promise<any> => {
    try {
      const response = await api.delete(`/api/admin/whitelist/${lineUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'ไม่สามารถลบผู้ใช้งานออกจาก Whitelist ได้');
    }
  },
};
