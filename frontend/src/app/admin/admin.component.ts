import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BusinessService } from '../services/business.service';
import { AdminService, AdminAnalytics } from '../services/admin.service';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
    activeTab: 'approvals' | 'analytics' | 'revenue' = 'analytics';
    pendingBusinesses: any[] = [];
    analyticsData: AdminAnalytics | null = null;
    
    loadingApprovals = true;
    loadingAnalytics = true;

    // Revenue state
    revenueData: any = null;
    loadingRevenue = false;

    constructor(
        private businessService: BusinessService,
        private adminService: AdminService,
        private authService: AuthService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadAnalytics();
        this.loadPendingBusinesses();
    }

    setTab(tab: 'approvals' | 'analytics' | 'revenue') {
        this.activeTab = tab;
        if (tab === 'revenue' && !this.revenueData) {
            this.loadRevenue();
        }
        this.cdr.detectChanges();
    }

    loadAnalytics() {
        this.loadingAnalytics = true;
        this.adminService.getAnalytics().subscribe({
            next: (data) => {
                this.analyticsData = data;
                this.loadingAnalytics = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching analytics:', err);
                this.loadingAnalytics = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadRevenue() {
        this.loadingRevenue = true;
        this.adminService.getRevenue().subscribe({
            next: (data) => {
                this.revenueData = data;
                this.loadingRevenue = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching revenue:', err);
                this.loadingRevenue = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadPendingBusinesses() {
        this.loadingApprovals = true;
        this.businessService.getPending().subscribe({
            next: (data) => {
                this.pendingBusinesses = Array.isArray(data) ? data : [];
                this.loadingApprovals = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Frontend Error fetching pending businesses:', err);
                this.pendingBusinesses = [];
                this.loadingApprovals = false;
                this.cdr.detectChanges();
            }
        });
    }

    // Modal State
    showModal = false;
    modalTitle = '';
    modalType: 'users' | 'businesses' | 'swaps' | 'queue' = 'users';
    modalData: any[] = [];
    loadingDetails = false;

    openDetailsModal(type: 'users' | 'businesses' | 'swaps' | 'queue', title: string) {
        this.modalType = type;
        this.modalTitle = title;
        this.showModal = true;
        this.loadingDetails = true;
        this.modalData = [];
        this.cdr.detectChanges();

        this.adminService.getDetails(type).subscribe({
            next: (data) => {
                this.modalData = data || [];
                this.loadingDetails = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error(`Error fetching detailed stats for ${type}:`, err);
                this.loadingDetails = false;
                this.cdr.detectChanges();
            }
        });
    }

    closeModal() {
        this.showModal = false;
        setTimeout(() => {
            this.modalData = [];
        }, 300); // Wait for fade out animation
        this.cdr.detectChanges();
    }

    updateStatus(id: string, status: string) {
        if (!confirm(`Are you sure you want to ${status.toLowerCase()} this business?`)) return;

        this.businessService.updateStatus(id, status).subscribe({
            next: (res) => {
                alert(res.message);
                this.loadPendingBusinesses(); // Refresh list
                this.loadAnalytics(); // Refresh stats since business counts changed
            },
            error: (err) => {
                console.error('Error updating status:', err);
                alert('Failed to update status');
            }
        });
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
