-- === INFINITY HILL MANAGER: SQL SCHEMA FOR SUPABASE ===
-- Hướng dẫn: Coppy toàn bộ mã SQL dưới đây và dán vào phần "SQL Editor" trên giao diện Supabase Dashboard của bạn, sau đó nhấn "Run".

-- 1. Tạo bảng quản lý danh sách phòng ngủ (rooms)
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,                       -- Số phòng (Ví dụ: "101", "102")
  floor INT4 NOT NULL,                       -- Tầng (1, 2, 3, 4)
  type TEXT NOT NULL,                        -- Loại phòng (G1, G2, G3, G2V, G1V)
  status TEXT NOT NULL,                      -- Trạng thái hiện tại (available, occupied, reserved, maintenance)
  guest_name TEXT,                           -- Tên khách đang ở (nếu có)
  check_in_time TEXT,                        -- Thời gian Check-in (ISO String)
  check_out_time TEXT,                       -- Thời gian Check-out dự kiến (ISO String)
  weekday_price INT4 NOT NULL,               -- Giá ngày thường (VNĐ)
  weekend_price INT4 NOT NULL,               -- Giá cuối tuần (VNĐ)
  deposit INT4,                              -- Tiền đặt cọc (VNĐ)
  notes TEXT,                                -- Ghi chú phòng
  reservations JSONB DEFAULT '[]'::jsonb,    -- Lịch đặt trước trong tương lai (Mảng đối tượng JSON)
  is_flexible_price BOOLEAN DEFAULT false,   -- Áp dụng giá thỏa thuận linh hoạt
  flexible_price INT4,                       -- Giá linh hoạt thỏa thuận (VNĐ)
  updated_at TIMESTAMPTZ DEFAULT now()       -- Thời điểm cập nhật cuối cùng
);

-- 2. Tạo bảng lưu trữ lịch sử đặt phòng & giao dịch thanh toán (bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,                       -- Mã đặt phòng (UUID hoặc chuỗi ngẫu nhiên)
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE, -- Số phòng liên kết
  guest_name TEXT NOT NULL,                  -- Tên khách hàng đặt phòng
  check_in TEXT NOT NULL,                    -- Thời gian Check-in thực tế (ISO String)
  check_out TEXT NOT NULL,                   -- Thời gian Check-out thực tế (ISO String)
  total_price INT4 NOT NULL,                 -- Tổng tiền thanh toán (VNĐ)
  status TEXT NOT NULL,                      -- Trạng thái thanh toán (active, completed, cancelled)
  created_at TEXT NOT NULL,                  -- Thời gian tạo hóa đơn đặt phòng
  notes TEXT,                                -- Ghi chú hóa đơn
  checkout_details JSONB,                    -- Chi tiết minibar, đền bù, tiền phòng cụ thể (Đối tượng JSON)
  updated_at TIMESTAMPTZ DEFAULT now()       -- Thời điểm cập nhật hóa đơn
);

-- 3. Tạo Indexes để tăng tốc độ truy vấn tìm kiếm và lọc dữ liệu
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON public.rooms(floor);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- 4. Bật hoặc tắt Row Level Security (RLS) tùy theo mục đích sử dụng.
-- Để đơn giản trong quá trình kết nối từ ứng dụng Client, bạn có thể TẮT RLS bằng lệnh dưới đây:
ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- HOẶC nếu muốn bật RLS bảo mật, hãy tạo các Policy cho phép truy cập Public (Đọc/Ghi tự do):
-- ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read/write rooms" ON public.rooms FOR ALL TO public USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow public read/write bookings" ON public.bookings FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. Cho phép Client can thiệp Realtime thông qua Supabase Replication (Tùy chọn)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
