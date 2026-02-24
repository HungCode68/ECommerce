import { useState, useEffect } from 'react';
import { orderApi } from '../../api';

const ORDER_STATUS = {
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

export default function OrderListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [currentPage, filterStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getAll({ 
        page: currentPage, 
        limit: 10,
        status: filterStatus || undefined 
      });
      if (res.data.data) {
        setOrders(res.data.data.orders || []);
        setTotalPages(Math.ceil((res.data.data.total || 0) / 10));
      }
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      alert('Cập nhật trạng thái thất bại');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
        
        {/* Filter */}
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUS).map(([key, value]) => (
            <option key={key} value={key}>{value.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : orders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Mã đơn</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Khách hàng</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tổng tiền</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ngày đặt</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">#{order.id}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{order.customer_name || `User #${order.user_id}`}</div>
                        <div className="text-xs text-gray-500">{order.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ORDER_STATUS[order.status]?.color || 'bg-gray-100 text-gray-700'
                        }`}>
                          {ORDER_STATUS[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Trang {currentPage} / {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">Không có đơn hàng nào</div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Đơn hàng #{selectedOrder.id}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Khách hàng</p>
                  <p className="font-medium">{selectedOrder.customer_name || `User #${selectedOrder.user_id}`}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng tiền</p>
                  <p className="font-medium text-green-600">{formatCurrency(selectedOrder.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày đặt</p>
                  <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái hiện tại</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    ORDER_STATUS[selectedOrder.status]?.color || 'bg-gray-100'
                  }`}>
                    {ORDER_STATUS[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Update Status */}
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Cập nhật trạng thái</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ORDER_STATUS).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => handleUpdateStatus(selectedOrder.id, key)}
                      disabled={selectedOrder.status === key}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                        selectedOrder.status === key
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {value.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Sản phẩm</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-500">x{item.quantity}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
