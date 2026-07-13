import { useEffect, useState } from 'react';
import liff from '@line/liff';
import Swal from 'sweetalert2';
import type { UserCountStats, UserProfile, FoodLog } from './types/admin';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/DashboardTab';
import { UsersTab } from './components/UsersTab';
import { FoodLogsModal } from './components/FoodLogsModal';
import { adminApi } from './services/api';
import { MealmeLogo } from './components/MealmeLogo';

function App() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'));
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users'>('dashboard');
  const [stats, setStats] = useState<UserCountStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected user logs detail modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUserLogs, setSelectedUserLogs] = useState<FoodLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [whitelist, setWhitelist] = useState<any[]>([]);

  const liffId = import.meta.env.VITE_LIFF_ID;

  // 1. Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      // Check if we have a valid saved token already
      if (token) {
        setIsAuthorized(true);
        setLoading(false);
        fetchStats(token);
        fetchUsers(token);
        fetchWhitelist(token);
        return;
      }

      if (!liffId || liffId === 'your-admin-liff-id') {
        console.warn("VITE_LIFF_ID is not configured.");
        setLoading(false);
        return;
      }

      try {
        await liff.init({ liffId });
        if (liff.isLoggedIn()) {
          const idToken = liff.getIDToken();
          if (idToken) {
            await handleLogin(idToken);
          } else {
            Swal.fire('Error', 'ไม่พบ LINE ID Token กรุณาลองใหม่อีกครั้ง', 'error');
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("LIFF Init error:", err);
        setLoading(false);
      }
    };

    initAuth();
  }, [token]);

  const handleLogin = async (idToken: string) => {
    try {
      const data = await adminApi.login(idToken);
      localStorage.setItem('admin_token', data.token);
      setToken(data.token);
      setAdminProfile(data.admin);
      setIsAuthorized(true);
      setAccessDenied(false);
      
      fetchStats(data.token);
      fetchUsers(data.token);
      fetchWhitelist(data.token);
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('403') || err.message.includes('สิทธิ์')) {
        setAccessDenied(true);
      } else {
        Swal.fire('ล็อกอินล้มเหลว', err.message || 'ไม่มีสิทธิ์เข้าถึงส่วนนี้', 'error');
      }
      setLoading(false);
    }
  };

  const triggerLineLogin = () => {
    if (liffId && liffId !== 'your-admin-liff-id') {
      liff.login();
    } else {
      Swal.fire({
        title: 'ไม่ได้ตั้งค่า LIFF ID',
        text: 'กรุณาเปิดไฟล์ admin/.env และกำหนดค่า VITE_LIFF_ID ก่อนทำการเข้าสู่ระบบจริงครับ',
        icon: 'warning'
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setIsAuthorized(false);
    setAdminProfile(null);
    if (liffId && liffId !== 'your-admin-liff-id' && liff.isLoggedIn()) {
      liff.logout();
    }
    window.location.reload();
  };

  // 2. Fetch Data from Protected API
  const fetchWhitelist = async (authToken: string) => {
    try {
      const data = await adminApi.getWhitelist(authToken);
      setWhitelist(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAddToWhitelist = async (lineUserId: string, displayName?: string) => {
    if (!token) return;
    const confirm = await Swal.fire({
      title: 'ยืนยันการแต่งตั้งแอดมิน',
      text: `คุณต้องการแต่งตั้งคุณ ${displayName || 'ผู้ใช้'} เป็นผู้ดูแลระบบใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ตั้งเป็นแอดมิน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#4f46e5'
    });
    if (!confirm.isConfirmed) return;

    try {
      await adminApi.addToWhitelist(token, lineUserId, displayName);
      fetchWhitelist(token);
      Swal.fire('สำเร็จ', 'แต่งตั้งผู้ดูแลระบบรายใหม่เรียบร้อยแล้ว', 'success');
    } catch (err: any) {
      Swal.fire('ผิดพลาด', err.message || 'ไม่สามารถแต่งตั้งได้', 'error');
    }
  };

  const handleRemoveFromWhitelist = async (lineUserId: string) => {
    if (!token) return;
    if (adminProfile && adminProfile.lineUserId === lineUserId) {
      Swal.fire('ระวัง', 'คุณไม่สามารถยกเลิกสิทธิ์ผู้ดูแลระบบของตัวเองได้', 'warning');
      return;
    }
    const confirm = await Swal.fire({
      title: 'ยืนยันการถอนสิทธิ์',
      text: 'คุณแน่ใจหรือไม่ที่จะถอนสิทธิ์ผู้ดูแลระบบของสมาชิกท่านนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ถอนสิทธิ์',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    });
    if (!confirm.isConfirmed) return;

    try {
      await adminApi.removeFromWhitelist(token, lineUserId);
      fetchWhitelist(token);
      Swal.fire('สำเร็จ', 'ถอนสิทธิ์ผู้ดูแลระบบเรียบร้อยแล้ว', 'success');
    } catch (err: any) {
      Swal.fire('ผิดพลาด', err.message || 'ไม่สามารถถอนสิทธิ์ได้', 'error');
    }
  };
  const fetchStats = async (authToken: string) => {
    try {
      const data = await adminApi.getStats(authToken);
      setStats(data);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'UNAUTHORIZED') {
        handleLogout();
      }
    }
  };

  const fetchUsers = async (authToken: string) => {
    try {
      const data = await adminApi.getUsers(authToken);
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'UNAUTHORIZED') {
        handleLogout();
      }
    }
  };

  // 3. User Detail Logs
  const viewUserLogs = async (user: UserProfile) => {
    setSelectedUser(user);
    setLoadingLogs(true);
    setSelectedUserLogs([]);
    
    try {
      const data = await adminApi.getUserLogs(user.lineUserId);
      setSelectedUserLogs(data);
    } catch (err: any) {
      console.error(err);
      Swal.fire('Error', err.message || 'ไม่สามารถดึงข้อมูลประวัติได้', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  // 4. Download Excel Report
  const downloadExcel = async () => {
    if (!token) return;

    Swal.fire({
      title: 'กำลังเตรียมไฟล์ดาวน์โหลด...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const blob = await adminApi.exportExcel(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Gindee_Research_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      Swal.close();
      Swal.fire('สำเร็จ', 'ดาวน์โหลดไฟล์วิจัยสำเร็จเรียบร้อย', 'success');
    } catch (err: any) {
      Swal.close();
      Swal.fire('ล้มเหลว', err.message || 'เกิดข้อผิดพลาดในการสร้างไฟล์ Excel', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-50 text-gray-600 gap-4">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-extrabold text-sm text-pink-600 tracking-wide">กำลังตรวจเช็คสิทธิ์ผู้ดูแลระบบ...</p>
      </div>
    );
  }

  // 5. Render Unauthorized View
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 select-none">
        <div className="max-w-md w-full bg-white p-8 rounded-lg border border-gray-100 shadow-sm space-y-6 text-center animate-fade-in animate-duration-500">
          <div className="flex justify-center">
            <MealmeLogo />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Mealme Admin</h1>
            <p className="text-xs text-gray-400">แดชบอร์ดจัดการข้อมูลสุขภาพและการใช้งานวิจัย</p>
          </div>

          {accessDenied && (
            <div className="bg-red-50 text-red-600 border border-red-100/50 p-4 rounded-md text-xs text-left leading-relaxed space-y-1">
              <p className="font-bold">❌ การเข้าถึงถูกปฏิเสธ (Forbidden)</p>
              <p className="text-[11px] opacity-90 font-medium">บัญชี LINE ของคุณไม่ได้รับอนุญาตให้สิทธิ์แอดมิน กรุณาติดต่อหัวหน้าทีมเพื่อเพิ่ม ID ของคุณลงในระบบ Whitelist</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={triggerLineLogin}
              className="w-full bg-[#06C755] hover:bg-[#05b04b] text-white font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M24 10.3c0-5.7-5.4-10.3-12-10.3S0 4.6 0 10.3c0 5.1 4.3 9.3 10.1 10.1.4.1.9.3.9.7v2.3c0 .5-.2.9.3.9.5 0 2.3-1.6 3.2-2.5 4.9-1.2 9.5-5.2 9.5-11.5z"/>
              </svg>
              เข้าสู่ระบบด้วย LINE
            </button>
            
            {(!liffId || liffId === 'your-admin-liff-id') && (
              <div className="bg-orange-50 text-orange-700 border border-orange-100/50 p-4 rounded-md text-xs text-left leading-relaxed">
                <p className="font-bold">⚠️ ยังไม่ได้ตั้งค่า VITE_LIFF_ID</p>
                <p className="text-[11px] mt-0.5 opacity-90 font-medium">กรุณากำหนดค่า VITE_LIFF_ID ในไฟล์ admin/.env เพื่อเปิดการเข้าสู่ระบบผ่าน LINE Login ในโหมด Production</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 6. Render Dashboard Panel
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminProfile={adminProfile}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {activeTab === 'dashboard' ? (
          <DashboardTab stats={stats} onExportExcel={downloadExcel} />
        ) : (
          <UsersTab
            users={users}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onViewLogs={viewUserLogs}
            whitelist={whitelist}
            onAddToWhitelist={handleAddToWhitelist}
            onRemoveFromWhitelist={handleRemoveFromWhitelist}
          />
        )}
      </main>

      {/* Detailed Food Logs Overlay Modal */}
      <FoodLogsModal
        selectedUser={selectedUser}
        logs={selectedUserLogs}
        loading={loadingLogs}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}

export default App;
