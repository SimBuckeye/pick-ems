import { inject, Injectable } from "@angular/core";
import { getMessaging, getToken } from "firebase/messaging";
import { AuthService } from "../data-access/auth.service";
import { SupabaseClient } from "@supabase/supabase-js";
import { MessageService } from "primeng/api";

@Injectable({
    providedIn: 'root',
})
export class PushNotificationService {
    private readonly authService = inject(AuthService);
    private readonly supabase = inject(SupabaseClient);
    private readonly messageService = inject(MessageService);
    private readonly vapidPublicKey = import.meta.env.NG_APP_VAPID_PUBLIC_KEY;

    constructor() { }
    async subscribeToPushNotifications() {
        this.messageService.add({ detail: 'Requesting notification permission. If prompted, please allow notifications.', severity: 'info' });
        const messaging = getMessaging();
        const token = await getToken(messaging, {
            vapidKey: this.vapidPublicKey,
            serviceWorkerRegistration: await navigator.serviceWorker.register(
                "/firebase-messaging-sw.js"
            ),
        });

        if (token) {
            const userId = await this.authService.getUserId();
            if (userId) {
                const { data: updateData, error: updateError } = await this.supabase
                    .from('auth_user')
                    .update({ fcm_token: token })
                    .eq('uuid', userId)
                    .select();
                if (updateError) {
                    this.messageService.add({ detail: 'Error saving push notification token: ' + updateError.message, severity: 'error' });
                } else {
                    this.messageService.add({ detail: 'Successfully enabled push notifications', severity: 'success' });
                }

            } else {
                this.messageService.add({ detail: 'Unable to retrieve user ID for saving push notification token.', severity: 'error' });
            }
        } else {
            this.messageService.add({ detail: 'Notification permission denied, or token generation failed', severity: 'error' });
        }

        return token;
    }
}