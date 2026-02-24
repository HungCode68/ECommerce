import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productApi, categoryApi } from '../../api';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    image: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getAll();
      if (res.data.data) {
        setCategories(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  };

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await productApi.getById(id);
      if (res.data.data) {
        setForm({
          name: res.data.data.name || '',
          description: res.data.data.description || '',
          price: res.data.data.price?.toString() || '',
          stock: res.data.data.stock?.toString() || '',
          category_id: res.data.data.category_id?.toString() || '',
          image: res.data.data.image || '',
        });
      }
    } catch (error) {
      alert('Không tìm thấy sản phẩm');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Tên sản phẩm là bắt buộc';
    if (!form.price || parseFloat(form.price) <= 0) newErrors.price = 'Giá phải lớn hơn 0';
    if (!form.stock || parseInt(form.stock) < 0) newErrors.stock = 'Số lượng không hợp lệ';
    if (!form.category_id) newErrors.category_id = 'Vui lòng chọn danh mục';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        category_id: parseInt(form.category_id),
        image: form.image,
      };

      if (isEdit) {
        await productApi.update(id, data);
      } else {
        await productApi.create(data);
      }
      
      navigate('/products');
    } catch (error) {
      alert('Lưu sản phẩm thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên sản phẩm *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập tên sản phẩm"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Danh mục *
          </label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              errors.category_id ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Chọn danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
        </div>

        {/* Price & Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá (VNĐ) *
            </label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
              min="0"
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng tồn kho *
            </label>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                errors.stock ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
              min="0"
            />
            {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link hình ảnh
          </label>
          <input
            type="text"
            name="image"
            value={form.image}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Nhập mô tả sản phẩm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm mới'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
