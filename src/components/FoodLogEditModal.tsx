import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import type { FoodLog, UserProfile } from '../types/admin';
import { adminApi } from '../services/api';

interface FoodLogEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
  initialLog?: FoodLog | null;
  users?: UserProfile[];
  defaultUserId?: string;
}

export const FoodLogEditModal: React.FC<FoodLogEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  token,
  initialLog,
  users = [],
  defaultUserId,
}) => {
  const isEditMode = !!initialLog;

  const [userId, setUserId] = useState<string>('');
  const [foodName, setFoodName] = useState<string>('');
  const [calories, setCalories] = useState<number | string>('');
  const [protein, setProtein] = useState<number | string>('');
  const [fat, setFat] = useState<number | string>('');
  const [carbs, setCarbs] = useState<number | string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loggedAt, setLoggedAt] = useState<string>('');

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form state when opening or when initialLog changes
  useEffect(() => {
    if (isOpen) {
      if (initialLog) {
        setUserId(initialLog.userId || initialLog.user?.id || defaultUserId || '');
        setFoodName(initialLog.foodName || '');
        setCalories(initialLog.calories !== undefined ? initialLog.calories : '');
        setProtein(initialLog.protein !== undefined ? initialLog.protein : '');
        setFat(initialLog.fat !== undefined ? initialLog.fat : '');
        setCarbs(initialLog.carbs !== undefined ? initialLog.carbs : '');
        setImageUrl(initialLog.imageUrl || '');
        
        const d = new Date(initialLog.loggedAt);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setLoggedAt(formatted);
      } else {
        setUserId(defaultUserId || (users.length > 0 ? users[0].id : ''));
        setFoodName('');
        setCalories('');
        setProtein('');
        setFat('');
        setCarbs('');
        setImageUrl('');
        
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        setLoggedAt(formatted);
      }
    }
  }, [isOpen, initialLog, defaultUserId, users]);

  if (!isOpen) return null;

  // Handle File to Base64
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire('รูปแบบไฟล์ไม่ถูกต้อง', 'กรุณาอัปโหลดไฟล์รูปภาพ เช่น JPG, PNG หรือ WebP', 'warning');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      Swal.fire('ขนาดไฟล์ใหญ่เกินไป', 'กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 8MB ครับ', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // AI Gemini Nutrition Auto-Analysis
  const handleAnalyzeWithAI = async () => {
    if (!imageUrl) {
      Swal.fire('ยังไม่ได้อัปโหลดรูปภาพ', 'กรุณาอัปโหลดรูปภาพอาหารก่อนทำการวิเคราะห์ด้วย AI ครับ', 'info');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await adminApi.analyzeImage(token, imageUrl);
      setFoodName(result.foodName || foodName);
      setCalories(result.calories || 0);
      setProtein(result.protein || 0);
      setFat(result.fat || 0);
      setCarbs(result.carbs || 0);

      Swal.fire({
        title: 'วิเคราะห์สำเร็จ! ✨',
        text: `ตรวจพบ "${result.foodName}" (${result.calories} kcal)`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire('วิเคราะห์ไม่สำเร็จ', err.message || 'AI ไม่สามารถวิเคราะห์รูปภาพนี้ได้ กรุณากรอกข้อมูลเองครับ', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate live nutrient percentages
  const pVal = Number(protein) || 0;
  const fVal = Number(fat) || 0;
  const cVal = Number(carbs) || 0;
  const nutrientCal = (pVal * 4) + (cVal * 4) + (fVal * 9);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!foodName.trim()) {
      Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อเมนูอาหาร', 'warning');
      return;
    }

    if (!isEditMode && !userId) {
      Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกผู้ใช้งานสำหรับบันทึกนี้', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && initialLog) {
        await adminApi.updateFoodLog(token, initialLog.id, {
          userId: userId || undefined,
          foodName: foodName.trim(),
          calories: Number(calories) || 0,
          protein: Number(protein) || 0,
          fat: Number(fat) || 0,
          carbs: Number(carbs) || 0,
          imageUrl: imageUrl || null,
          loggedAt: loggedAt ? new Date(loggedAt).toISOString() : undefined,
        });

        Swal.fire({
          title: 'สำเร็จ',
          text: 'อัปเดตข้อมูลรูปภาพอาหารเรียบร้อยแล้ว',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await adminApi.createFoodLog(token, {
          userId,
          foodName: foodName.trim(),
          calories: Number(calories) || 0,
          protein: Number(protein) || 0,
          fat: Number(fat) || 0,
          carbs: Number(carbs) || 0,
          imageUrl: imageUrl || null,
          sourceType: imageUrl ? 'IMAGE' : 'TEXT',
          loggedAt: loggedAt ? new Date(loggedAt).toISOString() : new Date().toISOString(),
        });

        Swal.fire({
          title: 'สำเร็จ',
          text: 'บันทึกรูปภาพอาหารรายการใหม่เรียบร้อยแล้ว',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      Swal.fire('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col max-h-[92vh] border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-black text-gray-800 tracking-tight">
              {isEditMode ? '✏️ แก้ไขรายการรูปภาพอาหาร' : '📸 เพิ่มรูปภาพอาหารใหม่'}
            </h3>
            <p className="text-xs text-gray-400">
              {isEditMode
                ? 'แก้ไขรายละเอียดเมนูและค่าโภชนาการสำหรับรายการนี้'
                : 'อัปโหลดรูปภาพอาหารและระบุข้อมูลสารอาหารเข้าสู่ระบบ'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* User selector (shown if creating or multiple users) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              ผู้ใช้งานเจ้าของรายการ <span className="text-red-500">*</span>
            </label>
            {isEditMode ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-600 flex items-center justify-between">
                <span className="font-semibold">
                  {initialLog?.user?.displayName || 'ผู้ใช้งาน'} ({initialLog?.user?.lineUserId || initialLog?.userId})
                </span>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                  คงเดิม
                </span>
              </div>
            ) : (
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              >
                <option value="" disabled>-- เลือกผู้ใช้งาน --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName || 'ไม่มีชื่อโปรไฟล์'} ({u.lineUserId})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Image Upload Area */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700 block">
                รูปภาพอาหาร (Food Image)
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={handleAnalyzeWithAI}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      AI กำลังวิเคราะห์...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      วิเคราะห์ด้วย AI
                    </>
                  )}
                </button>
              )}
            </div>

            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-pink-100 bg-gray-50 flex items-center justify-center group max-h-56">
                <img
                  src={imageUrl}
                  alt="preview"
                  className="max-h-56 w-auto object-contain rounded-lg"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-lg shadow hover:bg-gray-100 transition cursor-pointer"
                  >
                    เปลี่ยนรูป
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg shadow hover:bg-red-600 transition cursor-pointer"
                  >
                    ลบรูป
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  dragOver
                    ? 'border-pink-500 bg-pink-50/40'
                    : 'border-gray-200 hover:border-pink-400 bg-gray-50/50 hover:bg-pink-50/10'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center text-xl">
                  📸
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-700">
                    คลิกเพื่ออัปโหลด หรือลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-[10px] text-gray-400">
                    รองรับ JPG, PNG, WEBP (สูงสุด 8MB)
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Food Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              ชื่อเมนูอาหาร <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น ข้าวกะเพราไก่ไข่ดาว, สลัดอกไก่"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            />
          </div>

          {/* Calories and Macros Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              ข้อมูลโภชนาการและพลังงาน
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Calories */}
              <div className="space-y-1">
                <span className="text-[10px] text-pink-600 font-bold block">
                  พลังงาน (kcal)
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-pink-50/30 border border-pink-200 rounded-lg px-3 py-2 text-xs font-bold text-pink-700 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Protein */}
              <div className="space-y-1">
                <span className="text-[10px] text-red-600 font-bold block">
                  โปรตีน (g)
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full bg-red-50/30 border border-red-200 rounded-lg px-3 py-2 text-xs font-bold text-red-700 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Fat */}
              <div className="space-y-1">
                <span className="text-[10px] text-yellow-600 font-bold block">
                  ไขมัน (g)
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full bg-yellow-50/30 border border-yellow-200 rounded-lg px-3 py-2 text-xs font-bold text-yellow-700 focus:outline-none focus:border-yellow-500"
                />
              </div>

              {/* Carbs */}
              <div className="space-y-1">
                <span className="text-[10px] text-green-600 font-bold block">
                  คาร์บ (g)
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full bg-green-50/30 border border-green-200 rounded-lg px-3 py-2 text-xs font-bold text-green-700 focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            {/* Live Macro Ratio bar */}
            {nutrientCal > 0 && (
              <div className="pt-2">
                <div className="flex justify-between text-[10px] text-gray-500 font-medium mb-1">
                  <span>สัดส่วนพลังงานจากสารอาหาร:</span>
                  <span>{Math.round(nutrientCal)} kcal รวม</span>
                </div>
                <div className="w-full h-2 rounded-full flex overflow-hidden border border-gray-100">
                  <div
                    className="bg-red-400 h-full"
                    style={{ width: `${((pVal * 4) / nutrientCal) * 100}%` }}
                    title={`โปรตีน ${Math.round(((pVal * 4) / nutrientCal) * 100)}%`}
                  />
                  <div
                    className="bg-yellow-400 h-full"
                    style={{ width: `${((fVal * 9) / nutrientCal) * 100}%` }}
                    title={`ไขมัน ${Math.round(((fVal * 9) / nutrientCal) * 100)}%`}
                  />
                  <div
                    className="bg-green-400 h-full"
                    style={{ width: `${((cVal * 4) / nutrientCal) * 100}%` }}
                    title={`คาร์บ ${Math.round(((cVal * 4) / nutrientCal) * 100)}%`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              วันและเวลาที่บันทึก
            </label>
            <input
              type="datetime-local"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold text-xs transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึกข้อมูล'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
