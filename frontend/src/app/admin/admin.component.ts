import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BusinessService } from '../services/business.service';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin.component.html',
    styles: [`
        .admin-container {
            width: 100%;
            min-height: 100vh;
            max-width: 1000px;
            margin: 0 auto;
            padding: 1rem;
        }
        
        /* Header */
        .header {
            margin-bottom: 2rem;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .logo-icon {
            font-size: 1.75rem;
            animation: pulse 2s ease-in-out infinite;
        }
        
        .logo-text {
            font-size: 1.5rem;
            font-weight: 700;
            font-family: 'Outfit', sans-serif;
        }
        
        .btn-logout {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            color: white;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            width: auto;
        }
        
        .btn-logout:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: #ef4444;
            box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
            transform: translateY(-2px);
        }
        
        /* Stats Section */
        .stats-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            animation: cardEntrance 0.6s ease forwards;
        }
        
        .stat-icon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }
        
        .stat-icon.pending {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        .stat-info h3 {
            font-size: 2rem;
            font-weight: 700;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .stat-info p {
            margin: 0;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        /* Content Section */
        .content-section {
            animation: cardEntrance 0.8s ease forwards;
            animation-delay: 0.2s;
            opacity: 0;
        }
        
        .section-header {
            margin-bottom: 2rem;
        }
        
        .section-header h2 {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
        }
        
        .header-icon {
            font-size: 1.5rem;
        }
        
        /* Loading State */
        .loading-container {
            text-align: center;
            padding: 3rem;
        }
        
        .loading-spinner {
            width: 24px;
            height: 24px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #8b5cf6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto;
        }
        
        .loading-spinner.large {
            width: 48px;
            height: 48px;
            border-width: 4px;
        }
        
        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 20px;
            border: 1px dashed rgba(255, 255, 255, 0.1);
        }
        
        .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: float 3s ease-in-out infinite;
        }
        
        .empty-state h3 {
            margin-bottom: 0.5rem;
        }
        
        /* Request Cards */
        .request-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .request-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1.5rem;
            transition: all 0.3s ease;
            animation: cardEntrance 0.6s ease forwards;
            animation-delay: calc(var(--index) * 0.1s);
            opacity: 0;
        }
        
        .request-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(139, 92, 246, 0.3);
            transform: translateX(8px);
            box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
        }
        
        .card-content {
            flex: 1;
        }
        
        .business-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .business-avatar {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            font-weight: 700;
            color: white;
        }
        
        .business-title h3 {
            margin: 0 0 0.25rem 0;
            font-size: 1.1rem;
        }
        
        .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: rgba(139, 92, 246, 0.2);
            color: #a78bfa;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .details-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .detail-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        
        .detail-icon {
            font-size: 1rem;
        }
        
        .actions {
            display: flex;
            gap: 0.75rem;
            flex-shrink: 0;
        }
        
        .btn-approve, .btn-reject {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.25rem;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: auto;
        }
        
        .btn-approve {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        
        .btn-approve:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
        }
        
        .btn-reject {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
        }
        
        .btn-reject:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
        }
        
        @keyframes cardEntrance {
            0% {
                opacity: 0;
                transform: translateY(20px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }
        
        @media (max-width: 700px) {
            .request-card {
                flex-direction: column;
                align-items: stretch;
            }
            
            .actions {
                justify-content: center;
                margin-top: 1rem;
            }
            
            .header-content {
                flex-direction: column;
                gap: 1rem;
            }
        }
    `]
})
export class AdminComponent implements OnInit {
    pendingBusinesses: any[] = [];
    loading = true;

    constructor(
        private businessService: BusinessService,
        private authService: AuthService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadPendingBusinesses();
    }

    loadPendingBusinesses() {
        this.loading = true;
        console.log('Loading pending businesses...');
        this.businessService.getPending().subscribe({
            next: (data) => {
                console.log('Frontend received businesses:', data);
                console.log('Data type:', typeof data, 'Is array:', Array.isArray(data));
                this.pendingBusinesses = Array.isArray(data) ? data : [];
                this.loading = false;
                console.log('Loading set to false, pendingBusinesses length:', this.pendingBusinesses.length);
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Frontend Error fetching pending businesses:', err);
                this.pendingBusinesses = [];
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    updateStatus(id: string, status: string) {
        if (!confirm(`Are you sure you want to ${status.toLowerCase()} this business?`)) return;

        this.businessService.updateStatus(id, status).subscribe({
            next: (res) => {
                alert(res.message);
                this.loadPendingBusinesses(); // Refresh list
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
