import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './register.component.html',
    styles: [`
        .brand-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 32px rgba(16, 185, 129, 0.4);
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
        
        .success-container {
            animation: slideUp 0.6s ease;
        }
        
        .success-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounce 0.6s ease;
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
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `]
})
export class RegisterComponent {
    user = {
        name: '',
        email: '',
        password: ''
    };
    loading = false;
    error = '';
    success = '';

    constructor(private authService: AuthService) { }

    onSubmit() {
        this.loading = true;
        this.error = '';
        this.success = '';

        this.authService.register(this.user).subscribe({
            next: (res) => {
                this.loading = false;
                this.success = res.message;
                this.user = { name: '', email: '', password: '' };
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || 'Registration failed';
            }
        });
    }
}
