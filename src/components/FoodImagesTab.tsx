import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import type { FoodLog, UserProfile } from '../types/admin';
import { adminApi } from '../services/api';
import { ImageLightboxModal } from './ImageLightboxModal';
import { FoodLogEditModal } from './FoodLogEditModal';

interface FoodImagesTabProps {
  token: string;
  users: UserProfile[];
}

export const FoodImagesTab: React.FC<FoodImagesTabProps> = ({ token, users }) => {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'cal_desc' | 'cal_asc'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Modals state
  const [lightboxLog, setLightboxLog] = useState<FoodLog | null>(null);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Fetch food logs from backend
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getFoodLogs(token, {
        hasImage: true,
        userId: selectedUserFilter !== 'all' ? selectedUserFilter : undefined,
        search: searchTerm.trim() || undefined,
      });

      setLogs(response.logs || []);
    } catch (err: any) {
      console.error('Failed to fetch food logs:', err);
      Swal.fire('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถดึงข้อมูลรูปภาพอาหารได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token, selectedUserFilter]);

  // Handle Search Debounce or Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  // Filter & Sort locally for instant responsive experience
  const filteredAndSortedLogs = useMemo(() => {
    let result = [...logs];

    // Local search filter for instant responsiveness
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (log) =>
          log.foodName.toLowerCase().includes(term) ||
          log.user?.displayName?.toLowerCase().includes(term) ||
          log.user?.lineUserId?.toLowerCase().includes(term)
      );
    }

    // Date filter
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 6 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 29 * 24 * 60 * 60 * 1000;

    if (dateFilter === 'today') {
      result = result.filter((log) => new Date(log.loggedAt).getTime() >= todayStart);
    } else if (dateFilter === '7days') {
      result = result.filter((log) => new Date(log.loggedAt).getTime() >= sevenDaysAgo);
    } else if (dateFilter === '30days') {
      result = result.filter((log) => new Date(log.loggedAt).getTime() >= thirtyDaysAgo);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime();
      if (sortBy === 'oldest') return new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime();
      if (sortBy === 'cal_desc') return b.calories - a.calories;
      if (sortBy === 'cal_asc') return a.calories - b.calories;
      return 0;
    });

    return result;
  }, [logs, searchTerm, dateFilter, sortBy]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedLogs.slice(start, start + itemsPerPage);
  }, [filteredAndSortedLogs, currentPage, itemsPerPage]);

  // Calculate Summary KPIs
  const statsSummary = useMemo(() => {
    const totalImages = logs.length;
    const totalCalories = logs.reduce((sum, l) => sum + (l.calories || 0), 0);
    const uniqueUsers = new Set(logs.map((l) => l.userId || l.user?.id)).size;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayImages = logs.filter((l) => new Date(l.loggedAt).getTime() >= todayStart).length;

    return {
      totalImages,
      totalCalories: Math.round(totalCalories),
      uniqueUsers,
      todayImages,
    };
  }, [logs]);

  // Delete Action
  const handleDeleteLog = async (log: FoodLog) => {
    const confirm = await Swal.fire({
      title: 'ยืนยันการลบรายการอาหารนี้?',
      html: `คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพและบันทึกของ <b>"${log.foodName}"</b>?<br/><span class="text-xs text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก',
    });

    if (!confirm.isConfirmed) return;

    try {
      await adminApi.deleteFoodLog(token, log.id);
      Swal.fire({
        title: 'ลบสำเร็จ!',
        text: 'รายการรูปภาพอาหารถูกลบออกจากระบบเรียบร้อยแล้ว',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      fetchLogs();
    } catch (err: any) {
      console.error(err);
      Swal.fire('ผิดพลาด', err.message || 'ไม่สามารถลบรายการได้', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* 1. Header & Overview Title */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <span>📸</span> จัดการรูปภาพอาหารที่ส่งมา
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            คลังรูปภาพอาหารที่ผู้ใช้ส่งผ่าน LINE ทั้งหมด พร้อมระบบตรวจสอบ แก้ไข และลบข้อมูลแบบเรียลไทม์
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มรูปภาพอาหารใหม่
        </button>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Images */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center text-xl flex-shrink-0">
            🖼️
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              รูปภาพทั้งหมด
            </span>
            <span className="text-xl font-black text-gray-800 block leading-tight mt-0.5">
              {statsSummary.totalImages.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Unique Users */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center text-xl flex-shrink-0">
            👥
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              ผู้ใช้ที่ส่งรูป
            </span>
            <span className="text-xl font-black text-gray-800 block leading-tight mt-0.5">
              {statsSummary.uniqueUsers.toLocaleString()} คน
            </span>
          </div>
        </div>

        {/* Total Calories Logged */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl flex-shrink-0">
            ⚡
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              พลังงานรวมตรวจพบ
            </span>
            <span className="text-xl font-black text-gray-800 block leading-tight mt-0.5">
              {statsSummary.totalCalories.toLocaleString()}{' '}
              <span className="text-xs font-normal text-gray-400">kcal</span>
            </span>
          </div>
        </div>

        {/* Today's Uploads */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-green-50 text-green-500 flex items-center justify-center text-xl flex-shrink-0">
            📅
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              รูปภาพวันนี้
            </span>
            <span className="text-xl font-black text-green-600 block leading-tight mt-0.5">
              +{statsSummary.todayImages.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter & Control Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <input
              type="text"
              placeholder="ค้นหาชื่อเมนู, ชื่อผู้ใช้, หรือ LINE ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>

          {/* User Selector Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedUserFilter}
              onChange={(e) => {
                setSelectedUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-pink-500"
            >
              <option value="all">👥 ผู้ใช้ทั้งหมด ({users.length} คน)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName || 'ไม่มีโปรไฟล์'} ({u.lineUserId.substring(0, 8)}...)
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="w-full md:w-44">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-pink-500"
            >
              <option value="newest">🕒 ล่าสุด - เก่าสุด</option>
              <option value="oldest">🕒 เก่าสุด - ล่าสุด</option>
              <option value="cal_desc">🔥 แคลอรี: มาก ➔ น้อย</option>
              <option value="cal_asc">🥗 แคลอรี: น้อย ➔ มาก</option>
            </select>
          </div>

          {/* View Switcher Button (Grid vs Table) */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-pink-600 shadow-sm font-bold'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              title="มุมมองแกลเลอรีรูปภาพ"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-pink-600 shadow-sm font-bold'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              title="มุมมองตารางรายการ"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-[11px]">
          <span className="text-gray-400 font-semibold mr-1">ช่วงเวลา:</span>
          {(
            [
              { key: 'all', label: 'ทั้งหมด' },
              { key: 'today', label: 'วันนี้' },
              { key: '7days', label: '7 วันที่ผ่านมา' },
              { key: '30days', label: '30 วันที่ผ่านมา' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setDateFilter(t.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                dateFilter === t.key
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400 font-medium">
            พบ {filteredAndSortedLogs.length} รายการ
          </span>
        </div>
      </div>

      {/* 4. Content Area: Grid or Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-bold">กำลังโหลดคลังรูปภาพอาหาร...</p>
        </div>
      ) : filteredAndSortedLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center text-3xl mx-auto">
            🥗
          </div>
          <h3 className="text-base font-bold text-gray-700">ไม่พบรายการรูปภาพอาหาร</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            ไม่พบรูปภาพอาหารตามเงื่อนไขการค้นหาหรือตัวกรองที่ระบุ ลองเปลี่ยนคำค้นหา หรือกดปุ่ม &quot;เพิ่มรูปภาพอาหารใหม่&quot;
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 py-2 px-4 rounded-lg transition cursor-pointer"
          >
            + บันทึกรูปภาพแรก
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= GRID VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group"
            >
              {/* Image Section with Hover Overlay */}
              <div
                onClick={() => setLightboxLog(log)}
                className="relative aspect-4/3 bg-gray-900 cursor-pointer overflow-hidden flex items-center justify-center"
              >
                {log.imageUrl ? (
                  <img
                    src={log.imageUrl}
                    alt={log.foodName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-gray-500 text-xs flex flex-col items-center gap-1">
                    <span className="text-3xl">🍽️</span>
                    <span>ไม่มีรูป</span>
                  </div>
                )}

                {/* Hover overlay button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white/90 backdrop-blur-xs text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
                    <span>🔍</span> คลิกเพื่อดูรูปเต็ม
                  </span>
                </div>

                {/* Top Left Badge: Source */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                    {log.sourceType === 'IMAGE' ? '📷 รูปภาพ' : '💬 ข้อความ'}
                  </span>
                </div>

                {/* Top Right: Calories pill */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="bg-pink-500/90 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                    {Math.round(log.calories)} kcal
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <h3
                      onClick={() => setLightboxLog(log)}
                      className="font-bold text-sm text-gray-800 hover:text-pink-600 transition truncate cursor-pointer"
                      title={log.foodName}
                    >
                      {log.foodName}
                    </h3>
                  </div>

                  {/* User Badge */}
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <span className="w-5 h-5 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                      {log.user?.displayName?.charAt(0) || 'U'}
                    </span>
                    <span className="font-semibold text-gray-700 truncate">
                      {log.user?.displayName || 'ผู้ใช้ไม่ระบุชื่อ'}
                    </span>
                  </div>
                </div>

                {/* Macronutrients pills */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1 border-t border-gray-50">
                  <div className="bg-red-50/60 p-1.5 rounded border border-red-100/50">
                    <span className="text-[9px] text-red-500 font-bold block">โปรตีน</span>
                    <span className="font-bold text-red-700">{log.protein}g</span>
                  </div>
                  <div className="bg-yellow-50/60 p-1.5 rounded border border-yellow-100/50">
                    <span className="text-[9px] text-yellow-600 font-bold block">ไขมัน</span>
                    <span className="font-bold text-yellow-700">{log.fat}g</span>
                  </div>
                  <div className="bg-green-50/60 p-1.5 rounded border border-green-100/50">
                    <span className="text-[9px] text-green-600 font-bold block">คาร์บ</span>
                    <span className="font-bold text-green-700">{log.carbs}g</span>
                  </div>
                </div>

                {/* Footer: Date and Action Buttons */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    {new Date(log.loggedAt).toLocaleDateString('th-TH', {
                      day: '2-digit',
                      month: 'short',
                    })}{' '}
                    {new Date(log.loggedAt).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* View */}
                    <button
                      onClick={() => setLightboxLog(log)}
                      title="ดูรูปขนาดเต็ม"
                      className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-pink-50 text-gray-400 hover:text-pink-600 flex items-center justify-center transition cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => setEditingLog(log)}
                      title="แก้ไขข้อมูล"
                      className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 flex items-center justify-center transition cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteLog(log)}
                      title="ลบรายการ"
                      className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center transition cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ================= TABLE VIEW ================= */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3.5 px-4 text-center">รูปภาพ</th>
                  <th className="py-3.5 px-4">ชื่อเมนูอาหาร</th>
                  <th className="py-3.5 px-4 text-center">พลังงาน (kcal)</th>
                  <th className="py-3.5 px-4 text-center">สารอาหาร (P/F/C)</th>
                  <th className="py-3.5 px-4">ผู้ใช้งาน</th>
                  <th className="py-3.5 px-4">วันเวลาที่บันทึก</th>
                  <th className="py-3.5 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-pink-50/20 transition-colors">
                    {/* Thumbnail */}
                    <td className="py-3 px-4 text-center">
                      <div
                        onClick={() => setLightboxLog(log)}
                        className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 mx-auto cursor-pointer hover:opacity-80 transition"
                      >
                        {log.imageUrl ? (
                          <img
                            src={log.imageUrl}
                            alt={log.foodName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            🍽️
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Food Name */}
                    <td className="py-3 px-4">
                      <p
                        onClick={() => setLightboxLog(log)}
                        className="font-bold text-gray-800 hover:text-pink-600 transition cursor-pointer"
                      >
                        {log.foodName}
                      </p>
                      <span className="text-[10px] text-gray-400 font-normal">
                        ID: {log.id.substring(0, 8)}...
                      </span>
                    </td>

                    {/* Calories */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-pink-50 text-pink-600 font-bold text-xs">
                        {Math.round(log.calories)} kcal
                      </span>
                    </td>

                    {/* Macros */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-bold">
                          P: {log.protein}g
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-600 font-bold">
                          F: {log.fat}g
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-600 font-bold">
                          C: {log.carbs}g
                        </span>
                      </div>
                    </td>

                    {/* User */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-700">
                        {log.user?.displayName || 'ไม่ระบุชื่อ'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {log.user?.lineUserId?.substring(0, 10)}...
                      </p>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-gray-500 text-[11px] whitespace-nowrap">
                      {new Date(log.loggedAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      {new Date(log.loggedAt).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setLightboxLog(log)}
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-pink-50 text-gray-400 hover:text-pink-600 transition cursor-pointer"
                          title="ดูรูปภาพขนาดเต็ม"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => setEditingLog(log)}
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition cursor-pointer"
                          title="แก้ไขข้อมูล"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log)}
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 transition cursor-pointer"
                          title="ลบรายการ"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-gray-500">
          <span>
            แสดงหน้า {currentPage} จาก {totalPages} หน้า (ทั้งหมด {filteredAndSortedLogs.length} รายการ)
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-semibold"
            >
              ย้อนกลับ
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, idx) => {
              let pageNum = idx + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 3 + idx;
                if (pageNum > totalPages) pageNum = totalPages - (4 - idx);
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-semibold"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}

      {/* 6. Modals */}
      {/* Lightbox Modal */}
      <ImageLightboxModal
        log={lightboxLog}
        onClose={() => setLightboxLog(null)}
        onEdit={(log) => setEditingLog(log)}
        onDelete={(log) => handleDeleteLog(log)}
      />

      {/* Create Modal */}
      <FoodLogEditModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchLogs}
        token={token}
        users={users}
      />

      {/* Edit Modal */}
      <FoodLogEditModal
        isOpen={!!editingLog}
        initialLog={editingLog}
        onClose={() => setEditingLog(null)}
        onSuccess={fetchLogs}
        token={token}
        users={users}
      />
    </div>
  );
};
