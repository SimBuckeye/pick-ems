import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MatchupAwayTeamPipe, MatchupHomeTeamPipe } from '../../util/pipes/matchup-team.pipe';
import { TableModule } from 'primeng/table';
import { SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { MatchupTitlePipe } from '../../util/pipes/matchup-title.pipe';
import { ButtonModule } from 'primeng/button';
import { MatchupModel, RoundModel } from '../../util/types/supabase.types';

@Component({
    selector: 'app-resolve-matchups-page',
    imports: [FormsModule, RadioButtonModule, TableModule, MatchupAwayTeamPipe, MatchupHomeTeamPipe, MatchupTitlePipe, ButtonModule],
    template: `
    <h2>Resolve Matchups</h2>
    @if(loading()){
        <h4>Loading...</h4>
    }@else {
        @if(round(); as round){
            <h3>Round {{ round.year }} - {{round.name}}</h3>

            <p-table [value]="matchups()" class="w-full">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Matchup</th>
                        <th class="text-center">Away Picks</th>
                        <th class="text-center">Home Picks</th>
                        <th class="text-center">Away</th>
                        <th class="text-center">Home</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-matchup>
                    <tr>
                        <td>{{ matchup | title }}</td>
                        <td class="text-center">{{ matchup.away_picks ?? 0 }}</td>
                        <td class="text-center">{{ matchup.home_picks ?? 0 }}</td>
                        <td>
                            <label class="flex flex-column gap-2 align-items-center">
                                <p-radioButton
                                    [name]="'winner-' + matchup.id"
                                    value="away"
                                    [(ngModel)]="matchup.selectedWinner"/>
                                <span class="team-name">{{ matchup | awayTeam }}</span>
                            </label>
                        </td>

                        <td>
                            <label class="flex flex-column gap-2 align-items-center">
                                <p-radioButton
                                    [name]="'winner-' + matchup.id"
                                    value="home"
                                    [(ngModel)]="matchup.selectedWinner"/>
                                <span class="team-name">{{ matchup | homeTeam }}</span>
                            </label>
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <p-button
                styleClass="w-full mt-3"
                type="submit"
                [disabled]="submitDisabled()"
                [loading]="submitting()"
                label="Submit"
                (onClick)="onSubmit()" />
        }@else{
            <h4>No locked round found.</h4>
        }

    }
    `,
    styles: []
})
export default class ResolveMatchupsPageComponent implements OnInit {
    private readonly supabase = inject(SupabaseClient);
    private readonly messageService = inject(MessageService);

    round: WritableSignal<RoundModel | null> = signal(null);
    matchups: WritableSignal<(MatchupModel & { selectedWinner: 'home' | 'away' })[]> = signal([]);
    loading: WritableSignal<boolean> = signal(true);
    error: WritableSignal<string | null> = signal(null);
    submitting: WritableSignal<boolean> = signal(false);

    submitDisabled = computed(() => {
        return false;
    });

    async onLoad(): Promise<void> {
        let { data: roundsData, error: roundsError } = await this.supabase.from('round').select('*').eq('state', 'locked').order('id', { ascending: true }).limit(1);
        if (roundsError || !roundsData) {
            this.messageService.add({ detail: "Error retrieving locked round: " + roundsError?.message, severity: "error" });
            this.loading.set(false);
            return;
        }
        if (roundsData.length === 0) {
            this.loading.set(false);
            return;
        }

        this.round.set(roundsData[0]);

        let { data: matchupsData, error: matchupsError } = await this.supabase.from('v_matchup').select('*').eq('round', this.round()?.id);
        if (matchupsError || !matchupsData) {
            this.messageService.add({ detail: "Error retrieving matchups: " + matchupsError?.message, severity: "error" });
            this.loading.set(false);
            return;
        }
        matchupsData = matchupsData.filter(matchup => matchup.winner_is_home === null || matchup.winner_is_home === undefined);
        this.matchups.set(matchupsData);

        this.loading.set(false);
    }

    async onSubmit(): Promise<void> {
        this.submitting.set(true);
        let successCount = 0;
        for (const matchup of this.matchups()) {
            if (!matchup.selectedWinner) {
                continue;
            }
            const { data: updateData, error: updateError } = await this.supabase.from('matchup').update({ winner_is_home: matchup.selectedWinner === 'home' }).eq('id', matchup.id);
            if (updateError) {
                this.messageService.add({ detail: `Error updating matchup ${matchup.id}: ` + updateError.message, severity: 'error' });
            } else {
                successCount++;
            }
        }
        this.messageService.add({ detail: `Successfully updated ${successCount} matchups.`, severity: 'success' });
        this.submitting.set(false);
    }

    ngOnInit(): void {
        this.onLoad();
    }
}