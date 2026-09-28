const API_BASE = '/api/v1';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    window.dispatchEvent(new Event('auth-changed'));
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-changed'));
  }
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('auth-changed'));
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default content-type to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Request failed: ${res.statusText}`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.detail || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.access_token);
    setStoredUser(res.user);
    return res;
  },

  register: async (email: string, password: string, full_name: string, phone?: string) => {
    const res = await request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, phone }),
    });
    setAuthToken(res.access_token);
    setStoredUser(res.user);
    return res;
  },

  getMe: () => request<any>('/auth/me'),

  // Student
  getStudentProfile: () => request<any>('/student/profile'),
  updateStudentProfile: (data: any) => request<any>('/student/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  uploadStudentDocument: (formData: FormData) => request<any>('/student/documents/upload', {
    method: 'POST',
    body: formData,
  }),
  getStudentDashboard: () => request<any>('/student/dashboard'),

  // Schemes
  getSchemes: () => request<any[]>('/schemes'),
  discoverSchemes: () => request<any[]>('/schemes/discovery'),
  checkSchemeEligibility: (schemeCode: string) => request<any>(`/schemes/${schemeCode}/eligibility`),

  // Applications
  createApplication: (schemeCode: string, schemeSpecificData?: any) => request<any>('/applications', {
    method: 'POST',
    body: JSON.stringify({
      scheme_code: schemeCode,
      scheme_specific_data: schemeSpecificData,
    }),
  }),
  getMyApplications: () => request<any[]>('/applications'),
  getApplicationDetail: (appId: string) => request<any>(`/applications/${appId}`),
  resubmitDeficientDocument: (appId: string, formData: FormData) => request<any>(`/applications/${appId}/resubmit-deficient-document`, {
    method: 'POST',
    body: formData,
  }),

  // DigiLocker
  startDigiLockerSession: (applicationId: string) => request<any>(`/digilocker/start?application_id=${applicationId}`),
  processDigiLockerConsent: (applicationId: string, simulateBranch: string = 'BRANCH_A') => request<any>('/digilocker/process-consent', {
    method: 'POST',
    body: JSON.stringify({
      application_id: applicationId,
      consent_given: true,
      simulate_branch: simulateBranch,
    }),
  }),

  // Officer
  getOfficerDashboardStats: () => request<any>('/officer/dashboard'),
  getOfficerApplications: (params?: { filter_status?: string; scheme_code?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.filter_status) q.append('filter_status', params.filter_status);
    if (params?.scheme_code) q.append('scheme_code', params.scheme_code);
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return request<any>(`/officer/applications?${q.toString()}`);
  },
  recordOfficerReview: (appId: string, decision: string, remarks: string, defDoc?: string, defDesc?: string) => request<any>(`/officer/applications/${appId}/review`, {
    method: 'POST',
    body: JSON.stringify({
      decision,
      remarks,
      deficiency_document_type: defDoc,
      deficiency_description: defDesc,
    }),
  }),

  // Admin
  getAdminSchemes: () => request<any[]>('/admin/schemes'),
  updateSchemeConfig: (schemeId: number, data: any) => request<any>(`/admin/schemes/${schemeId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getAdminUsers: (role?: string) => request<any[]>(`/admin/users${role ? `?role=${role}` : ''}`),
  toggleUserStatus: (userId: number) => request<any>(`/admin/users/${userId}/toggle-active`, {
    method: 'PUT',
  }),
  getAuditLogs: (params?: { action?: string; role?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.action) q.append('action', params.action);
    if (params?.role) q.append('role', params.role);
    if (params?.limit) q.append('limit', String(params.limit));
    return request<any[]>(`/admin/audit?${q.toString()}`);
  },

  // Analytics
  getAnalyticsSummary: () => request<any>('/analytics/summary'),
};
