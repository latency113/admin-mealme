import React, { useState, useEffect } from 'react';

interface DateSelectorProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(selectedDate.getMonth());
  const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear());

  // Sync state when selectedDate changes
  useEffect(() => {
    setPickerMonth(selectedDate.getMonth());
    setPickerYear(selectedDate.getFullYear());
  }, [selectedDate, isOpen]);

  const handleDateClick = (dayNum: number) => {
    const newDate = new Date(pickerYear, pickerMonth, dayNum);
    onChange(newDate);
    setIsOpen(false);
  };

  const formatDateLabel = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const formatted = date.toLocaleDateString('th-TH', options);

    if (isToday) return `วันนี้ (${formatted})`;
    if (isYesterday) return `เมื่อวาน (${formatted})`;
    return formatted;
  };

  const checkIsFuture = (dayNum: number): boolean => {
    const target = new Date(pickerYear, pickerMonth, dayNum);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return target > todayStart;
  };

  // Calendar calculations
  const firstDayIndex = new Date(pickerYear, pickerMonth, 1).getDay();
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between animate-fade-in relative z-30">
      <span className="text-xs font-bold text-gray-400">เลือกวันที่ต้องการดู</span>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-pink-50 hover:bg-pink-100/80 text-pink-600 font-semibold text-sm px-4 py-2 rounded-lg transition cursor-pointer shadow-sm border border-pink-100/30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          {formatDateLabel(selectedDate)}
        </button>

        {isOpen && (
          <>
            {/* Click-away overlay catcher */}
            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)} />

            {/* Dropdown Calendar Picker */}
            <div className="absolute right-0 top-full mt-2 bg-white rounded-lg p-5 border border-pink-100 shadow-2xl w-72 space-y-4 z-50 animate-fade-in text-left">
              {/* Controls */}
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (pickerMonth === 0) {
                      setPickerMonth(11);
                      setPickerYear(pickerYear - 1);
                    } else {
                      setPickerMonth(pickerMonth - 1);
                    }
                  }}
                  className="w-8 h-8 rounded bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-pink-600 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm">
                  <select
                    value={pickerMonth}
                    onChange={(e) => setPickerMonth(Number(e.target.value))}
                    className="bg-transparent focus:outline-none cursor-pointer text-pink-600 font-semibold border-b border-dashed border-pink-300 pb-0.5"
                  >
                    {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, idx) => (
                      <option key={idx} value={idx}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={pickerYear}
                    onChange={(e) => setPickerYear(Number(e.target.value))}
                    className="bg-transparent focus:outline-none cursor-pointer text-pink-600 font-semibold border-b border-dashed border-pink-300 pb-0.5"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const y = new Date().getFullYear() - i;
                      return { yr: y, label: `${y + 543}` };
                    }).map((y) => (
                      <option key={y.yr} value={y.yr}>{y.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (pickerMonth === 11) {
                      setPickerMonth(0);
                      setPickerYear(pickerYear + 1);
                    } else {
                      setPickerMonth(pickerMonth + 1);
                    }
                  }}
                  className="w-8 h-8 rounded bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-pink-600 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400">
                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day) => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`spacer-${idx}`} className="py-2" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isSelected = selectedDate.getDate() === dayNum &&
                                     selectedDate.getMonth() === pickerMonth &&
                                     selectedDate.getFullYear() === pickerYear;
                  const isFuture = checkIsFuture(dayNum);

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      disabled={isFuture}
                      onClick={() => handleDateClick(dayNum)}
                      className={`py-2 text-xs font-bold rounded transition flex items-center justify-center ${
                        isSelected
                          ? 'bg-pink-500 text-white shadow-sm scale-105'
                          : isFuture
                            ? 'text-gray-300 cursor-not-allowed opacity-40'
                            : 'hover:bg-pink-50 text-gray-700'
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>

              {/* Cancel action */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-grow py-2.5 rounded-lg border border-gray-200 text-gray-500 font-semibold text-xs hover:bg-gray-50 transition cursor-pointer text-center"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
