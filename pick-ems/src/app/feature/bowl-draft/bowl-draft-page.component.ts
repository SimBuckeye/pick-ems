import { Component, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PostgrestError, SupabaseClient, User } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AuthService } from '../../data-access/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { StandingsService } from '../../data-access/standings.service';

@Component({
    selector: 'pickems-bowl-draft-page',
    imports: [CardModule, SelectButtonModule, ReactiveFormsModule, ButtonModule, InputTextModule],
    template: `
    @if(loading){
      <h2>loading...</h2>
    }@else if(!draftOpen){
      <h2>Draft is currently closed.</h2>
    }@else if(!userId){
      <h2>Current user not found. Try logging out and back in.</h2>
    }@else if(userId !== onTheClockUser?.picker_id){
      <h4>{{onTheClockUser?.nickname}} is on the clock!</h4>
    }@else {
      <h4>You are on the clock! Please select one of the options below.</h4>

      @if(form){
      <div class='h-full flex flex-column align-items-center'>
          <form
              [formGroup]='form'
              class='w-full max-w-30rem flex flex-column gap-3 px-3'
          >
            @for(matchup of matchups; track matchup.id){
              <p-card [header]='matchup.matchup_title'>
                @if(matchup.away_picker_id){
                  <div class='mb-2 text-yellow-500'>{{matchup.away_team_name}} already drafted by {{matchup.away_picker}}.</div>
                }
                @if(matchup.home_picker_id){
                  <div class='mb-2 text-yellow-500'>{{matchup.home_team_name}} already drafted by {{matchup.home_picker}}.</div>
                }
                <input type='text' pInputText class='w-full mb-2' [formControlName]='"text_"+matchup.id' />
                @if(form.get('text_'+matchup.id)?.errors?.['maxlength']){
                  <div class='mb-2 text-red-500'>Text must be 100 characters or less.</div>
                }
                <p-selectButton [options]='[{label: matchup.away_team_name || "Away", value: false, picked: matchup.away_picker_id }, {label: matchup.home_team_name || "Home", value: true, picked: matchup.home_picker_id}]' [formControlName]='matchup.id' optionDisabled='picked' />
                <p-button
                  styleClass='w-full mt-2'
                  label='Draft this pick'
                  [disabled]='!form.valid || (!(form.value.hasOwnProperty(matchup.id))) || form.value[matchup.id] === null || form.value[matchup.id] === undefined || form.value[matchup.id]===""'
                  (onClick)='onDraftThisPick(matchup.id)'/>
              </p-card>
            }
          </form>
      </div>
      }
    }
  `,
    styles: `

  `
})
export default class BowlDraftPageComponent implements OnInit {
  private readonly supabase: SupabaseClient = inject(SupabaseClient);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly standingsService = inject(StandingsService);

  matchups: any[] = [];
  userId: number | undefined;
  JSON = JSON;
  form: FormGroup | undefined;
  loading: boolean = true;
  user = this.authService.user;
  onTheClockUser: any | null = null;
  draftOpen: boolean = false;

  private async onLoad(user: User) {
    const uuid = user.id;

    if (uuid) {
      this.userId = await this.authService.pickerId(uuid) ?? undefined;
    }

    let { data: currentRoundData, error: currentRoundError } = await this.supabase.from('current_round').select('*').single();
    if (!currentRoundData || currentRoundError) {
      this.messageService.add({ detail: 'Error retrieving details on the current round: ' + currentRoundError?.details, severity: 'error' });
      return;
    }
    this.draftOpen = currentRoundData.draft_open;

    let { data: matchupsData, error: matchupsError } = await this.supabase.from('v_bowl_matchup').select('*');
    if (!matchupsData || matchupsError) {
      this.messageService.add({ detail: 'Error retrieving details on the bowl matchups: ' + matchupsError?.details, severity: 'error' });
      return;
    }
    this.matchups = matchupsData ?? [];

    this.matchups = this.matchups.filter((matchup) => {
      if (matchup.away_picker_id === this.userId || matchup.home_picker_id === this.userId) {
        return false;
      }
      if (matchup.away_picker_id && matchup.home_picker_id) {
        return false;
      }
      return true;
    });

    const group: any = {};
    this.matchups.forEach((matchup: any) => {
      group[matchup.id] = new FormControl('');
      group['text_' + matchup.id] = new FormControl('', Validators.maxLength(100));
    });
    this.form = new FormGroup(group);

    this.onTheClockUser = await this.standingsService.onTheClock();

    this.loading = false;
  }

  matchupOptions(matchup: any): string[] {
    return [matchup.away_team, matchup.home_team];
  }

  async onDraftThisPick(matchupId: string) {
    const pick = { picker_id: this.userId!, matchup_id: matchupId, pick_is_home: this.form!.value[matchupId], pick_text: this.form!.value['text_' + matchupId] };
    const { data, error } = await this.supabase.from('pick').insert(pick).select();
    if (error) {
      this.messageService.add({ detail: error.message, severity: 'error' });
    } else {
      this.messageService.add({ detail: 'Pick drafted.', severity: 'success' });
    }
    this.router.navigate(['/draft-central']);
  }

  ngOnInit() {
  }

  constructor() {
    effect(() => {
      const user = this.user();
      if (user) {
        this.onLoad(user);
      }
    })
  }
}
