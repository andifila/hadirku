export type PlanType = "free" | "premium";
export type RsvpStatus = "pending" | "attending" | "not_attending";
export type BankAccount = { bank: string; account_name: string; account_number: string };

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          plan: PlanType;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          plan?: PlanType;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          plan?: PlanType;
        };
        Relationships: [];
      };
      templates: {
        Row: {
          id: string;
          name: string;
          slug: string;
          thumbnail_url: string;
          is_premium: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          thumbnail_url?: string;
          is_premium?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          thumbnail_url?: string;
          is_premium?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          user_id: string;
          template_id: string;
          slug: string;
          // Mempelai
          bride_name: string;
          bride_father_name: string | null;
          bride_mother_name: string | null;
          groom_name: string;
          groom_father_name: string | null;
          groom_mother_name: string | null;
          // Resepsi (main event)
          event_date: string;
          event_time: string;
          venue_name: string;
          venue_address: string;
          // Akad (optional second event)
          akad_date: string | null;
          akad_time: string | null;
          akad_venue_name: string | null;
          akad_venue_address: string | null;
          // Konten
          dresscode: string | null;
          custom_message: string | null;
          // Media
          cover_image_url: string | null;
          music_url: string | null;
          gallery_url_1: string | null;
          gallery_url_2: string | null;
          gallery_url_3: string | null;
          // Angpao
          bank_accounts: BankAccount[] | null;
          // Status
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id: string;
          slug: string;
          bride_name: string;
          bride_father_name?: string | null;
          bride_mother_name?: string | null;
          groom_name: string;
          groom_father_name?: string | null;
          groom_mother_name?: string | null;
          event_date: string;
          event_time: string;
          venue_name: string;
          venue_address: string;
          akad_date?: string | null;
          akad_time?: string | null;
          akad_venue_name?: string | null;
          akad_venue_address?: string | null;
          dresscode?: string | null;
          custom_message?: string | null;
          cover_image_url?: string | null;
          music_url?: string | null;
          gallery_url_1?: string | null;
          gallery_url_2?: string | null;
          gallery_url_3?: string | null;
          bank_accounts?: BankAccount[] | null;
          is_published?: boolean;
        };
        Update: {
          template_id?: string;
          slug?: string;
          bride_name?: string;
          bride_father_name?: string | null;
          bride_mother_name?: string | null;
          groom_name?: string;
          groom_father_name?: string | null;
          groom_mother_name?: string | null;
          event_date?: string;
          event_time?: string;
          venue_name?: string;
          venue_address?: string;
          akad_date?: string | null;
          akad_time?: string | null;
          akad_venue_name?: string | null;
          akad_venue_address?: string | null;
          dresscode?: string | null;
          custom_message?: string | null;
          cover_image_url?: string | null;
          music_url?: string | null;
          gallery_url_1?: string | null;
          gallery_url_2?: string | null;
          gallery_url_3?: string | null;
          bank_accounts?: BankAccount[] | null;
          is_published?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
        ];
      };
      guests: {
        Row: {
          id: string;
          invitation_id: string;
          name: string;
          phone: string | null;
          rsvp_status: RsvpStatus;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invitation_id: string;
          name: string;
          phone?: string | null;
          rsvp_status?: RsvpStatus;
          message?: string | null;
        };
        Update: {
          rsvp_status?: RsvpStatus;
          message?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "guests_invitation_id_fkey";
            columns: ["invitation_id"];
            isOneToOne: false;
            referencedRelation: "invitations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      invitation_stats: {
        Row: {
          invitation_id: string;
          user_id: string;
          slug: string;
          bride_name: string;
          groom_name: string;
          event_date: string;
          is_published: boolean;
          total_guests: number;
          attending: number;
          not_attending: number;
          pending: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      plan_type: PlanType;
      rsvp_status: RsvpStatus;
    };
  };
};
