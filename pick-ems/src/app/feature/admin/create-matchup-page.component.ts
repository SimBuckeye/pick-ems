import { Component, computed, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { DatePicker } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MatchupModel, RoundModel, TeamModel, Underdog_Type } from '../../util/types/supabase.types';
import { ButtonModule } from "primeng/button";

@Component({
    selector: 'pickems-create-matchup-page',
    imports: [SelectModule, FormsModule, DatePicker, InputTextModule, ButtonModule],
    template: `
    <div class='h-full flex flex-col items-center gap-6'>
        @if(loading()){
            <h1 class="text-lg">Loading...</h1>
        } @else {
            <h1 class="text-2xl flex flex-col gap-2 mt-2">Create Matchup</h1>
            <label class='flex flex-col gap-2'>
                <span>Away Team</span>
                <p-select
                    [filter]='true'
                    class='w-80'
                    [options]='teams()'
                    [(ngModel)]='selectedAwayTeam' 
                    optionLabel='name'
                    optionValue='id'/>
            </label>
            <label class='flex flex-col gap-2'>
                <span>Home Team</span>
                <p-select
                    [filter]='true'
                    class='w-80'
                    [options]='teams()'
                    [(ngModel)]='selectedHomeTeam'
                    optionLabel='name'
                    optionValue='id'/>
            </label>
            <label class='flex flex-col gap-2 w-80'>
                <span>Game Date & Time</span>
                <p-date-picker
                    [showIcon]='true'
                    [(ngModel)]='selectedDate'
                    dateFormat='yy-mm-dd'
                    inputStyleClass="w-80"
                    placeholder='Select a date'
                    [showTime]='true'
                    hourFormat='12'>
                </p-date-picker>
            </label>
            <label class='flex flex-col gap-2'>
                <span>Underdog</span>
                <p-select
                    [filter]='false'
                    class='w-80'
                    [options]='[
                        { label: "Home Underdog", value: "home_underdog" },
                        { label: "Away Underdog", value: "away_underdog" },
                        { label: "None", value: null }
                    ]'
                    [(ngModel)]='selectedUnderdog'
                    optionLabel='label'
                    optionValue='value'
                    placeholder='Select underdog'>
                </p-select>
            </label>
            <label class='flex flex-col gap-2'>
                <span>Round</span>
                <p-select
                    [filter]='true'
                    class='w-80'
                    [options]='roundOptions()'
                    [(ngModel)]='selectedRound'
                    optionLabel='label'
                    optionValue='value'
                    placeholder='Select round'>
                </p-select>
            </label>
            <label class='flex flex-col gap-2'>
                <span>Matchup Title</span>
                <input
                    pInputText
                    type='text'
                    class='p-inputtext w-80'
                    [(ngModel)]='matchupTitle'
                    placeholder='Enter matchup title' />
            </label>

            <p-button
                styleClass='w-full'
                type='submit'
                [disabled]='submitDisabled()'
                label='Submit'
                (onClick)='onSubmit()' />
        }
    `
})
export default class CreateMatchupPageComponent implements OnInit {
    private readonly supabase = inject(SupabaseClient);
    private readonly messageService = inject(MessageService);
    teams: WritableSignal<Pick<TeamModel, 'id' | 'name'>[]> = signal([]);
    rounds: WritableSignal<Pick<RoundModel, 'id' | 'year' | 'name'>[]> = signal([]);
    roundOptions: Signal<{ label: string, value: RoundModel['id'] }[]> = computed(() =>
        this.rounds().map(r => ({ label: r.year + ' - ' + r.name, value: r.id })));
    loading: WritableSignal<boolean> = signal(true);
    selectedAwayTeam: WritableSignal<TeamModel['id'] | null> = signal(null);
    selectedHomeTeam: WritableSignal<TeamModel['id'] | null> = signal(null);
    selectedDate: WritableSignal<Date | null> = signal(new Date());
    selectedUnderdog: WritableSignal<Underdog_Type | null> = signal(null);
    selectedRound: WritableSignal<RoundModel['id'] | null> = signal(null);
    matchupTitle: WritableSignal<string> = signal('');

    submitDisabled = computed(() => {
        const awayTeam = this.selectedAwayTeam();
        const homeTeam = this.selectedHomeTeam();
        const date = this.selectedDate();
        const round = this.selectedRound();
        return !awayTeam || !homeTeam || !date || !round;
    });


    async onLoad() {
        const defaultDate = new Date();
        defaultDate.setHours(12, 0, 0, 0);
        this.selectedDate.set(defaultDate);

        let { data: teamsData, error: teamsError } = await this.supabase.from('team').select<'id, name', TeamModel>('id, name');
        if (teamsError || !teamsData) {
            this.messageService.add({ detail: 'Error retrieving the list of teams: ' + teamsError?.message, severity: 'error' });
            return;
        }
        this.teams.set(teamsData);

        let { data: roundsData, error: roundsError } = await this.supabase.from('round').select<'id, year, name', RoundModel>('id, year, name').eq('state', 'not_ready').order('id', { ascending: true });
        if (roundsError || !roundsData) {
            this.messageService.add({ detail: 'Error retrieving the list of rounds: ' + roundsError?.message, severity: 'error' });
            return;
        }
        this.rounds.set(roundsData);
        if (roundsData.length > 0) {
            this.selectedRound.set(roundsData[0].id);
        }

        this.loading.set(false);
    }

    async onSubmit() {
        if (!this.selectedAwayTeam() || !this.selectedHomeTeam() || !this.selectedDate() || !this.selectedRound()) {
            this.messageService.add({ detail: 'Fill in all required fields.', severity: 'error' });
            return;
        }
        const { data: submitData, error: submitError } = await this.supabase.rpc('insert_matchup', {
            p_away_team_id: this.selectedAwayTeam()!,
            p_datetime: this.selectedDate()!.toISOString(),
            p_home_team_id: this.selectedHomeTeam()!,
            p_matchup_title: this.matchupTitle() || null,
            p_round_id: this.selectedRound()!,
            p_underdog: this.selectedUnderdog() || null
        });

        if (submitError) {
            this.messageService.add({ detail: 'Error creating matchup: ' + submitError.message, severity: 'error' });
        } else {
            this.messageService.add({ detail: 'Matchup created successfully.', severity: 'success' });

            this.selectedAwayTeam.set(null);
            this.selectedHomeTeam.set(null);
            this.selectedUnderdog.set(null);
            this.matchupTitle.set('');
        }
    }

    ngOnInit(): void {
        this.onLoad();
    }
}