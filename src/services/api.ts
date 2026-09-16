import axios from 'axios';
import type { UserCountStats, UserProfile, FoodLog, FoodLogsResponse } from '../types/admin';

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

  // ==========================================
  // Food Logs & Submitted Images CRUD
  // ==========================================
  getFoodLogs: async (
    token: string,
    params?: {
      userId?: string;
      sourceType?: string;
      hasImage?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<FoodLogsResponse> => {
    try {
      const response = await api.get('/api/admin/food-logs', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...params,
          hasImage: params?.hasImage !== undefined ? String(params.hasImage) : undefined,
        },
      });
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error(err.response?.data?.error || 'ไม่สามารถดึงรายการรูปภาพอาหารได้');
    }
  },

  getFoodLogById: async (token: string, id: string): Promise<FoodLog> => {
    try {
      const response = await api.get(`/api/admin/food-logs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'ไม่พบข้อมูลรายการอาหาร');
    }
  },

  createFoodLog: async (
    token: string,
    data: {
      userId: string;
      foodName: string;
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
      imageUrl?: string | null;
      sourceType?: string;
      loggedAt?: string;
    }
  ): Promise<FoodLog> => {
    try {
      const response = await api.post('/api/admin/food-logs', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'ไม่สามารถเพิ่มรายการรูปภาพอาหารได้');
    }
  },

  updateFoodLog: async (
    token: string,
    id: string,
    data: Partial<{
      userId: string;
      foodName: string;
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
      imageUrl?: string | null;
      loggedAt?: string;
    }>
  ): Promise<FoodLog> => {
    try {
      const response = await api.put(`/api/admin/food-logs/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'ไม่สามารถแก้ไขข้อมูลรูปภาพอาหารได้');
    }
  },

  deleteFoodLog: async (token: string, id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/api/admin/food-logs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'ไม่สามารถลบรายการอาหารได้');
    }
  },

  analyzeImage: async (
    token: string,
    imageBase64: string
  ): Promise<{
    foodName: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  }> => {
    try {
      const response = await api.post(
        '/api/admin/analyze-image',
        { image: imageBase64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'การวิเคราะห์รูปภาพด้วย AI ล้มเหลว');
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
