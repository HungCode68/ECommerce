# Import `du_lieu_5_cap.json`

Command:

```bash
go run ./cmd/import_du_lieu_5_cap
```

Các cờ hỗ trợ:

```bash
go run ./cmd/import_du_lieu_5_cap --dry-run
go run ./cmd/import_du_lieu_5_cap --limit 20
go run ./cmd/import_du_lieu_5_cap --truncate
go run ./cmd/import_du_lieu_5_cap --source du_lieu_5_cap.json --truncate
```

Tool này sẽ:

- map category nguồn sang category trong DB
- tạo sản phẩm với `thumbnail_url` là ảnh đầu tiên
- tạo variant từ toàn bộ ảnh còn trong từng record
- tự sinh giá, giảm giá, tồn kho và thông số variant

Map category đang dùng:

- `phonesmart` -> `dien-thoai`
- `Smart_Watch` -> `dong-ho-thong-minh`
- `Laptop` -> `laptop`
- `tablet` -> `may-tinh-bang`
- `accessory` -> `phu-kien`

Lưu ý:

- `--truncate` sẽ xóa toàn bộ sản phẩm hiện có trước khi import
- tool import trực tiếp vào DB, không đi qua màn hình admin
- luồng import CSV hiện tại của admin chưa hỗ trợ variant và ảnh variant
