import { inject, Injectable } from "@angular/core";
import { SupabaseClient } from "@supabase/supabase-js";
import { MessageService } from "primeng/api";

@Injectable({
    providedIn: 'root',
})
export class StandingsService {
    private readonly supabase: SupabaseClient = inject(SupabaseClient);
    private readonly messageService = inject(MessageService);

    async onTheClock(): Promise<any | null>{
        const data = await this.draftOrder();
        if(data.length > 0){
            return data[0];
        }
        return null;
    }

    async draftOrder(): Promise<any[]> {
        const { data, error } = await this.supabase.from("v_standings").select("*")
            .order("year", { ascending: false })
            .order("postseason_picks", { ascending: true })
            .order("b1g_percentage", { ascending: false })
            .order("total_percentage", { ascending: false })
            .order("nickname", {ascending: false})
        if (error) {
            this.messageService.add({ detail: "Error retrieiving on-the-clock user: " + error, severity: "error" });
            return [];
        }
        if (data.length > 0) {
            return data;
        }
        return [];
    }

    async standings(): Promise<any[]> {
        const { data, error } = await this.supabase.from("v_standings").select("*")
            .order("year", { ascending: false })
            .order("postseason_percentage", {ascending: false})
            .order("b1g_percentage", { ascending: false })
            .order("total_percentage", { ascending: false });
        if (error) {
            this.messageService.add({ detail: "Error retrieving standings: " + error, severity: "error" });
            return [];
        }
        return data;
    }

    async draftPicks(): Promise<any[]> {
        const {data, error} = await this.supabase.from("v_pick_result").select("*")
            .eq("is_postseason", true)
            .eq("is_b1g_postseason", false)
            .order("created_at", {ascending: false});
        if(error){
            this.messageService.add({detail: "Error retrieving draft picks: " + error, severity: "error"});
            return [];
        }
        return data;
    }
}