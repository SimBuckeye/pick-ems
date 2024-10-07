import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, RedirectFunction, Router, RouterStateSnapshot } from "@angular/router";
import { SupabaseClient } from "@supabase/supabase-js";

export async function redirectToLogin(route: ActivatedRouteSnapshot, state: RouterStateSnapshot){
    const supabase = inject(SupabaseClient);
    const router = inject(Router);
    const user = (await supabase.auth.getUser()).data.user;
    if(user){
        return true;
    }
    router.navigate(['/login'], {queryParams: {returnUrl: state.url}});
    return false;
}