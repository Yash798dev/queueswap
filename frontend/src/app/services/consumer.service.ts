import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface ActiveQueue {
    _id: string;
    businessId: {
        _id: string;
        name: string;
        category: string;
        location: string;
    };
    tokenNumber: number;
    status: string;
    peopleAhead: number;
    estimatedWaitMins: number;
}

export interface UserDashboard {
    activeQueues: ActiveQueue[];
    walletBalance: number;
    recentTransactions: any[];
    badges: {
        levelName: string;
        progress: number;
        earned: string[];
    };
}

@Injectable({
    providedIn: 'root'
})
export class ConsumerService {
    private apiUrl = 'https://queueswap-backend.onrender.com/api';
    // private apiUrl = 'http://localhost:5000/api'; // Useful for local dev

    constructor(private http: HttpClient) { }

    getUserDashboard(email: string): Observable<UserDashboard> {
        return this.http.get<UserDashboard>(`${this.apiUrl}/user/dashboard/${email}`)
            .pipe(catchError(this.handleError));
    }

    exploreBusinesses(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/business/explore`)
            .pipe(catchError(this.handleError));
    }

    getTrendingBusinesses(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/business/trending`)
            .pipe(catchError(this.handleError));
    }

    remoteJoinQueue(businessId: string, userData: { name: string, email: string, mobile: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/business/${businessId}/queue/remote-join`, userData)
            .pipe(catchError(this.handleError));
    }

    private handleError(error: any) {
        console.error('Consumer API Error:', error);
        return throwError(() => error);
    }
}
