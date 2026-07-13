import React from 'react';
import type { UserCountStats } from '../types/admin';

interface DashboardTabProps {
  stats: UserCountStats | null;
  onExportExcel: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-800 tracking-tight">สถิติระบบโดยรวม</h1>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between h-28 animate-fade-in animate-duration-500">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">จำนวนผู้ใช้งานทั้งหมด</span>
          <p className="text-3xl font-extrabold text-pink-500 mt-1">{stats?.totalUsers || 0}</p>
          <span className="text-[10px] text-gray-400 font-medium">บัญชีที่ลงทะเบียนใน LINE</span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between h-28 animate-fade-in animate-duration-500">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">จำนวนเมนูที่บันทึกแล้ว</span>
          <p className="text-3xl font-extrabold text-pink-500 mt-1">{stats?.totalFoodLogs || 0}</p>
          <span className="text-[10px] text-gray-400 font-medium">รายการประวัติการทาน</span>
        </div>
      </div>

      {/* Breakdown Chart card */}
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-xs text-gray-400 font-semibold uppercase tracking-wider">สัดส่วนวิธีการวิเคราะห์เมนูอาหาร</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats?.sourceStats.map((item) => {
            const isImage = item.sourceType === 'IMAGE';
            const percent = stats.totalFoodLogs > 0 
              ? Math.round((item._count.sourceType / stats.totalFoodLogs) * 100) 
              : 0;

            return (
              <div key={item.sourceType} className="p-4 rounded-lg border border-gray-100 flex flex-col justify-between h-24">
                <div>
                  <span className="text-xs text-gray-400 block font-medium">{isImage ? 'กล้องถ่ายรูปส่ง (AI)' : 'พิมพ์ข้อความส่ง (AI)'}</span>
                  <span className="text-lg font-bold text-gray-800 block mt-1">{item._count.sourceType} เมนู</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded overflow-hidden mt-2">
                  <div 
                    className={`h-full rounded bg-gradient-to-r ${isImage ? 'from-pink-400 to-pink-500' : 'from-indigo-400 to-indigo-500'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Research & Data Export
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-bold text-gray-800 text-sm">ดาวน์โหลดชุดข้อมูลงานวิจัย</h3>
          <p className="text-xs text-gray-400">ส่งออกข้อมูลรายชื่อเมนูอาหาร พลังงาน และสัดส่วนสารอาหารทั้งหมดเป็นไฟล์ Excel (.xlsx)</p>
        </div>

        <button
          onClick={onExportExcel}
          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs py-3.5 px-5 rounded-lg transition cursor-pointer shadow-md flex items-center gap-2"
        >
          📊 ส่งออกข้อมูล Excel
        </button>
      </div> */}
    </div>
  );
};
