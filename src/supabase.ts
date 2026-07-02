import { createClient } from "@supabase/supabase-js";
import { Room, BookingRecord } from "./types";

const supabaseUrl = (((import.meta as any).env.VITE_SUPABASE_URL || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL || "").trim());
const supabaseAnonKey = (((import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "").trim());

// Lazy initialize so the app doesn't crash on start if envs are missing
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Check if the Supabase client is properly configured with environment variables
 */
export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

/**
 * Format camelCase objects into snake_case database rows for rooms table
 */
function mapRoomToDb(room: Room) {
  return {
    id: room.id,
    floor: room.floor,
    type: room.type,
    status: room.status,
    guest_name: room.guestName || null,
    check_in_time: room.checkInTime || null,
    check_out_time: room.checkOutTime || null,
    weekday_price: room.weekdayPrice,
    weekend_price: room.weekendPrice,
    deposit: room.deposit || null,
    notes: room.notes || null,
    reservations: room.reservations || [],
    is_flexible_price: room.isFlexiblePrice || false,
    flexible_price: room.flexiblePrice || null,
  };
}

/**
 * Format snake_case database rows into camelCase objects for Room type
 */
function mapDbToRoom(row: any): Room {
  return {
    id: row.id,
    floor: row.floor,
    type: row.type,
    status: row.status,
    guestName: row.guest_name || undefined,
    checkInTime: row.check_in_time || undefined,
    checkOutTime: row.check_out_time || undefined,
    weekdayPrice: row.weekday_price,
    weekendPrice: row.weekend_price,
    deposit: row.deposit !== null ? row.deposit : undefined,
    notes: row.notes || undefined,
    reservations: Array.isArray(row.reservations) ? row.reservations : [],
    isFlexiblePrice: !!row.is_flexible_price,
    flexiblePrice: row.flexible_price !== null ? row.flexible_price : undefined,
  };
}

/**
 * Format camelCase objects into snake_case database rows for bookings table
 */
function mapBookingToDb(booking: BookingRecord) {
  return {
    id: booking.id,
    room_id: booking.roomId,
    guest_name: booking.guestName,
    check_in: booking.checkIn,
    check_out: booking.checkOut,
    total_price: booking.totalPrice,
    status: booking.status,
    created_at: booking.createdAt,
    notes: booking.notes || null,
    checkout_details: booking.checkoutDetails || null,
  };
}

/**
 * Format snake_case database rows into camelCase objects for BookingRecord type
 */
function mapDbToBooking(row: any): BookingRecord {
  return {
    id: row.id,
    roomId: row.room_id,
    guestName: row.guest_name,
    checkIn: row.check_in,
    checkOut: row.check_out,
    totalPrice: row.total_price,
    status: row.status as "active" | "completed" | "cancelled",
    createdAt: row.created_at,
    notes: row.notes || undefined,
    checkoutDetails: row.checkout_details || undefined,
  };
}

/**
 * Fetch all rooms from Supabase
 */
export async function fetchRoomsFromSupabase(): Promise<Room[]> {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .order("floor", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching rooms from Supabase:", error);
    throw error;
  }

  return (data || []).map(mapDbToRoom);
}

/**
 * Fetch all bookings from Supabase
 */
export async function fetchBookingsFromSupabase(): Promise<BookingRecord[]> {
  if (!supabase) throw new Error("Supabase is not configured yet.");

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bookings from Supabase:", error);
    throw error;
  }

  return (data || []).map(mapDbToBooking);
}

/**
 * Save or update a single room in Supabase
 */
export async function saveRoomToSupabase(room: Room): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured yet.");

  const row = mapRoomToDb(room);
  const { error } = await supabase
    .from("rooms")
    .upsert(row);

  if (error) {
    console.error(`Error saving room ${room.id} to Supabase:`, error);
    throw error;
  }
}

/**
 * Save or update multiple rooms in Supabase (bulk operation)
 */
export async function saveMultipleRoomsToSupabase(rooms: Room[]): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  if (rooms.length === 0) return;

  const rows = rooms.map(mapRoomToDb);
  const { error } = await supabase
    .from("rooms")
    .upsert(rows);

  if (error) {
    console.error("Error saving multiple rooms to Supabase:", error);
    throw error;
  }
}

/**
 * Save or update a booking in Supabase
 */
export async function saveBookingToSupabase(booking: BookingRecord): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured yet.");

  const row = mapBookingToDb(booking);
  const { error } = await supabase
    .from("bookings")
    .upsert(row);

  if (error) {
    console.error(`Error saving booking ${booking.id} to Supabase:`, error);
    throw error;
  }
}

/**
 * Delete a booking from Supabase
 */
export async function deleteBookingFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured yet.");

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting booking ${id} from Supabase:`, error);
    throw error;
  }
}

/**
 * Sync both rooms and bookings in bulk to Supabase (data migration helper)
 */
export async function syncDataToSupabase(rooms: Room[], bookings: BookingRecord[]): Promise<{ success: boolean; roomsSynced: number; bookingsSynced: number }> {
  if (!supabase) throw new Error("Supabase is not configured yet.");

  try {
    // 1. Sync Rooms
    if (rooms.length > 0) {
      const roomRows = rooms.map(mapRoomToDb);
      const { error: roomError } = await supabase
        .from("rooms")
        .upsert(roomRows);
      
      if (roomError) throw new Error(`Lỗi đồng bộ phòng: ${roomError.message}`);
    }

    // 2. Sync Bookings
    if (bookings.length > 0) {
      const bookingRows = bookings.map(mapBookingToDb);
      const { error: bookingError } = await supabase
        .from("bookings")
        .upsert(bookingRows);

      if (bookingError) throw new Error(`Lỗi đồng bộ đặt phòng: ${bookingError.message}`);
    }

    return {
      success: true,
      roomsSynced: rooms.length,
      bookingsSynced: bookings.length
    };
  } catch (err: any) {
    console.error("Error performing bulk migration to Supabase:", err);
    throw err;
  }
}
