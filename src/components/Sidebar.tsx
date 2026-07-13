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
  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between p-5 select-none">
      <div className="space-y-6">
        <div className="flex flex-col gap-1.5 px-2">
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
            className={`w-full text-left h-[48px] px-4 rounded-lg text-sm font-semibold flex items-center gap-3 transition-colors duration-300 cursor-pointer relative z-10 ${
              activeTab === 'dashboard' ? 'text-white font-bold' : 'text-gray-500 hover:text-pink-500'
            }`}
          >
            สถิติแดชบอร์ด
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full text-left h-[48px] px-4 rounded-lg text-sm font-semibold flex items-center gap-3 transition-colors duration-300 cursor-pointer relative z-10 ${
              activeTab === 'users' ? 'text-white font-bold' : 'text-gray-500 hover:text-pink-500'
            }`}
          >
            ข้อมูลรายบุคคล
          </button>
        </nav>
      </div>

      {/* Profile Card & Logout */}
      <div className="pt-4 border-t border-gray-50 space-y-3.5">
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500 text-sm overflow-hidden shadow-sm">
            {adminProfile?.pictureUrl ? (
              <img src={adminProfile.pictureUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              adminProfile?.displayName?.charAt(0) || 'A'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-800 truncate leading-snug">{adminProfile?.displayName || 'แอดมิน'}</p>
            <p className="text-[10px] text-gray-400 truncate">ผู้ดูแลระบบ</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-2.5 rounded-lg border border-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 font-semibold text-xs transition cursor-pointer text-center"
        >
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
};
