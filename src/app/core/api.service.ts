import { Injectable } from '@angular/core';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private csrfToken: string | null = null;
  private csrfRequest: Promise<string> | null = null;
  private csrfEpoch = 0;

  async refreshCsrf(): Promise<void> {
    this.csrfEpoch++;
    this.csrfToken = null;
    this.csrfRequest = null;
    await this.csrf();
  }

  private csrf(): Promise<string> {
    if (this.csrfToken) return Promise.resolve(this.csrfToken);
    if (!this.csrfRequest) {
      const epoch = this.csrfEpoch;
      this.csrfRequest = this.get<{ token: string }>('/api/csrf')
        .then(result => {
          if (epoch !== this.csrfEpoch) return this.csrf();
          this.csrfToken = result.token;
          return result.token;
        })
        .finally(() => { if (epoch === this.csrfEpoch) this.csrfRequest = null; });
    }
    return this.csrfRequest;
  }

  get<T>(path: string): Promise<T> { return this.request<T>(path); }

  async mutate<T>(method: 'POST' | 'PUT', path: string, body: unknown = {}): Promise<T> {
    const epoch = this.csrfEpoch;
    const token = await this.csrf();
    if (epoch !== this.csrfEpoch) throw new ApiError('Your session changed. Please try the action again.', 409);
    return this.request<T>(path, {
      method, headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(path, { ...init, credentials: 'same-origin', cache: 'no-store' });
    } catch {
      throw new ApiError('Cannot reach the city. Check your connection and try again.', 0);
    }
    if (response.status === 204) return undefined as T;
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message : response.status === 401 ? 'Please sign in again to continue.'
        : 'That action could not be completed. Please try again.';
      throw new ApiError(message, response.status);
    }
    return data as T;
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
