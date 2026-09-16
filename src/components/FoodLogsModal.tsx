import React, { useState } from 'react';
import Swal from 'sweetalert2';
import type { UserProfile, FoodLog } from '../types/admin';
import { DateSelector } from './DateSelector';
import { adminApi } from '../services/api';
import { ImageLightboxModal } from './ImageLightboxModal';
import { FoodLogEditModal } from './FoodLogEditModal';

interface FoodLogsModalProps {
  selectedUser: UserProfile | null;
  logs: FoodLog[];
  loading: boolean;
  onClose: () => void;
  token?: string | null;
  onRefreshLogs?: () => void;
  allUsers?: UserProfile[];
}

const getLocalDateStr = (isoString: string): string => {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const FoodLogsModal: React.FC<FoodLogsModalProps> = ({
  selectedUser,
  logs,
  loading,
  onClose,
  token,
  onRefreshLogs,
  allUsers = [],
}) => {
  const [lightboxLog, setLightboxLog] = useState<FoodLog | null>(null);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const [timeframe, setTimeframe] = useState<'daily' | '7days' | '30days'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  if (!selectedUser) return null;

  const dailyCalorieGoal = selectedUser.dailyCalorieGoal || 2000;
  const userGoal = (selectedUser.goal as 'lose' | 'maintain' | 'gain') || 'maintain';

  // Calculate Date bounds
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const sevenDaysAgoStart = new Date(todayStart);
  sevenDaysAgoStart.setDate(todayStart.getDate() - 6);

  const thirtyDaysAgoStart = new Date(todayStart);
  thirtyDaysAgoStart.setDate(todayStart.getDate() - 29);

  // Filter logs by timeframe
  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.loggedAt);
    if (timeframe === 'daily') {
      const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999);
      return logDate >= startOfDay && logDate <= endOfDay;
    } else if (timeframe === '7days') {
      return logDate >= sevenDaysAgoStart;
    } else {
      return logDate >= thirtyDaysAgoStart;
    }
  });



  // 1. Calorie stats
  const totalConsumed = Math.round(filteredLogs.reduce((sum, log) => sum + log.calories, 0));
  const totalGoal = timeframe === 'daily' ? dailyCalorieGoal :
    timeframe === '7days' ? dailyCalorieGoal * 7 :
      dailyCalorieGoal * 30;

  const excess = totalConsumed > totalGoal ? totalConsumed - totalGoal : 0;
  const deficit = totalConsumed < totalGoal ? totalGoal - totalConsumed : 0;

  // 2. Nutrients calculations
  const totalProtein = Math.round(filteredLogs.reduce((sum, log) => sum + log.protein, 0));
  const totalCarbs = Math.round(filteredLogs.reduce((sum, log) => sum + log.carbs, 0));
  const totalFat = Math.round(filteredLogs.reduce((sum, log) => sum + log.fat, 0));

  const proteinCal = totalProtein * 4;
  const carbsCal = totalCarbs * 4;
  const fatCal = totalFat * 9;
  const totalNutrientCal = proteinCal + carbsCal + fatCal;

  const proteinPercent = totalNutrientCal > 0 ? Math.round((proteinCal / totalNutrientCal) * 100) : 0;
  const carbsPercent = totalNutrientCal > 0 ? Math.round((carbsCal / totalNutrientCal) * 100) : 0;
  const fatPercent = totalNutrientCal > 0 ? Math.round((fatCal / totalNutrientCal) * 100) : 0;

  // Target ratios based on goal
  let proteinRatio = 0.20;
  let carbsRatio = 0.50;
  let fatRatio = 0.30;

  if (userGoal === 'lose') {
    proteinRatio = 0.25;
    carbsRatio = 0.45;
    fatRatio = 0.30;
  } else if (userGoal === 'gain') {
    proteinRatio = 0.25;
    carbsRatio = 0.50;
    fatRatio = 0.25;
  }

  const daysMultiplier = timeframe === 'daily' ? 1 : timeframe === '7days' ? 7 : 30;

  const targetProtein = Math.round(((dailyCalorieGoal * proteinRatio) / 4) * daysMultiplier);
  const targetCarbs = Math.round(((dailyCalorieGoal * carbsRatio) / 4) * daysMultiplier);
  const targetFat = Math.round(((dailyCalorieGoal * fatRatio) / 9) * daysMultiplier);

  // 3. Last 7 Days chart compiler
  const getLast7DaysData = () => {
    const data = [];
    const weekdays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const allGroupedLogs = logs.reduce((groups: { [key: string]: FoodLog[] }, log) => {
      const dateStr = getLocalDateStr(log.loggedAt);
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(log);
      return groups;
    }, {});

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(todayStart.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLogs = allGroupedLogs[dateStr] || [];
      const calories = dayLogs.reduce((sum, log) => sum + log.calories, 0);
      data.push({
        label: weekdays[d.getDay()],
        calories: Math.round(calories),
        dateStr
      });
    }
    return data;
  };

  const chartData = getLast7DaysData();

  const handleDeleteLog = async (log: FoodLog) => {
    if (!token) return;
    const confirm = await Swal.fire({
      title: 'ยืนยันการลบรายการอาหารนี้?',
      html: `คุณต้องการลบ <b>"${log.foodName}"</b> ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก',
    });
    if (!confirm.isConfirmed) return;

    try {
      await adminApi.deleteFoodLog(token, log.id);
      Swal.fire({
        title: 'ลบสำเร็จ',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      onRefreshLogs?.();
    } catch (err: any) {
      Swal.fire('ผิดพลาด', err.message || 'ไม่สามารถลบรายการได้', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] space-y-4">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-50 flex-shrink-0">
          <div>
            <h3 className="text-base text-gray-800 tracking-tight">
              ประวัติสุขภาพของ <span className="font-bold text-lg">{selectedUser.displayName || 'ผู้ใช้'}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable dashboard elements */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {/* Timeframe Filter Tab */}
          <div className="bg-gray-100 p-1 rounded-lg flex gap-1 relative z-10 select-none">
            {/* Sliding indicator */}
            <div
              className="absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] bg-pink-500 rounded transition-transform duration-300 ease-out shadow-sm"
              style={{
                transform: timeframe === 'daily'
                  ? 'translateX(0)'
                  : timeframe === '7days'
                    ? 'translateX(calc(100% + 4px))'
                    : 'translateX(calc(200% + 8px))',
              }}
            />

            <button
              onClick={() => setTimeframe('daily')}
              className={`flex-1 py-2 text-xs font-semibold text-center rounded transition-colors duration-300 cursor-pointer relative z-10 ${
                timeframe === 'daily' ? 'text-white font-bold' : 'text-gray-500 hover:text-pink-500'
              }`}
            >
              รายวัน
            </button>
            <button
              onClick={() => setTimeframe('7days')}
              className={`flex-1 py-2 text-xs font-semibold text-center rounded transition-colors duration-300 cursor-pointer relative z-10 ${
                timeframe === '7days' ? 'text-white font-bold' : 'text-gray-500 hover:text-pink-500'
              }`}
            >
              7 วันที่ผ่านมา
            </button>
            <button
              onClick={() => setTimeframe('30days')}
              className={`flex-1 py-2 text-xs font-semibold text-center rounded transition-colors duration-300 cursor-pointer relative z-10 ${
                timeframe === '30days' ? 'text-white font-bold' : 'text-gray-500 hover:text-pink-500'
              }`}
            >
              30 วันที่ผ่านมา
            </button>
          </div>

          {/* Daily Date Switcher */}
          {timeframe === 'daily' && (
            <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400 font-medium">กำลังโหลดข้อมูลประวัติ...</p>
            </div>
          ) : (
            <>
              {/* 1. Calorie Stats Card */}
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <h4 className="text-gray-800 font-bold">
                    สรุปพลังงานแคลอรี ({timeframe === 'daily' ? 'รายวัน' : timeframe === '7days' ? '7 วันที่ผ่านมา' : '30 วันที่ผ่านมา'})
                  </h4>
                  <span className="text-gray-400 font-medium">เป้าหมาย: {totalGoal.toLocaleString()} kcal</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-pink-50/40 p-3 rounded border border-pink-100/30 text-center flex flex-col justify-between h-20">
                    <span className="text-[10px] text-gray-500 block leading-tight">บริโภคแล้ว</span>
                    <span className="text-base text-pink-600 font-bold block mt-1">{totalConsumed.toLocaleString()}</span>
                    <span className="text-[9px] text-gray-400 block">kcal</span>
                  </div>

                  <div className="bg-green-50/40 p-3 rounded border border-green-100/30 text-center flex flex-col justify-between h-20">
                    <span className="text-[10px] text-gray-500 font-medium block leading-tight">ยังขาดอีก</span>
                    <span className="text-base text-green-600 font-bold block mt-1">{deficit.toLocaleString()}</span>
                    <span className="text-[9px] text-gray-400 block">kcal</span>
                  </div>

                  <div className={`p-3 rounded text-center flex flex-col justify-between h-20 border ${
                    excess > 0 ? 'bg-red-50/60 border-red-100/50' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <span className="text-[10px] text-gray-500 font-medium block leading-tight">เกินเป้าหมาย</span>
                    <span className={`text-base font-bold mt-1 block ${excess > 0 ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
                      {excess.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-gray-400 block">kcal</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="w-full bg-gray-100 h-2.5 rounded flex overflow-hidden border border-gray-50 relative">
                    {totalConsumed <= totalGoal ? (
                      <>
                        <div
                          className="h-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-500 rounded-l"
                          style={{ width: `${totalGoal > 0 ? (totalConsumed / totalGoal) * 100 : 0}%` }}
                        />
                        <div
                          className="h-full bg-green-200/40 transition-all duration-500"
                          style={{ width: `${totalGoal > 0 ? (deficit / totalGoal) * 100 : 0}%` }}
                        />
                      </>
                    ) : (
                      <>
                        <div
                          className="h-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-500 rounded-l"
                          style={{ width: `${totalConsumed > 0 ? (totalGoal / totalConsumed) * 100 : 0}%` }}
                        />
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-500"
                          style={{ width: `${totalConsumed > 0 ? (excess / totalConsumed) * 100 : 0}%` }}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-400 px-0.5">
                    <span>0%</span>
                    <span>{totalConsumed > 0 && totalGoal > 0 ? Math.round((totalConsumed / totalGoal) * 100) : 0}%</span>
                    <span>{totalConsumed > totalGoal ? '100%+' : '100%'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Weekly Bar Chart (Only when '7days' is active) */}
              {timeframe === '7days' && (
                <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm space-y-4 animate-fade-in animate-duration-300">
                  <div className="flex justify-between items-center text-xs">
                    <h4 className="text-gray-800 font-bold">กราฟพลังงาน 7 วันย้อนหลัง</h4>
                    <span className="text-gray-400 font-medium">เป้าหมาย: {dailyCalorieGoal.toLocaleString()} kcal / วัน</span>
                  </div>

                  <div className="h-28 flex items-end justify-between gap-2 pt-2 px-1">
                    {chartData.map((day, idx) => {
                      const heightPercent = Math.min((day.calories / dailyCalorieGoal) * 100, 100);
                      const isOver = day.calories > dailyCalorieGoal;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                          <div className="absolute bottom-full mb-1 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                            {day.calories} kcal
                          </div>
                          <div className="w-full bg-gray-50 h-20 rounded-t flex items-end overflow-hidden border border-gray-100/50">
                            <div
                              className={`w-full rounded-t transition-all duration-500 ${
                                isOver
                                  ? 'bg-gradient-to-t from-red-400 to-red-500 animate-pulse'
                                  : day.calories > 0
                                    ? 'bg-gradient-to-t from-pink-400 to-pink-500'
                                    : 'bg-gray-100'
                              }`}
                              style={{ height: `${day.calories > 0 ? Math.max(heightPercent, 8) : 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold">{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Nutrition breakdown */}
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <h4 className="text-gray-800 font-bold">โภชนาการที่แนะนำต่อวัน</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    userGoal === 'lose' ? 'bg-orange-50 text-orange-600' :
                      userGoal === 'gain' ? 'bg-green-50 text-green-600' :
                        'bg-blue-50 text-blue-600'
                  }`}>
                    {userGoal === 'lose' ? 'สูตรลดน้ำหนัก 📉' : userGoal === 'gain' ? 'สูตรเพิ่มน้ำหนัก 📈' : 'สูตรสมดุล ⚖️'}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Protein */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span className="text-gray-600 font-medium">โปรตีน (Protein)</span>
                      </div>
                      <span className="text-gray-500 font-medium">
                        {totalProtein}g <span className="text-gray-400 font-normal">/ {targetProtein.toLocaleString()}g</span>
                        <span className="ml-1.5 text-[10px] text-pink-500">
                          ({targetProtein > 0 ? Math.round((totalProtein / targetProtein) * 100) : 0}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded overflow-hidden border border-gray-50">
                      <div
                        className="bg-red-400 h-full rounded transition-all duration-500"
                        style={{ width: `${targetProtein > 0 ? Math.min((totalProtein / targetProtein) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Carbs */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        <span className="text-gray-600 font-medium">คาร์บ (Carbs)</span>
                      </div>
                      <span className="text-gray-500 font-medium">
                        {totalCarbs}g <span className="text-gray-400 font-normal">/ {targetCarbs.toLocaleString()}g</span>
                        <span className="ml-1.5 text-[10px] text-pink-500">
                          ({targetCarbs > 0 ? Math.round((totalCarbs / targetCarbs) * 100) : 0}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded overflow-hidden border border-gray-50">
                      <div
                        className="bg-green-400 h-full rounded transition-all duration-500"
                        style={{ width: `${targetCarbs > 0 ? Math.min((totalCarbs / targetCarbs) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Fat */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <span className="text-gray-600 font-medium">ไขมัน (Fat)</span>
                      </div>
                      <span className="text-gray-500 font-medium">
                        {totalFat}g <span className="text-gray-400 font-normal">/ {targetFat.toLocaleString()}g</span>
                        <span className="ml-1.5 text-[10px] text-pink-500">
                          ({targetFat > 0 ? Math.round((totalFat / targetFat) * 100) : 0}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded overflow-hidden border border-gray-50">
                      <div
                        className="bg-yellow-400 h-full rounded transition-all duration-500"
                        style={{ width: `${targetFat > 0 ? Math.min((totalFat / targetFat) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Ratio comparison bars */}
                <div className="pt-3 border-t border-gray-50 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block text-left font-medium">สัดส่วนที่กินจริง</span>
                    {totalNutrientCal > 0 ? (
                      <div>
                        <div className="w-full h-3 rounded flex overflow-hidden">
                          <div className="bg-red-400 h-full" style={{ width: `${(proteinCal / totalNutrientCal) * 100}%` }} />
                          <div className="bg-green-400 h-full" style={{ width: `${(carbsCal / totalNutrientCal) * 100}%` }} />
                          <div className="bg-yellow-400 h-full" style={{ width: `${(fatCal / totalNutrientCal) * 100}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] font-semibold mt-1">
                          <span className="text-red-500">โปรตีน {proteinPercent}%</span>
                          <span className="text-green-600">คาร์บ {carbsPercent}%</span>
                          <span className="text-yellow-600">ไขมัน {fatPercent}%</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic py-1 text-center font-medium">ยังไม่มีข้อมูลอาหารสะสม</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Logged Meals list */}
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs text-gray-800 font-bold uppercase tracking-wider">รายการอาหารที่บันทึก</h4>
                  {token && (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="text-xs font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 py-1.5 px-3 rounded-lg transition cursor-pointer flex items-center gap-1"
                    >
                      + เพิ่มรายการอาหาร
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <span className="text-3xl">🥗</span>
                      <p className="text-xs text-gray-400 font-semibold">ไม่มีรายการบันทึกอาหารในช่วงเวลานี้</p>
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div key={log.id} className="flex gap-4 p-4 rounded-lg bg-pink-50/20 border border-pink-100/10 items-center">
                        {log.imageUrl ? (
                            <div
                              onClick={() => setLightboxLog(log)}
                              className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-pink-100/40 cursor-pointer hover:opacity-85 transition group relative"
                              title="คลิกเพื่อดูรูปขนาดเต็ม"
                            >
                              <img src={log.imageUrl} alt={log.foodName} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                                🔍
                              </div>
                            </div>
                          ) :
                            (
                              <div className="w-16 h-16 flex text-center items-center justify-center bg-gray-100 text-gray-400 text-xs rounded-xl">
                                ไม่มีรูปภาพ
                              </div>
                            )}
                        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4
                              onClick={() => log.imageUrl && setLightboxLog(log)}
                              className={`text-base text-gray-800 leading-tight truncate ${log.imageUrl ? 'cursor-pointer hover:text-pink-600' : ''}`}
                            >
                              {log.foodName}
                            </h4>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[9px] text-gray-400 bg-white px-2.5 py-0.5 rounded border border-gray-100 shadow-sm">
                                {new Date(log.loggedAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })} {new Date(log.loggedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {token && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setEditingLog(log)}
                                    className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center text-[10px] transition cursor-pointer"
                                    title="แก้ไขข้อมูล"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLog(log)}
                                    className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center text-[10px] transition cursor-pointer"
                                    title="ลบรายการ"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2 text-center text-[10px] mt-2.5">
                            <div className="bg-pink-50/50 p-1.5 rounded-md border border-pink-100/10">
                              <p className="text-xs text-pink-600 font-bold">{Math.round(log.calories)}</p>
                              <p className="text-[8px] text-gray-400 font-medium">แคล</p>
                            </div>
                            <div className="bg-red-50/50 p-1.5 rounded-md border border-red-100/10">
                              <p className="text-xs text-red-600 font-bold">{log.protein}</p>
                              <p className="text-[8px] text-gray-400 font-medium">โปรตีน</p>
                            </div>
                            <div className="bg-yellow-50/50 p-1.5 rounded-md border border-yellow-100/10">
                              <p className="text-xs text-yellow-600 font-bold">{log.fat}</p>
                              <p className="text-[8px] text-gray-400 font-medium">ไขมัน</p>
                            </div>
                            <div className="bg-green-50/50 p-1.5 rounded-md border border-green-100/10">
                              <p className="text-xs text-green-600 font-bold">{log.carbs}</p>
                              <p className="text-[8px] text-gray-400 font-medium">คาร์บ</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-lg bg-pink-500 text-white font-semibold text-xs hover:bg-pink-600 transition shadow-md cursor-pointer text-center"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      <ImageLightboxModal
        log={lightboxLog}
        onClose={() => setLightboxLog(null)}
        onEdit={(log) => setEditingLog(log)}
        onDelete={(log) => handleDeleteLog(log)}
      />

      {/* Add Modal */}
      <FoodLogEditModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => onRefreshLogs?.()}
        token={token || ''}
        users={allUsers}
        defaultUserId={selectedUser.id}
      />

      {/* Edit Modal */}
      <FoodLogEditModal
        isOpen={!!editingLog}
        initialLog={editingLog}
        onClose={() => setEditingLog(null)}
        onSuccess={() => onRefreshLogs?.()}
        token={token || ''}
        users={allUsers}
        defaultUserId={selectedUser.id}
      />
    </div>
  );
};
