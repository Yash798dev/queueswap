import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BusinessService } from '../services/business.service';
import { ConsumerService, UserDashboard } from '../services/consumer.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    user: any = null;
    math = Math;
    
    // Partner Form State
    showPartnerForm = false;
    business = { name: '', category: 'Restaurant', location: '', mobile: '' };
    submissionStatus: 'idle' | 'success' | 'error' = 'idle';
    loadingBusinessSubmit = false;

    // Consumer Dashboard State
    dashboard: UserDashboard | null = null;
    loadingDashboard = true;

    // Explore & Trending State
    exploreList: any[] = [];
    trendingList: any[] = [];
    searchQuery = '';
    loadingExplore = true;
    loadingTrending = true;

    // Remote Join State
    joiningBusinessId: string | null = null;
    joinError = '';

    constructor(
        private authService: AuthService,
        private businessService: BusinessService,
        private consumerService: ConsumerService,
        private router: Router,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit() {
        if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/login']);
            return;
        }
        const userStr = localStorage.getItem('user');
        if (userStr) {
            this.user = JSON.parse(userStr);
            this.loadDashboardData();
        }
    }

    loadDashboardData() {
        if (!this.user?.email) return;

        // Fetch Dashboard
        this.consumerService.getUserDashboard(this.user.email).subscribe({
            next: (data) => {
                this.dashboard = data;
                this.loadingDashboard = false;
                this.cd.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load dashboard:', err);
                this.loadingDashboard = false;
            }
        });

        // Fetch Explore
        this.consumerService.exploreBusinesses().subscribe({
            next: (data) => {
                this.exploreList = data;
                this.loadingExplore = false;
                this.cd.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load explore list:', err);
                this.loadingExplore = false;
            }
        });

        // Fetch Trending
        this.consumerService.getTrendingBusinesses().subscribe({
            next: (data) => {
                this.trendingList = data;
                this.loadingTrending = false;
                this.cd.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load trending list:', err);
                this.loadingTrending = false;
            }
        });
    }

    get filteredExploreList() {
        if (!this.searchQuery) return this.exploreList;
        const q = this.searchQuery.toLowerCase();
        return this.exploreList.filter(b => 
            b.name.toLowerCase().includes(q) || 
            b.category.toLowerCase().includes(q) || 
            b.location.toLowerCase().includes(q)
        );
    }

    joinRemoteQueue(businessId: string) {
        if (!this.user || !this.user.email) return;
        // Redirect user to the join page so they can enter name/mobile and optionally connect Metamask
        this.router.navigate(['/queue-join', businessId]);
    }

    goToQueue(businessId: string) {
        // Find if user already joined this queue
        const queueEntry = this.dashboard?.activeQueues.find(q => q.businessId._id === businessId);
        if (queueEntry) {
            // They are already in the queue, go to queue-token view
            // We need uniqueId + businessId as query params normally, but we can pass email as uniqueId
            this.router.navigate(['/queue-token'], { 
                queryParams: { businessId: businessId, uniqueId: this.user.email, fromRemote: true } 
            });
        }
    }

    isOwner(): boolean {
        return this.authService.getUserRole() === 'owner';
    }

    togglePartnerForm() {
        this.showPartnerForm = !this.showPartnerForm;
    }

    submitPartnerForm() {
        this.loadingBusinessSubmit = true;
        this.submissionStatus = 'idle';

        const payload = { ...this.business, userId: this.user._id || this.user.id };

        this.businessService.submit(payload).subscribe({
            next: (res) => {
                this.loadingBusinessSubmit = false;
                this.submissionStatus = 'success';
                this.business = { name: '', category: 'Restaurant', location: '', mobile: '' };
                this.cd.detectChanges();
            },
            error: (err) => {
                this.loadingBusinessSubmit = false;
                this.submissionStatus = 'error';
                this.cd.detectChanges();
            }
        });
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    goToQueueManagement() {
        this.router.navigate(['/business-queue']);
    }
}
