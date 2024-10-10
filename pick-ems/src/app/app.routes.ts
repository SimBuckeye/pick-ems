import { Routes } from '@angular/router';
import { redirectToLogin } from './data-access/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./feature/auth/login-page.component')
    },
    {
        path: '',
        loadComponent: () => import('./feature/standings-page/standings-page.component')
    },
    {
        path: 'standings',
        loadComponent: () => import('./feature/standings-page/standings-page.component')
    },
    {
        path: 'make-picks',
        loadComponent: () => import('./feature/make-picks-page/make-picks-page.component'),
        canActivate: [redirectToLogin()]
    },
    {
        path: 'view-picks',
        loadComponent: () => import('./feature/view-picks-page/view-picks-page.component'),
        canActivate: [redirectToLogin()]
    }
];
