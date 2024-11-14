import { Component, computed, effect, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseClient } from '@supabase/supabase-js';
import { json } from 'express';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'pickems-view-picks-page',
    standalone: true,
    imports: [FormsModule, TableModule, DropdownModule],
    template: `
    <p-dropdown 
        styleClass="mt-3 mr-3"
        [options]="years"
        [(ngModel)]="selectedYear"
        placeholder="Select a year"/>
    <p-dropdown
        [options]="weeks"
        [(ngModel)]="selectedWeek"
        placeholder="Select a week"/>

    @if(picks(); as picks){
        <p-table [value]="picks" [scrollable]="true" styleClass="mt-3">
            <ng-template pTemplate="header">
                <tr>
                    <th pFrozenColumn>Picker</th>
                    @for(game of games; track $index){
                        <th>{{game}}</th>
                    }
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-pick>
                <tr>
                    <td pFrozenColumn [style]="
                            'color: ' + pick.pickerTextColor + '; background: ' + pick.pickerBackgroundColor + ';'" >{{ pick.picker }}</td>
                    @for(game of games; track game){
                        <td [className]="
                            (pick[game].isBold ? 'font-bold' : '') + 
                            (pick[game].isLoss ? ' line-through' : '')"
                            >{{pick[game].text}}</td>
                    }
                </tr>
            </ng-template>
        </p-table>
    } @else {
        <h4>No picks available for this week</h4>
    }
  `,
    styles: `
  
  `,
})
export default class ViewPicksPageComponent implements OnInit {
    private readonly supabase: SupabaseClient = inject(SupabaseClient);
    private readonly messageService = inject(MessageService);
    years: string[] = [];
    weeks: string[] = [];
    selectedYear: WritableSignal<string | null> = signal(null);
    selectedWeek: WritableSignal<string | null> = signal(null);
    picks: WritableSignal<any[] | null> = signal(null);
    games: string[] = [];
    Object = Object;
    JSon = JSON;
    rounds: Record<string, string[]> = {};
    currentRoundYear: string | null = null;
    currentRoundWeek: string | null = null;
    currentRoundAvailable: boolean = false;

    private async onLoad() {
        let { data, error } = await this.supabase.from('v_round').select("*");
        let { data: currentRoundData, error: currentRoundError } = await this.supabase.from('current_round').select('*');

        if(!error && data){
            this.rounds = data.reduce((prev, round) => ({
                ...prev,
                [round.year]: round.weeks
            }), {});
            this.years = Object.keys(this.rounds);
            const lastYear = this.years[this.years.length - 1];
            this.selectedYear.set(lastYear);
            this.weeks = this.rounds[lastYear];
            const lastWeek = this.weeks[this.weeks.length - 1];
            this.selectedWeek.set(lastWeek);
        }


        if (currentRoundError) {
            this.messageService.add({ detail: "Error retrieving details on the current round: " + currentRoundError.details, severity: "error" });
        } else if (currentRoundData && currentRoundData.length > 0) {
            const currentRound = currentRoundData[0];
            const picksLockAt = new Date(currentRound.picks_lock_at);
            this.currentRoundYear = currentRound.year as string; // Note: these are being treated as numbers even though I'm casting here ?? so below I use == instead of ===
            this.currentRoundWeek = currentRound.week as string;
            this.currentRoundAvailable = (new Date() >= picksLockAt);
        }
    }

    private async loadPicks(selectedYear: string, selectedWeek: string){
        if(this.selectedYear() == this.currentRoundYear && this.selectedWeek() == this.currentRoundWeek && !this.currentRoundAvailable){
            this.picks.set(null);
            return;
        }
        let {data, error} = await this.supabase.from('v_pick_result').select("*").eq('year', selectedYear).eq('week', selectedWeek);
        this.games = [];
        if(!error && data){
            let picks: any[] = [];
            data.forEach((pick) => {
                const idx = picks.findIndex((existingPick) => pick.picker === existingPick.picker);
                const gameName = pick.away_team + " @ " + pick.home_team;
                if(this.games.findIndex((game) => game === gameName) === -1){
                    this.games.push(gameName);
                }
                if(idx > -1){
                    picks[idx][gameName] = {
                        text: pick.pick_text || (pick.pick_is_home ? pick.home_team : pick.away_team), 
                        isBold: pick.is_win, isLoss: pick.is_win === false };
                }else{
                    let newPick: any = {
                        picker: pick.picker,
                        pickerTextColor: pick.picker_text_color,
                        pickerBackgroundColor: pick.picker_background_color };
                    newPick[gameName] = {
                        text: pick.pick_text || (pick.pick_is_home ? pick.home_team : pick.away_team), 
                        isBold: pick.is_win, isLoss: pick.is_win === false };
                    picks.push(newPick);
                }
            })
            this.picks.set(picks);
        }
    }

    ngOnInit() {
        this.onLoad();
    }

    constructor(){
        effect(
            () => {
                const selectedYear = this.selectedYear();
                const selectedWeek = this.selectedWeek();
                if (selectedYear && selectedWeek) {
                    this.loadPicks(selectedYear, selectedWeek);
                }
            },
            {allowSignalWrites: true}
        )
        effect(
            () => {
                const selectedYear = this.selectedYear();
                if (selectedYear) {
                    this.weeks = this.rounds[selectedYear];
                    this.selectedWeek.set(this.weeks[this.weeks.length - 1]);
                }
            },
            { allowSignalWrites: true }
        )
    }
}
