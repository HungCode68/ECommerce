import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/products', label: 'Sản phẩm', icon: '📦' },
  { path: '/categories', label: 'Danh mục', icon: '📁' },
  { path: '/orders', label: 'Đơn hàng', icon: '🛒' },
  { path: '/users', label: 'Người dùng', icon: '👥' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`bg-gray-900 text-white min-h-screen transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && <h1 className="text-xl font-bold">Admin Panel</h1>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded hover:bg-gray-700"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Menu */}
      <nav className="p-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
        {!collapsed && (
          <div className="mb-2 text-sm text-gray-400">
            {user?.email}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full p-2 text-left text-red-400 hover:bg-gray-800 rounded"
        >
          {collapsed ? '🚪' : '🚪 Đăng xuất'}
        </button>
      </div>
    </aside>
  );
}
