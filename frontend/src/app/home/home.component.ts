import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BusinessService } from '../services/business.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './home.component.html',
    styles: [`
        .home-container {
            width: 100%;
            min-height: 100vh;
            max-width: 900px;
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
            animation: float 3s ease-in-out infinite;
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
        
        /* Welcome Section */
        .welcome-section {
            margin-bottom: 2rem;
        }
        
        .welcome-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 2.5rem;
            text-align: center;
            animation: cardEntrance 0.8s ease forwards;
        }
        
        .avatar {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 700;
            color: white;
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
            animation: float 3s ease-in-out infinite;
        }
        
        .welcome-card h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        /* Form Section */
        .form-section .card {
            animation: cardEntrance 0.8s ease forwards;
            animation-delay: 0.2s;
            opacity: 0;
        }
        
        .card-header {
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .card-header h2 {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
        }
        
        .header-icon {
            font-size: 1.5rem;
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .label-icon {
            margin-right: 0.5rem;
        }
        
        .submit-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .btn-icon {
            font-size: 1.1rem;
        }
        
        .btn-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .loading-spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        
        .alert-icon {
            font-size: 1.1rem;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        @keyframes cardEntrance {
            0% {
                opacity: 0;
                transform: translateY(30px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @media (max-width: 600px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
            
            .header-content {
                flex-direction: column;
                gap: 1rem;
            }
        }
    `]
})
export class HomeComponent implements OnInit {
    user: any = null;
    business = {
        name: '',
        category: 'Restaurant',
        location: '',
        mobile: ''
    };
    submissionStatus: 'idle' | 'success' | 'error' = 'idle';
    loading = false;

    constructor(
        private authService: AuthService,
        private businessService: BusinessService,
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
        }
    }

    isOwner(): boolean {
        return this.authService.getUserRole() === 'owner';
    }

    onSubmit() {
        console.log('[HomeComponent] Submitting business details...', this.business);
        this.loading = true;
        this.submissionStatus = 'idle';

        const payload = { ...this.business, userId: this.user._id || this.user.id };

        this.businessService.submit(payload).subscribe({
            next: (res) => {
                console.log('[HomeComponent] Submission successful:', res);
                this.loading = false;
                this.submissionStatus = 'success';
                this.business = { name: '', category: 'Restaurant', location: '', mobile: '' };
                this.cd.detectChanges(); // Force UI update
            },
            error: (err) => {
                console.error('[HomeComponent] Submission failed:', err);
                this.loading = false;
                this.submissionStatus = 'error';
                this.cd.detectChanges(); // Force UI update
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
