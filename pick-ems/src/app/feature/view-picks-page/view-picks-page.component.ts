import { Component, computed, effect, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseClient } from '@supabase/supabase-js';
import { json } from 'express';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'pickems-view-picks-page',
    standalone: true,
    imports: [FormsModule, TableModule, DropdownModule, CardModule],
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
        @if(picks.length > 0){
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
        <div class="mt-2 flex flex-row flex-wrap gap-2">
            @for(pick of soloPicks; track pick.pick_id){
                <p-card [header]="pick.matchup_title" [style]="pick.is_win === false ? {color: 'black', background: 'gray'} : {color: pick.picker_text_color, background: pick.picker_background_color}">
                    <div>{{pick.away_team}} vs. {{pick.home_team}}</div>
                    <div>Picker: {{pick.picker}}</div>
                    <div>Pick: {{pick.pick_text}} ({{pick.pick_is_home ? pick.home_team : pick.away_team}})</div>
                </p-card>
            }
        </div>
    } @else {
        <h4>Loading...</h4>
    }
  `,
    styles: `
        p-card{width: 49%;}
  `,
})
export default class ViewPicksPageComponent implements OnInit {
    private readonly supabase: SupabaseClient = inject(SupabaseClient);
    private readonly messageService = inject(MessageService);
    years: (number)[] = [];
    weeks: string[] = [];
    roundsMap: Map<number, string[]> = new Map();
    selectedYear: WritableSignal<number | null> = signal(null);
    selectedWeek: WritableSignal<string | null> = signal(null);
    picks: WritableSignal<any[] | null> = signal(null);
    soloPicks: any[] = [];
    games: string[] = [];
    Object = Object;
    JSon = JSON;
    currentRoundYear: number | null = null;
    currentRoundWeek: string | null = null;
    currentRoundAvailable: boolean = false;

    private async onLoad() {
        let { data: roundsData, error: roundsError } = await this.supabase.from('round').select("*").neq('state', 'not_ready').order('id', { ascending: true });

        if (roundsError) {
            this.messageService.add({ detail: "Error retrieving list of rounds: " + roundsError.message, severity: "error" });
        } else if (roundsData) {
            var round: { year: number, name: string };
            for (round of roundsData) {
                const names = this.roundsMap.get(round.year);
                if (names) {
                    names.push(round.name);
                    this.roundsMap.set(round.year, names);
                } else {
                    this.roundsMap.set(round.year, [round.name]);
                }
            }
            this.years = Array.from(this.roundsMap.keys());
        }

        let { data: currentRoundData, error: currentRoundError } = await this.supabase.from('current_round').select('*');

        if (currentRoundError) {
            this.messageService.add({ detail: "Error retrieving details on the current round: " + currentRoundError.message, severity: "error" });
        } else if (currentRoundData && currentRoundData.length > 0) {
            const currentRound = currentRoundData[0];
            const picksLockAt = new Date(currentRound.picks_lock_at);
            this.currentRoundYear = currentRound.year;
            this.currentRoundWeek = currentRound.week_name;
            this.selectedYear.set(this.years.find((year) => year === this.currentRoundYear)!);
            this.currentRoundAvailable = (new Date() >= picksLockAt);
        }
    }

    private async loadPicks(selectedYear: string | number, selectedWeek: string) {
        if (this.selectedYear() === this.currentRoundYear && this.selectedWeek() === this.currentRoundWeek && !this.currentRoundAvailable) {
            this.picks.set([]);
            return;
        }
        let { data, error } = await this.supabase.from('v_pick_result').select("*").eq('year', selectedYear).eq('week', selectedWeek);
        this.games = [];
        if (!error && data) {
            let picks: any[] = [];
            this.soloPicks = [];
            data.forEach((pick) => {
                if (pick.is_postseason && !pick.is_b1g_postseason) {
                    if (pick.is_win) {
                        pick.matchup_title = "(WIN) " + pick.matchup_title;
                    }
                    this.soloPicks.push(pick);
                    return;
                }
                const idx = picks.findIndex((existingPick) => pick.picker === existingPick.picker);
                const gameName = pick.matchup_title || pick.away_team + " @ " + pick.home_team;
                if (this.games.findIndex((game) => game === gameName) === -1) {
                    this.games.push(gameName);
                }
                if (idx > -1) {
                    picks[idx][gameName] = {
                        text: pick.pick_text || (pick.pick_is_home ? pick.home_team : pick.away_team),
                        isBold: pick.is_win, isLoss: pick.is_win === false
                    };
                } else {
                    let newPick: any = {
                        picker: pick.picker,
                        pickerTextColor: pick.picker_text_color,
                        pickerBackgroundColor: pick.picker_background_color
                    };
                    newPick[gameName] = {
                        text: pick.pick_text || (pick.pick_is_home ? pick.home_team : pick.away_team),
                        isBold: pick.is_win, isLoss: pick.is_win === false
                    };
                    picks.push(newPick);
                }
            })
            this.picks.set(picks);
            this.soloPicks.sort((a, b) => a.matchup_id - b.matchup_id);
        }
    }

    ngOnInit() {
        this.onLoad();
    }

    constructor() {
        effect(
            () => {
                const selectedYear = this.selectedYear();
                const selectedWeek = this.selectedWeek();
                if (selectedYear && selectedWeek) {
                    this.loadPicks(selectedYear, selectedWeek);
                }
            },
            { allowSignalWrites: true }
        )
        effect( // TODO convert to linkedSignal when upgrading to Angular 19+
            () => {
                const selectedYear = this.selectedYear();
                if (selectedYear) {
                    this.weeks = this.roundsMap.get(selectedYear)!;
                    this.selectedWeek.set(this.weeks[this.weeks.length - 1]);
                }
            },
            { allowSignalWrites: true }
        )
    }
}
