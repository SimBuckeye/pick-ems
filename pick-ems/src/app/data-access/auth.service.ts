import { inject, Injectable, Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { MessageService } from "primeng/api";
import { concat, distinctUntilChanged, from, map, Observable, shareReplay } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly supabase: SupabaseClient = inject(SupabaseClient);
    private readonly messageService = inject(MessageService);

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

    async getUserId(): Promise<string | null> {
        const { data, error } = await this.supabase.auth.getUser();
        if (error || !data || !data.user) {
            return null;
        }
        return data.user.id;
    }

    async pickerId(userId: string): Promise<number | null> {

        const { data: userData, error: userError } = await this.supabase.from("auth_user").select("*").eq('uuid', userId);
        if (userError) {
            this.messageService.add({ detail: "Error retrieving details on the logged-in user: " + userError?.details, severity: "error" });
        }
        if (userData && userData.length === 1) {
            return userData[0].id;
        }
        return null;
    }
}