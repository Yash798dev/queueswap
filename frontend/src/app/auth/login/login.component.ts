import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styles: [`
        .brand-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
            animation: float 3s ease-in-out infinite;
        }
        
        .brand-icon svg {
            width: 40px;
            height: 40px;
            color: white;
        }
        
        .label-icon {
            margin-right: 0.5rem;
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
        
        .divider {
            display: flex;
            align-items: center;
            margin: 1.5rem 0;
            color: var(--text-muted);
        }
        
        .divider::before,
        .divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--card-border);
        }
        
        .divider span {
            padding: 0 1rem;
            font-size: 0.85rem;
        }
        
        .link-accent {
            color: #a78bfa;
            font-weight: 600;
        }
        
        .link-accent:hover {
            color: #8b5cf6;
        }
        
        .alert-icon {
            font-size: 1.1rem;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `]
})
export class LoginComponent implements OnInit {
    credentials = {
        email: '',
        password: ''
    };
    loading = false;
    error = '';
    successMessage = '';

    constructor(
        private authService: AuthService, 
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params['verified'] === 'true') {
                this.successMessage = 'Email verified successfully! You can now sign in.';
                this.error = '';
            } else if (params['verified'] === 'false') {
                if (params['error'] === 'invalid_token') {
                    this.error = 'Verification failed: Invalid or expired token.';
                } else {
                    this.error = 'Verification failed: Server error, please try again.';
                }
                this.successMessage = '';
            }
        });
    }

    onSubmit() {
        this.loading = true;
        this.error = '';

        this.authService.login(this.credentials).subscribe({
            next: (res) => {
                this.loading = false;
                // Check user role and redirect accordingly
                const userRole = res.user?.role;
                if (userRole === 'admin') {
                    this.router.navigate(['/admin']);
                } else if (userRole === 'owner') {
                    this.router.navigate(['/owner-dashboard']);
                } else {
                    this.router.navigate(['/home']);
                }
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || 'Login failed';
            }
        });
    }
}
