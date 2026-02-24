import { useState, useEffect } from 'react';
import { statsApi, orderApi, productApi } from '../../api';

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load stats
      const statsRes = await statsApi.getDashboard();
      if (statsRes.data.data) {
        setStats(statsRes.data.data);
      }

      // Load recent orders
      const ordersRes = await orderApi.getAll({ limit: 5 });
      if (ordersRes.data.data) {
        setRecentOrders(ordersRes.data.data.orders || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(stats.totalRevenue)}
          icon="💰"
          color="border-green-500"
        />
        <StatCard
          title="Tổng đơn hàng"
          value={stats.totalOrders?.toLocaleString() || 0}
          icon="📦"
          color="border-blue-500"
        />
        <StatCard
          title="Sản phẩm"
          value={stats.totalProducts?.toLocaleString() || 0}
          icon="🏷️"
          color="border-purple-500"
        />
        <StatCard
          title="Người dùng"
          value={stats.totalUsers?.toLocaleString() || 0}
          icon="👥"
          color="border-orange-500"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Đơn hàng gần đây</h2>
        
        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Mã đơn</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tổng tiền</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ngày đặt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">#{order.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.customer_name || `User ${order.user_id}`}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(order.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Chưa có đơn hàng nào</p>
        )}
      </div>
    </div>
  );
}
