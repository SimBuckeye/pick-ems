import { Component, computed, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MatchupModel, RoundModel, TeamModel, Underdog_Type } from '../../util/types/supabase.types';

@Component({
    selector: 'pickems-create-matchup-page',
    imports: [DropdownModule, FormsModule, CalendarModule, InputTextModule],
    template: `
    <div class='h-full flex flex-column align-items-center gap-4'>
        @if(loading()){
            <h2>Loading...</h2>
        } @else {
            <h2>Create Matchup</h2>
            <label class='flex flex-column gap-2'>
                <span>Away Team</span>
                <p-dropdown
                    [filter]='true'
                    styleClass='w-20rem'
                    [options]='teams()'
                    [(ngModel)]='selectedAwayTeam' 
                    optionLabel='name'
                    optionValue='id'/>
            </label>
            <label class='flex flex-column gap-2'>
                <span>Home Team</span>
                <p-dropdown
                    [filter]='true'
                    styleClass='w-20rem'
                    [options]='teams()'
                    [(ngModel)]='selectedHomeTeam'
                    optionLabel='name'
                    optionValue='id'/>
            </label>
            <label class='flex flex-column gap-2'>
                <span>Game Date & Time</span>
                <p-calendar
                    [showIcon]='true'
                    [(ngModel)]='selectedDate'
                    dateFormat='yy-mm-dd'
                    styleClass='w-20rem'
                    placeholder='Select a date'
                    [showTime]='true'
                    hourFormat='12'>
                </p-calendar>
            </label>
            <label class='flex flex-column gap-2'>
                <span>Underdog</span>
                <p-dropdown
                    [filter]='false'
                    styleClass='w-20rem'
                    [options]='[
                        { label: "Home Underdog", value: "home_underdog" },
                        { label: "Away Underdog", value: "away_underdog" },
                        { label: "None", value: null }
                    ]'
                    [(ngModel)]='selectedUnderdog'
                    optionLabel='label'
                    optionValue='value'
                    placeholder='Select underdog'>
                </p-dropdown>
            </label>
            <label class='flex flex-column gap-2'>
                <span>Round</span>
                <p-dropdown
                    [filter]='true'
                    styleClass='w-20rem'
                    [options]='roundOptions()'
                    [(ngModel)]='selectedRound'
                    optionLabel='label'
                    optionValue='value'
                    placeholder='Select round'>
                </p-dropdown>
            </label>
            <label class='flex flex-column gap-2'>
                <span>Matchup Title</span>
                <input
                    pInputText
                    type='text'
                    class='p-inputtext w-20rem'
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