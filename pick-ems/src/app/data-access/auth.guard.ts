import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { first, map } from 'rxjs';

export function redirectToLogin() {
    return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        const router = inject(Router);
        const authService = inject(AuthService);
        return authService.user$.pipe(
            first(),
            map((user) => {
                if (user) {
                    return true;
                }
                router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
                return false;
            })
        )
    }
}

export function redirectUnauthorizedToStandings() {
    return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        const router = inject(Router);
        const authService = inject(AuthService);
        return authService.user$.pipe(
            first(),
            map((user) => {
                if (user?.id === 'e1320165-692d-4453-a49f-a550b83f7373') {
                    return true;
                }
                router.navigate(['/'], { queryParams: { returnUrl: state.url } });
                return false;
            })
        )
    }
}