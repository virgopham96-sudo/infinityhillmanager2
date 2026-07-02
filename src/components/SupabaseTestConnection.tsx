import { useState } from "react";
import { fetchRoomsFromSupabase, isSupabaseConfigured } from "../supabase";
import { Room } from "../types";
import { RefreshCw, CheckCircle2, XCircle, ShieldAlert, List, Hotel } from "lucide-react";

export default function SupabaseTestConnection() {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    rooms?: Room[];
  }>({ status: "idle", message: "" });

  const hasConfig = isSupabaseConfigured();

  const handleTestConnection = async () => {
    if (!hasConfig) {
      setTestResult({
        status: "error",
        message: "Chưa cấu hình Supabase URL hoặc API Key. Vui lòng thêm các khóa này vào tệp .env hoặc cấu hình ứng dụng.",
      });
      return;
    }

    setLoading(true);
    setTestResult({ status: "idle", message: "" });

    try {
      // Fetch rooms from Supabase
      const fetchedRooms = await fetchRoomsFromSupabase();
      
      setTestResult({
        status: "success",
        message: `Kết nối thành công! Đã tải về thành công ${fetchedRooms.length} phòng ngủ từ bảng 'rooms' trên Supabase.`,
        rooms: fetchedRooms,
      });
    } catch (err: any) {
      console.error("Supabase connection test failed:", err);
      let errorMsg = err?.message || String(err);
      
      if (errorMsg.includes("relation") && errorMsg.includes("does not exist")) {
        errorMsg = "Lỗi: Bảng 'rooms' chưa được khởi tạo trên Supabase. Bạn hãy mở tab 'SQL Editor' trên trang quản trị Supabase, copy toàn bộ mã SQL trong file '/supabase_schema.sql' ở dự án này và bấm RUN để tạo bảng nhé.";
      } else if (errorMsg.includes("fetch")) {
        errorMsg = "Lỗi kết nối mạng: Không thể truy cập tới Supabase URL. Vui lòng kiểm tra lại URL của bạn.";
      } else if (errorMsg.includes("invalid-api-key") || errorMsg.includes("Invalid API key")) {
        errorMsg = "Lỗi API Key: Khóa Anon Key cung cấp không hợp lệ hoặc đã hết hạn. Hãy đối chiếu chính xác khóa anon key.";
      }

      setTestResult({
        status: "error",
        message: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4.5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hotel className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Công cụ kiểm định kết nối</span>
        </div>
        <button
          type="button"
          disabled={loading || !hasConfig}
          onClick={handleTestConnection}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            hasConfig && !loading
              ? "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 cursor-pointer"
              : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Đang truy vấn..." : "Test kết nối"}
        </button>
      </div>

      {testResult.status === "success" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">{testResult.message}</span>
            </div>
          </div>

          {testResult.rooms && testResult.rooms.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1">
                <List className="w-3.5 h-3.5" />
                <span>Xem trước dữ liệu phòng ngủ thực tế từ Supabase ({testResult.rooms.length}):</span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-200/60 dark:border-slate-800/80 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 scrollbar-thin">
                {testResult.rooms.map((room) => (
                  <div key={room.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Room {room.id}</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                        Tầng {room.floor} - {room.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {room.weekdayPrice.toLocaleString()}đ
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        room.status === "available"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : room.status === "occupied"
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : room.status === "reserved"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-slate-500/15 text-slate-500 dark:text-slate-400"
                      }`}>
                        {room.status === "available" ? "Sẵn sàng" : room.status === "occupied" ? "Đang ở" : room.status === "reserved" ? "Đặt trước" : "Bảo trì"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/60 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
              Cơ sở dữ liệu trống. Hãy nhấn nút <b>"Đồng bộ dữ liệu sang Supabase"</b> phía trên để chuyển thông tin từ ứng dụng sang!
            </div>
          )}
        </div>
      )}

      {testResult.status === "error" && (
        <div className="flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-800 dark:text-rose-400 leading-relaxed">
          <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Kiểm thử kết nối thất bại:</span>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-normal break-words">{testResult.message}</p>
          </div>
        </div>
      )}

      {testResult.status === "idle" && !loading && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-normal italic">
          Bấm nút "Test kết nối" phía trên để thực hiện gửi truy vấn mẫu lấy danh sách phòng ngủ và chẩn đoán cấu hình Supabase.
        </p>
      )}
    </div>
  );
}
