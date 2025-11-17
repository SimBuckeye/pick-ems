import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root',
})
export class PushNotificationService {
    private readonly vapidPublicKey = import.meta.env.NG_APP_VAPID_PUBLIC_KEY;

    async subscribeToPushNotifications(){
        const swPush: SwPush
        swPush.requestSubscription
    }
}