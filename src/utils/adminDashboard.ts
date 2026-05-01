/**
 * Lấy chữ cái đầu của tên để hiển thị Avatar
 */
export const getInitials = (name: string | number): string => {
  if (!name) return '??';
  const strName = String(name);
  const parts = strName.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Lấy màu sắc ngẫu nhiên dựa trên tên người dùng
 */
export const getAvatarColor = (name: string | number): string => {
  const strName = String(name || '');
  const colors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
  ];
  
  let hash = 0;
  for (let i = 0; i < strName.length; i++) {
    hash = strName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Định dạng tiền tệ VNĐ
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

/**
 * Định dạng tiền tệ ngắn gọn (ví dụ: 1M, 10k)
 */
export const formatShortCurrency = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'k';
  }
  return value.toString();
};
