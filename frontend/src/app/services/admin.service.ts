import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// Directly using string or relative path, let's just use string to avoid missing environment import

export interface AdminAnalytics {
  platform: {
    users: number;
    owners: number;
    approvedBusinesses: number;
    pendingBusinesses: number;
    swapsCompleted: number;
    swapsRequested: number;
    totalServed: number;
    totalWaiting: number;
  };
  businessStats: Array<{
    _id: string;
    name: string;
    category: string;
    location: string;
    ownerName: string;
    ownerEmail: string;
    currentlyWaiting: number;
    totalServed: number;
    swapsCompleted: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  // Hardcode for Render fallback, or localhost
  private apiUrl = 'https://queueswap-backend.onrender.com/api';

  constructor(private http: HttpClient) {}

  getAnalytics(): Observable<AdminAnalytics> {
    return this.http.get<AdminAnalytics>(`${this.apiUrl}/admin/analytics`);
  }
}
