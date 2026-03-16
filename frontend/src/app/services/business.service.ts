import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { timeout, catchError, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class BusinessService {
    private apiUrl = 'https://queueswap-production.up.railway.app/api/business';

    constructor(private http: HttpClient) { }

    submit(data: any): Observable<any> {
        console.log('[BusinessService] Sending submit request:', data);
        return this.http.post(`${this.apiUrl}/submit`, data).pipe(
            tap(res => console.log('[BusinessService] Received response:', res)),
            timeout(5000),
            catchError(this.handleError)
        );
    }

    getPending(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/pending`).pipe(
            timeout(5000),
            catchError(this.handleError)
        );
    }

    updateStatus(id: string, status: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/status`, { status }).pipe(
            timeout(5000),
            catchError(this.handleError)
        );
    }

    private handleError(error: any) {
        if (error.name === 'TimeoutError') {
            return throwError(() => ({ error: { message: 'Request timed out. Please check your internet connection or try again later.' } }));
        }
        return throwError(() => error);
    }
}
