import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types/admin';

interface UsersTabProps {
  users: UserProfile[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onViewLogs: (user: UserProfile) => void;
  whitelist: any[];
  onAddToWhitelist: (lineUserId: string, displayName?: string) => void;
  onRemoveFromWhitelist: (lineUserId: string) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  searchTerm,
  setSearchTerm,
  onViewLogs,
  whitelist,
  onAddToWhitelist,
  onRemoveFromWhitelist,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const calculateAge = (birthdayStr: string | null): number | string => {
    if (!birthdayStr) return '-';
    const birthDate = new Date(birthdayStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateBMI = (w: number | null, h: number | null): string => {
    if (!w || !h) return '-';
    const bmiVal = w / ((h / 100) * (h / 100));
    return bmiVal.toFixed(1);
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = u.displayName?.toLowerCase().includes(term) || false;
    const lineIdMatch = u.lineUserId.toLowerCase().includes(term);
    return nameMatch || lineIdMatch;
  });

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">รายชื่อผู้ใช้งานระบบรายบุคคล</h1>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือ LINE User ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all shadow-sm"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden animate-fade-in animate-duration-500">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-wider whitespace-nowrap">
              <th className="py-4 px-6">ลำดับ</th>
              <th className="py-4 px-6">ข้อมูลผู้ใช้</th>
              <th className="py-4 px-6">เพศ/อายุ</th>
              <th className="py-4 px-6 text-center">สัดส่วน (สส/นน)</th>
              <th className="py-4 px-6 text-center">ดัชนี BMI</th>
              <th className="py-4 px-6 text-center">เป้าหมายแคลอรี</th>
              <th className="py-4 px-6 text-center">สูตรอาหาร</th>
              <th className="py-4 px-6 text-center">บันทึก</th>
              <th className="py-4 px-6 text-center">สิทธิ์แอดมิน</th>
              <th className="py-4 px-6 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-gray-400 italic">ไม่พบรายชื่อผู้ใช้งานระบบ</td>
              </tr>
            ) : (
              paginatedUsers.map((u, index) => {
                const globalIndex = startIndex + index;
                const ageVal = calculateAge(u.birthday);
                const bmiVal = calculateBMI(u.weight, u.height);
                const isMale = u.gender === 'MALE';
                const isWhitelisted = whitelist.some((w) => w.lineUserId === u.lineUserId);

                return (
                  <tr key={u.id} className="hover:bg-pink-50/10 transition-colors whitespace-nowrap">
                    <td className="py-4 px-6">
                      <div>
                        <p className=" text-gray-800 leading-tight">{globalIndex + 1}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <p className=" text-gray-800 leading-tight">{u.displayName || 'ไม่มีโปรไฟล์'}</p>
                        {isWhitelisted && (
                          <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-bold">
                            แอดมิน
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] mr-1 ${isMale ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                        }`}>
                        {isMale ? 'ชาย' : 'หญิง'}
                      </span>
                      <span>{ageVal} ปี</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {u.height ? `${u.height} ซม.` : '-'} / {u.weight ? `${u.weight} กก.` : '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className=" text-gray-800">{bmiVal}</span>
                    </td>
                    <td className="py-4 px-6 text-center text-pink-500">
                      {u.dailyCalorieGoal.toLocaleString()} kcal
                    </td>
                    <td className="py-4 px-6 text-center">
                      {u.goal ? (
                        <span className={`px-2.5 py-0.5 rounded text-[9px] ${u.goal === 'lose' ? 'bg-orange-50 text-orange-600' :
                            u.goal === 'gain' ? 'bg-green-50 text-green-600' :
                              'bg-blue-50 text-blue-600'
                          }`}>
                          {u.goal === 'lose' ? 'ลดน้ำหนัก' : u.goal === 'gain' ? 'สร้างกล้ามเนื้อ' : 'รักษาน้ำหนัก'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-4 px-6 text-center text-gray-400">
                      {u._count.foodLogs}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {isWhitelisted ? (
                        <button
                          onClick={() => onRemoveFromWhitelist(u.lineUserId)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm border border-red-100/30 font-semibold"
                        >
                          ถอนแอดมิน
                        </button>
                      ) : (
                        <button
                          onClick={() => onAddToWhitelist(u.lineUserId, u.displayName || 'Admin')}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm border border-indigo-100/30 font-semibold"
                        >
                          ตั้งเป็นแอดมิน
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => onViewLogs(u)}
                        className="bg-pink-50 hover:bg-pink-100 text-pink-600 text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm font-semibold"
                      >
                        ดูประวัติ
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Pagination Footer Controls */}
    {totalItems > 0 && (
      <div className="bg-gray-50/80 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between text-xs text-gray-500 font-semibold select-none">
        <div>
          แสดง <span className="text-gray-700">{startIndex + 1}</span> ถึง <span className="text-gray-700">{Math.min(startIndex + itemsPerPage, totalItems)}</span> จาก <span className="text-gray-700">{totalItems}</span> รายการ
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 bg-white transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
            title="หน้าแรก"
          >
            «
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="py-1.5 px-3 rounded-lg border border-gray-200 bg-white transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
          >
            ก่อนหน้า
          </button>

          {Array.from({ length: totalPages }, (_, idx) => {
            const pageNum = idx + 1;
            if (totalPages > 5 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
              if (pageNum === 2 || pageNum === totalPages - 1) {
                return <span key={pageNum} className="px-1 text-gray-300">...</span>;
              }
              return null;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg border transition font-bold ${
                  currentPage === pageNum
                    ? 'bg-pink-500 border-pink-500 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="py-1.5 px-3 rounded-lg border border-gray-200 bg-white transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
          >
            ถัดไป
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 bg-white transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
            title="หน้าสุดท้าย"
          >
            »
          </button>
        </div>
      </div>
    )}
  </div>
  );
};
