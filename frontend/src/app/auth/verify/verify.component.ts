import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-verify',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './verify.component.html',
    styles: [`
        .status-container {
            text-align: center;
            padding: 2rem 0;
        }
        
        .status-icon {
            width: 100px;
            height: 100px;
            margin: 0 auto 1.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
        }
        
        .status-icon.loading {
            background: rgba(139, 92, 246, 0.1);
        }
        
        .status-icon.success {
            background: rgba(16, 185, 129, 0.1);
            animation: scaleIn 0.5s ease;
        }
        
        .status-icon.error {
            background: rgba(239, 68, 68, 0.1);
            animation: shake 0.5s ease;
        }
        
        .loading-spinner {
            width: 24px;
            height: 24px;
            border: 3px solid rgba(139, 92, 246, 0.2);
            border-top-color: #8b5cf6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        
        .loading-spinner.large {
            width: 48px;
            height: 48px;
            border-width: 4px;
        }
        
        .btn-link {
            display: inline-block;
            padding: 0.75rem 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
            text-decoration: none;
        }
        
        .btn-link:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(102, 126, 234, 0.5);
        }
        
        .btn-link::after {
            display: none;
        }
        
        .btn-link.secondary {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .btn-link.secondary:hover {
            background: rgba(255, 255, 255, 0.15);
            box-shadow: 0 8px 30px rgba(255, 255, 255, 0.1);
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes scaleIn {
            0% { transform: scale(0); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
    `]
})
export class VerifyComponent implements OnInit {
    message = '';
    status: 'loading' | 'success' | 'error' = 'loading';

    constructor(
        private route: ActivatedRoute,
        private authService: AuthService
    ) { }

    ngOnInit() {
        const token = this.route.snapshot.paramMap.get('token');
        if (token) {
            this.authService.verify(token).subscribe({
                next: (res) => {
                    this.status = 'success';
                    this.message = res.message;
                },
                error: (err) => {
                    this.status = 'error';
                    this.message = err.error?.message || 'Verification failed. Token may be invalid or expired.';
                }
            });
        } else {
            this.status = 'error';
            this.message = 'No verification token provided.';
        }
    }
}
