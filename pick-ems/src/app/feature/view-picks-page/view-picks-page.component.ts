import { Component, computed, effect, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseClient } from '@supabase/supabase-js';
import { json } from 'express';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'app-view-picks-page',
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
                    <td pFrozenColumn>{{ pick.picker }}</td>
                    @for(game of games; track game){
                        <td>{{pick[game]}}</td>
                    }
                </tr>
            </ng-template>
        </p-table>
    }
  `,
    styles: `
  
  `,
})
export default class ViewPicksPageComponent implements OnInit {
    private readonly supabase: SupabaseClient = inject(SupabaseClient);
    years = ["2024"];
    weeks = ["1", "2", "3", "4", "5", "6"];
    selectedYear = signal("2024");
    selectedWeek: Signal<string | null> = signal("6");
    picks: WritableSignal<any[]> = signal([]);
    games: string[] = [];
    Object = Object;
    JSon = JSON;

    private async onLoad() {
    }

    private async loadPicks(selectedYear: string, selectedWeek: string){
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
                    picks[idx][gameName] = pick.pick_is_home ? pick.home_team : pick.away_team;
                }else{
                    let newPick: any = {picker: pick.picker};
                    newPick[gameName] = pick.pick_is_home ? pick.home_team : pick.away_team;
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
    }
}
