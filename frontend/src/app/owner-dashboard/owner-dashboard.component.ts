import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-owner-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './owner-dashboard.component.html',
    styleUrls: ['./owner-dashboard.component.css']
})
export class OwnerDashboardComponent implements OnInit {
    user: any = null;
    business: any = null;
    isLoading: boolean = true;

    constructor(
        private authService: AuthService,
        private router: Router,
        private http: HttpClient,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            this.user = JSON.parse(userStr);
            this.loadBusinessInfo();
        }
    }

    loadBusinessInfo() {
        const apiUrl = `https://queueswap-backend.onrender.com/api/business/pending`;

        this.http.get<any[]>(apiUrl).subscribe({
            next: (businesses) => {
                // Find the approved business for this user
                this.business = businesses.find(b =>
                    b.userId === this.user._id || b.userId === this.user.id && b.status === 'Approved'
                );
                this.isLoading = false;
                this.cd.detectChanges();
            },
            error: (err) => {
                console.error('[OwnerDashboard] Error loading business:', err);
                this.isLoading = false;
                this.cd.detectChanges();
            }
        });
    }

    goToQueueManagement() {
        this.router.navigate(['/business-queue']);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
