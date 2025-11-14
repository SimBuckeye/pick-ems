import { Routes } from '@angular/router';
import { redirectToLogin, redirectUnauthorizedToStandings } from './data-access/auth.guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./feature/standings-page/standings-page.component')
    },
    {
        path: 'login',
        loadComponent: () => import('./feature/auth/login-page.component')
    },
    {
        path: 'standings',
        pathMatch: 'full',
        redirectTo: '',
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
    },
    {
        path: 'bowl-draft',
        loadComponent: () => import('./feature/bowl-draft/bowl-draft-page.component'),
        canActivate: [redirectToLogin()]
    },
    {
        path: 'draft-central',
        loadComponent: () => import('./feature/bowl-draft/draft-central-page.component'),
        canActivate: [redirectToLogin()]
    },
    {
        path: 'profile',
        loadComponent: () => import('./feature/profile-page/profile-page.component'),
        canActivate: [redirectToLogin()]
    },
    {
        path: 'admin/create-matchup',
        loadComponent: () => import('./feature/admin/create-matchup-page.component'),
        canActivate: [redirectUnauthorizedToStandings()]
    },
    {
        path: 'admin/resolve-matchups',
        loadComponent: () => import('./feature/admin/resolve-matchups-page.component'),
        canActivate: [redirectUnauthorizedToStandings()]
    },
    {
        path: 'auth/confirm',
        loadComponent: () => import('./feature/auth/confirm.component')
    },
    {
        path: 'auth/reset-password',
        loadComponent: () => import('./feature/auth/reset-password-page.component'),
        canActivate: [redirectToLogin()]
    },
    {
        path: '**',
        pathMatch: 'full',
        redirectTo: '',
    },
];
