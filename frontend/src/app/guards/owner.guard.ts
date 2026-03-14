import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const ownerGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn()) {
        const userRole = authService.getUserRole();
        if (userRole === 'owner') {
            return true;
        }
    }

    router.navigate(['/home']);
    return false;
};
