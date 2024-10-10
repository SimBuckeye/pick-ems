import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "./auth.service";
import { first, map } from "rxjs";

export function redirectToLogin(){
    return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        const router = inject(Router);
        const authService = inject(AuthService); 
        return authService.user$.pipe(
        first(),
        map((user) => {
            if(user){
                return true;
            }
            router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
            return false;
        })
    )}
}