export interface EventTag {
  id: string;
  name: string;
}

export interface EventMedia {
  id?: string;
  event_id?: string;
  url: string;
  public_id?: string;
  type: "IMAGE" | "VIDEO";
  sort_order?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  start_time: Date | string;
  end_time: Date | string;
  location: string;
  capacity?: number | null;
  is_private: boolean;
  creator_id: string;
  media?: EventMedia[];
  created_at: Date | string;
  updated_at?: Date | string;
}

export interface EventWithDetails extends Event {
  tags?: EventTag[];
  attending_count: number;
  remaining_spots: number | null;
  is_full: boolean;
}

export interface EventPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedEventsResponse {
  events: EventWithDetails[];
  pagination: EventPaginationMeta;
}
