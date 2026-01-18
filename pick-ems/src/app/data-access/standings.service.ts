import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { VPickResultModel, VRoundModel, VStandingsModel } from '../util/types/supabase.types';

@Injectable({
    providedIn: 'root',
})
export class StandingsService {
    private readonly supabase: SupabaseClient = inject(SupabaseClient);
    private readonly messageService = inject(MessageService);

    async onTheClock(): Promise<any | null> {
        const data = await this.draftOrder();
        if (data.length > 0) {
            return data[0];
        }
        return null;
    }

    async draftOrder(): Promise<any[]> {
        const { data: vRoundData, error: vRoundError } = await this.supabase.from('v_round').select<'year', VRoundModel>('year')
            .order('year', { ascending: false }).limit(1).single();
        if (vRoundError) {
            this.messageService.add({ detail: 'Error retrieving current round: ' + vRoundError.message, severity: 'error' });
            return [];
        }
        const currentYear = vRoundData.year;

        const { data, error } = await this.supabase.from('v_standings').select<'*', VStandingsModel>('*')
            .eq('year', currentYear)
            .order('year', { ascending: false })
            .order('postseason_picks', { ascending: true })
            .order('points', { ascending: false })
            .order('b1g_percentage', { ascending: false })
            .order('total_percentage', { ascending: false })
            .order('nickname', { ascending: false })
        if (error) {
            this.messageService.add({ detail: 'Error retrieiving on-the-clock user: ' + error, severity: 'error' });
            return [];
        }
        if (data.length > 0) {
            return data;
        }
        return [];
    }

    async standings(): Promise<any[]> {
        const { data, error } = await this.supabase.from('v_standings').select('*')
            .order('year', { ascending: false })
            .order('postseason_percentage', { ascending: false })
            .order('tiebreaker_bonus', { ascending: false })
            .order('points', { ascending: false })
            .order('b1g_percentage', { ascending: false })
            .order('total_percentage', { ascending: false });
        if (error) {
            this.messageService.add({ detail: 'Error retrieving standings: ' + error.message, severity: 'error' });
            return [];
        }
        return data;
    }

    async draftPicks(): Promise<any[]> {
        const { data: vRoundData, error: vRoundError } = await this.supabase.from('v_round').select<'year', VRoundModel>('year')
            .order('year', { ascending: false }).limit(1).single();
        if (vRoundError) {
            this.messageService.add({ detail: 'Error retrieving current round: ' + vRoundError.message, severity: 'error' });
            return [];
        }
        const currentYear = vRoundData.year;

        const { data, error } = await this.supabase.from('v_pick_result').select<'*', VPickResultModel>('*')
            .eq('year', currentYear)
            .eq('is_postseason', true)
            .eq('is_b1g_postseason', false)
            .eq('week', 'Bowls')
            .order('created_at', { ascending: false });
        if (error) {
            this.messageService.add({ detail: 'Error retrieving draft picks: ' + error, severity: 'error' });
            return [];
        }
        return data;
    }
}