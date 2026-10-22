import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NoticeService {
  readonly notice = signal<{ text: string; kind: 'success' | 'error' } | null>(null);
  private timeout?: ReturnType<typeof setTimeout>;
  show(text: string, kind: 'success' | 'error' = 'success'): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.notice.set({ text, kind });
    this.timeout = setTimeout(() => this.notice.set(null), kind === 'error' ? 10000 : 5000);
  }
}
