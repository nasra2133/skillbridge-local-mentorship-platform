import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  role: 'mentor' | 'learner' | 'org' | 'admin';
  name: string;
  photo_url: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  languages: string[];
  is_under_18: boolean;
  created_at: string;
};

export type MentorDetail = {
  profile_id: string;
  trade: string;
  years_experience: number;
  support_types: string[];
  cost_type: 'free' | 'paid' | 'swap';
  price: number | null;
  formats: string[];
  max_learners: number;
  verified: boolean;
  category: string | null;
};

export type MentorCard = {
  profile: Profile;
  detail: MentorDetail;
  skills: string[];
  rating: number | null;
  reviewCount: number;
};

export type MentorshipRequest = {
  id: string;
  learner_id: string;
  mentor_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  created_at: string;
};

export type Session = {
  id: string;
  request_id: string | null;
  mentor_id: string;
  learner_id: string;
  start_time: string;
  format: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
};

export type Opportunity = {
  id: string;
  poster_id: string;
  title: string;
  description: string;
  skills: string[];
  duration: string | null;
  location: string | null;
  apply_instructions: string;
  status: 'open' | 'closed';
  created_at: string;
};

export type SuccessStory = {
  id: string;
  author_id: string;
  title: string;
  story: string;
  photo_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export type Review = {
  id: string;
  session_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
};
