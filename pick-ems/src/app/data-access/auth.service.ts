import { inject, Injectable, Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { concat, distinctUntilChanged, from, map, Observable, shareReplay } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly supabase: SupabaseClient = inject(SupabaseClient);

    readonly user$: Observable<User | undefined> = concat(
        from(this.supabase.auth.getSession()).pipe(
            map((session) => session.data.session?.user),
        ),
        new Observable<User | undefined>((subscriber) => ({
            unsubscribe: this.supabase.auth.onAuthStateChange((event, session) =>
                subscriber.next(session?.user),
            ).data.subscription.unsubscribe,
        })),
    ).pipe(
        distinctUntilChanged((a, b) => a?.id === b?.id),
        shareReplay(1),
    );

    readonly user: Signal<User | undefined> = toSignal(this.user$);
}