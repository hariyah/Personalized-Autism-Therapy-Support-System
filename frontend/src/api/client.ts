import axios from 'axios';
import type {
  ChildProfile,
  ChildProfileCreate,
  RecommendationRequest,
  RecommendationResponse,
  ActivityOutcome,
  ActivityOutcomeCreate,
  User,
  UserCreate,
  UserLogin,
  Token,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  } else {
    delete client.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }
};

// Load token from localStorage on init
const savedToken = localStorage.getItem('auth_token');
if (savedToken) {
  setAuthToken(savedToken);
}

// Handle 401 errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Profiles API
export const profilesApi = {
  getAll: async (): Promise<ChildProfile[]> => {
    const response = await client.get<ChildProfile[]>('/profiles');
    return response.data;
  },
  getById: async (id: string): Promise<ChildProfile> => {
    const response = await client.get<ChildProfile>(`/profiles/${id}`);
    return response.data;
  },
  create: async (profile: ChildProfileCreate): Promise<ChildProfile> => {
    const response = await client.post<ChildProfile>('/profiles', profile);
    return response.data;
  },
  update: async (id: string, profile: Partial<ChildProfileCreate>): Promise<ChildProfile> => {
    const response = await client.put<ChildProfile>(`/profiles/${id}`, profile);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/profiles/${id}`);
  },
};

// Recommendations API
export const recommendationsApi = {
  getRecommendations: async (request: RecommendationRequest): Promise<RecommendationResponse> => {
    const response = await client.post<RecommendationResponse>('/recommend', request);
    return response.data;
  },
  getMaterials: async (): Promise<string[]> => {
    const response = await client.get<string[]>('/recommend/materials');
    return response.data;
  },
};

// Outcomes API
export const outcomesApi = {
  getAll: async (profileId?: string, activityId?: string): Promise<ActivityOutcome[]> => {
    const params: Record<string, string> = {};
    if (profileId) params.profile_id = profileId;
    if (activityId) params.activity_id = activityId;
    const response = await client.get<ActivityOutcome[]>('/outcomes', { params });
    return response.data;
  },
  create: async (outcome: ActivityOutcomeCreate): Promise<ActivityOutcome> => {
    const response = await client.post<ActivityOutcome>('/outcomes', outcome);
    return response.data;
  },
};

// Auth API
export const authApi = {
  register: async (userData: UserCreate): Promise<User> => {
    const response = await client.post<User>('/auth/register', userData);
    return response.data;
  },
  login: async (credentials: UserLogin): Promise<Token> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    const response = await client.post<Token>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await client.get<User>('/auth/me');
    return response.data;
  },
};

