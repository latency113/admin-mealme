import React from 'react';
import type { FoodLog } from '../types/admin';

interface ImageLightboxModalProps {
  log: FoodLog | null;
  onClose: () => void;
  onEdit?: (log: FoodLog) => void;
  onDelete?: (log: FoodLog) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  log,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!log) return null;

  const totalMacros = (log.protein * 4) + (log.carbs * 4) + (log.fat * 9);
  const pPercent = totalMacros > 0 ? Math.round(((log.protein * 4) / totalMacros) * 100) : 0;
  const cPercent = totalMacros > 0 ? Math.round(((log.carbs * 4) / totalMacros) * 100) : 0;
  const fPercent = totalMacros > 0 ? Math.round(((log.fat * 9) / totalMacros) * 100) : 0;

  const handleDownload = () => {
    if (!log.imageUrl) return;
    const a = document.createElement('a');
    a.href = log.imageUrl;
    a.download = `${log.foodName || 'food-image'}_${new Date(log.loggedAt).getTime()}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full flex flex-col md:flex-row max-h-[90vh] border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left / Top: Image View */}
        <div className="md:w-3/5 bg-gray-950 flex items-center justify-center p-4 relative min-h-[300px] md:min-h-[480px]">
          {log.imageUrl ? (
            <img
              src={log.imageUrl}
              alt={log.foodName}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-md transition-transform duration-300 hover:scale-[1.02]"
            />
          ) : (
            <div className="text-gray-500 text-sm flex flex-col items-center gap-2">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <span>ไม่มีรูปภาพสำหรับรายการนี้</span>
            </div>
          )}

          {/* Quick Close Button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Right / Bottom: Food & Nutrition Details */}
        <div className="md:w-2/5 p-6 flex flex-col justify-between bg-white overflow-y-auto">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex justify-between items-start gap-2">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-pink-50 text-pink-600 border border-pink-100 mb-1.5">
                  {log.sourceType === 'IMAGE' ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                      ส่งผ่านรูปภาพ
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.502 49.188 49.188 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.019Z" />
                      </svg>
                      ส่งผ่านข้อความ
                    </>
                  )}
                </span>
                <h3 className="text-xl font-black text-gray-800 leading-tight">
                  {log.foodName}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="hidden md:flex w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200 items-center justify-center transition cursor-pointer flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* User & Timestamp info */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-medium">ผู้ส่ง:</span>
                <span className="font-semibold text-gray-700">
                  {log.user?.displayName || 'ไม่ระบุชื่อ'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 pt-1 border-t border-gray-100/80">
                <span className="text-gray-400">บันทึกเมื่อ:</span>
                <span>
                  {new Date(log.loggedAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  เวลา {new Date(log.loggedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                </span>
              </div>
            </div>

            {/* Calories Card */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100/80 p-4 rounded-xl text-center">
              <span className="text-xs text-pink-600 font-semibold uppercase tracking-wider block">
                พลังงานทั้งหมด
              </span>
              <div className="flex items-baseline justify-center gap-1.5 mt-1">
                <span className="text-3xl font-black text-pink-600">
                  {Math.round(log.calories).toLocaleString()}
                </span>
                <span className="text-xs text-pink-400 font-semibold">kcal</span>
              </div>
            </div>

            {/* Macros Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                สารอาหารหลัก (Macronutrients)
              </h4>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                {/* Protein */}
                <div className="bg-red-50/60 border border-red-100 p-2.5 rounded-lg">
                  <span className="text-[10px] text-red-500 font-semibold block">โปรตีน</span>
                  <span className="text-base font-black text-red-600 block mt-0.5">
                    {log.protein}g
                  </span>
                  <span className="text-[9px] text-gray-400 block">{pPercent}%</span>
                </div>

                {/* Fat */}
                <div className="bg-yellow-50/60 border border-yellow-100 p-2.5 rounded-lg">
                  <span className="text-[10px] text-yellow-600 font-semibold block">ไขมัน</span>
                  <span className="text-base font-black text-yellow-600 block mt-0.5">
                    {log.fat}g
                  </span>
                  <span className="text-[9px] text-gray-400 block">{fPercent}%</span>
                </div>

                {/* Carbs */}
                <div className="bg-green-50/60 border border-green-100 p-2.5 rounded-lg">
                  <span className="text-[10px] text-green-600 font-semibold block">คาร์บ</span>
                  <span className="text-base font-black text-green-600 block mt-0.5">
                    {log.carbs}g
                  </span>
                  <span className="text-[9px] text-gray-400 block">{cPercent}%</span>
                </div>
              </div>

              {/* Macro Bar */}
              {totalMacros > 0 && (
                <div className="w-full h-2.5 rounded-full flex overflow-hidden border border-gray-100">
                  <div className="bg-red-400 h-full" style={{ width: `${pPercent}%` }} title={`โปรตีน ${pPercent}%`} />
                  <div className="bg-yellow-400 h-full" style={{ width: `${fPercent}%` }} title={`ไขมัน ${fPercent}%`} />
                  <div className="bg-green-400 h-full" style={{ width: `${cPercent}%` }} title={`คาร์บ ${cPercent}%`} />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="pt-5 border-t border-gray-100 mt-5 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {onEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(log);
                  }}
                  className="py-2.5 px-3 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  แก้ไขข้อมูล
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => {
                    onClose();
                    onDelete(log);
                  }}
                  className="py-2.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ลบรายการ
                </button>
              )}
            </div>

            {log.imageUrl && (
              <button
                onClick={handleDownload}
                className="w-full py-2.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                ดาวน์โหลดรูปภาพ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
