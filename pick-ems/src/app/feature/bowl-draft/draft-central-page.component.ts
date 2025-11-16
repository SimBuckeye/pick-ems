import { Component, effect, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { StandingsService } from '../../data-access/standings.service';
import { AuthService } from '../../data-access/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SupabaseClient } from '@supabase/supabase-js';

@Component({
    selector: 'pickems-draft-central-page',
    standalone: true,
    imports: [CardModule, SelectButtonModule, ReactiveFormsModule, ButtonModule, InputTextModule],
    template: `
    @if(loading){
        <div>Loading...</div>
    }@else{
        <div class='flex flex-column pt-2 gap-2'>
            <p-card header='On the Clock'>
                <h2 [style]='"margin: 0; color: " + onTheClockUser.picker_text_color + "; background: " + onTheClockUser.picker_background_color + ";"'>{{onTheClockUser?.nickname}}</h2> <!-- TODO style pipe -->
                @if(userIsOnTheClock && draftOpen){
                    <p-button styleClass='mt-2' (onClick)='onGoToDraft()'>Go to draft</p-button>
                }
            </p-card>
            <p-card header='Draft Order'>
                @for(user of draftOrder; track user.picker_id){
                    @if(user !== onTheClockUser){
                        <h4 [style]='"margin: 0; color: " + user.picker_text_color + "; background: " + user.picker_background_color + ";"'>{{user?.nickname}}</h4> <!-- TODO style pipe -->
                    }
                }
            </p-card>
            <p-card header='Previous Picks'>
                @for(pick of draftPicks; track pick.pick_id){
                    <p-card [header]='pick.matchup_title'>
                        <div>{{pick.away_team}} vs. {{pick.home_team}}</div>
                        <div>Picker: {{pick.picker}}</div>
                        <div>Pick: {{pick.pick_text}} ({{pick.pick_is_home ? pick.home_team : pick.away_team}})</div>
                    </p-card>
                }
            </p-card>
        </div>
    }
    `,
    styles: `
    `
})
export default class DraftCentralPageComponent implements OnInit {
    private standingsService = inject(StandingsService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);
    private supabase = inject(SupabaseClient);
    private readonly router = inject(Router);

    onTheClockUser: any | null = null;
    userIsOnTheClock = false;
    draftOrder: any[] = [];
    draftPicks: any[] = [];
    loading = true;
    draftOpen = false;

    onGoToDraft() {
        this.router.navigate(['/bowl-draft']);
    }

    async onLoad(userId: string) {
        this.draftOrder = await this.standingsService.draftOrder();
        if (this.draftOrder.length > 0) {
            const pickerId = await this.authService.pickerId(userId);
            this.onTheClockUser = this.draftOrder[0];
            this.userIsOnTheClock = this.onTheClockUser.picker_id === pickerId;
        }
        this.draftPicks = await this.standingsService.draftPicks();


        let { data: roundData, error: roundError } = await this.supabase.from('round').select('*').eq('state', 'accepting_picks');
        if (roundError) {
            this.messageService.add({ detail: 'Error retrieving the list of rounds: ' + roundError.message, severity: 'error' });
            return;
        } else if (roundData && roundData.length > 0) {
            const round = roundData[0];
            this.draftOpen = round.name === 'Bowls' && round.state === 'accepting_picks';
        }

        this.loading = false;
    }

    ngOnInit() {
    }

    constructor() {
        effect(() => {
            const user = this.authService.user();
            if (user) {
                this.onLoad(user.id);
            }
        })
    }
}