import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Xin chào, {user?.name || 'Admin'}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString('vi-VN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
      </div>
    </header>
  );
}
