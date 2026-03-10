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

const client = axios.create({
  baseURL: '/cognitive',
  headers: {
    'Content-Type': 'application/json',
  },
});

const authClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to both clients
export const setAuthToken = (token: string | null) => {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    authClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  } else {
    delete client.defaults.headers.common['Authorization'];
    delete authClient.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }
};

// Load token from localStorage on init
const savedToken = localStorage.getItem('auth_token');
if (savedToken) {
  setAuthToken(savedToken);
}

// Handle 401 errors on both clients
const handle401 = (error: any) => {
  if (error.response?.status === 401) {
    setAuthToken(null);
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};
client.interceptors.response.use((r) => r, handle401);
authClient.interceptors.response.use((r) => r, handle401);

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

// Auth API — login/register go to profile-builder via gateway /api/auth
export const authApi = {
  register: async (userData: UserCreate): Promise<Token> => {
    const response = await authClient.post<Token>('/api/auth/register', {
      email: userData.email,
      password: userData.password,
      fullName: userData.username,
    });
    return response.data;
  },
  login: async (credentials: UserLogin): Promise<Token> => {
    const response = await authClient.post<Token>('/api/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await client.get<User>('/auth/me');
    return response.data;
  },
};

