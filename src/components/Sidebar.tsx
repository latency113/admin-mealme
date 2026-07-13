import React, { useState } from 'react';
import { MealmeLogo } from './MealmeLogo';

interface SidebarProps {
  activeTab: 'dashboard' | 'users';
  setActiveTab: (tab: 'dashboard' | 'users') => void;
  adminProfile: any;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  adminProfile,
  onLogout,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Header Bar (below 768px) */}
      <div className="md:hidden w-full bg-white border-b border-gray-100 flex items-center justify-between px-5 h-16 fixed top-0 left-0 right-0 z-40 shadow-sm">
        <MealmeLogo />
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-gray-500 hover:text-pink-500 transition focus:outline-none cursor-pointer"
        >
          {isMobileOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown Popover */}
      {isMobileOpen && (
        <>
          {/* Click-away catcher for mobile menu */}
          <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setIsMobileOpen(false)} />
          <div className="md:hidden fixed inset-x-0 top-16 bg-white border-b border-gray-100 shadow-lg p-5 z-40 space-y-4 animate-fade-in flex flex-col">
            <nav className="space-y-1.5 flex flex-col">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsMobileOpen(false);
                }}
                className={`w-full text-left py-3 px-4 rounded-lg text-sm font-semibold flex items-center gap-3 transition cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-500 hover:bg-pink-50/50 hover:text-pink-500'
                }`}
              >
                สถิติแดชบอร์ด
              </button>
              <button
                onClick={() => {
                  setActiveTab('users');
                  setIsMobileOpen(false);
                }}
                className={`w-full text-left py-3 px-4 rounded-lg text-sm font-semibold flex items-center gap-3 transition cursor-pointer ${
                  activeTab === 'users' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-500 hover:bg-pink-50/50 hover:text-pink-500'
                }`}
              >
                ข้อมูลรายบุคคล
              </button>
            </nav>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500 text-sm overflow-hidden shadow-sm">
                  {adminProfile?.pictureUrl ? (
                    <img src={adminProfile.pictureUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    adminProfile?.displayName?.charAt(0) || 'A'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-800 truncate leading-snug">{adminProfile?.displayName || 'แอดมิน'}</p>
                  <p className="text-[10px] text-gray-400">ผู้ดูแลระบบ</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="py-1.5 px-3 rounded-lg border border-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 font-semibold text-xs transition cursor-pointer"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </>
      )}

      {/* Desktop Left Sidebar Panel (displays as w-20 icons-only on tablet md/lg, w-64 full sidebar on desktop xl) */}
      <aside className="hidden md:flex w-20 xl:w-64 bg-white border-r border-gray-100 flex-col justify-between p-4 xl:p-5 select-none h-screen sticky top-0 flex-shrink-0 animate-fade-in">
        <div className="space-y-6">
          <div className="px-1 xl:px-2">
            <MealmeLogo />
          </div>
          <hr />

          <nav className="space-y-1.5 pt-4 relative z-10 flex flex-col">
            {/* Vertical sliding background indicator pill */}
            <div
              className="absolute left-0 right-0 h-[48px] bg-pink-500 rounded-lg transition-transform duration-300 ease-out shadow-sm -z-10"
              style={{
                top: '16px',
                transform: activeTab === 'dashboard'
                  ? 'translateY(0)'
                  : 'translateY(54px)',
              }}
            />

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full h-[48px] rounded-lg text-sm font-semibold flex items-center justify-center xl:justify-start gap-3 transition-colors duration-300 cursor-pointer relative z-10 px-3 xl:px-4 ${
                activeTab === 'dashboard' ? 'text-white font-bold' : 'text-gray-500 hover:text-pink-500'
              }`}
              title="สถิติแดชบอร์ด"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
              <span className="hidden xl:inline text-xs font-semibold">สถิติแดชบอร์ด</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full h-[48px] rounded-lg text-sm font-semibold flex items-center justify-center xl:justify-start gap-3 transition-colors duration-300 cursor-pointer relative z-10 px-3 xl:px-4 ${
                activeTab === 'users' ? 'text-white font-bold' : 'text-gray-500 hover:text-pink-500'
              }`}
              title="ข้อมูลรายบุคคล"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 20.4a11.386 11.386 0 0 1-4.912-1.164h.018a11.367 11.367 0 0 1 0-1.173c.501-.91.786-1.957.786-3.07v-.003m8.484-1.905c.015.11.022.222.022.336v.109m0-1.618a5.12 5.12 0 0 0-2.237-1.013M9 15.521a4.125 4.125 0 0 0-7.533 2.493 9.337 9.337 0 0 0 4.121.952c.937 0 1.829-.128 2.67-.372L9 15.521Zm-5.4-7.208a3.125 3.125 0 1 1 6.25 0 3.125 3.125 0 0 1-6.25 0Zm12 0a3.125 3.125 0 1 1 6.25 0 3.125 3.125 0 0 1-6.25 0ZM9 5.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <span className="hidden xl:inline text-xs font-semibold">ข้อมูลรายบุคคล</span>
            </button>
          </nav>
        </div>

        {/* Profile Card & Logout */}
        <div className="pt-4 border-t border-gray-50 space-y-3.5 flex flex-col items-center xl:items-stretch">
          <div className="flex items-center gap-3 px-1 w-full justify-center xl:justify-start">
            <div className="w-9 h-9 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500 text-sm overflow-hidden shadow-sm flex-shrink-0 font-bold">
              {adminProfile?.pictureUrl ? (
                <img src={adminProfile.pictureUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                adminProfile?.displayName?.charAt(0) || 'A'
              )}
            </div>
            <div className="flex-1 min-w-0 hidden xl:block">
              <p className="text-xs text-gray-800 truncate leading-snug font-semibold">{adminProfile?.displayName || 'แอดมิน'}</p>
              <p className="text-[10px] text-gray-400 truncate">ผู้ดูแลระบบ</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2.5 rounded-lg border border-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 font-semibold text-xs transition cursor-pointer text-center flex items-center justify-center gap-2"
            title="ออกจากระบบ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            <span className="hidden xl:inline">ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
};
