import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { tap, timeout, catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'https://queueswap-production.up.railway.app/api/auth';
    private tokenKey = 'queue_swap_token';

    constructor(private http: HttpClient) { }

    register(user: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, user).pipe(
            timeout(5000),
            catchError(this.handleError)
        );
    }

    login(credentials: any): Observable<any> {
        return this.http.post<{ token: string, user: any }>(`${this.apiUrl}/login`, credentials)
            .pipe(
                timeout(5000),
                tap(response => {
                    if (response.token) {
                        this.saveToken(response.token);
                        // Optionally save user details
                        localStorage.setItem('user', JSON.stringify(response.user));
                    }
                }),
                catchError(this.handleError)
            );
    }

    verify(token: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/verify/${token}`).pipe(
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

    saveToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem('user');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    getUser(): any {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    isAdmin(): boolean {
        const user = this.getUser();
        return user?.role === 'admin';
    }

    getUserRole(): string | null {
        const user = this.getUser();
        return user?.role || 'user';
    }
}
