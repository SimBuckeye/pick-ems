import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AuthService } from '../../data-access/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { MatchupAwayTeamPipe, MatchupHomeTeamPipe } from '../../util/pipes/matchup-team.pipe';
import { MatchupTitlePipe } from '../../util/pipes/matchup-title.pipe';
import { MatchupModel } from '../../util/types/supabase.types';

@Component({
    selector: 'pickems-make-picks-page',
    imports: [CardModule, SelectButtonModule, ReactiveFormsModule, ButtonModule, InputTextModule, MatchupAwayTeamPipe, MatchupHomeTeamPipe, MatchupTitlePipe],
    template: `
    @if(loading){
      <h2>loading...</h2>
    }@else if(!round()){
      <h2>Not currently accepting picks.</h2>
    }@else if(!userId){
      <h2>Current user not found. Try logging out and back in.</h2>
    }@else if(userHasPicks){
      <h2>You have already submitted picks for the current round.</h2>
    }@else {
      <h4>Picks now available for week {{round()?.name}}. (U): Underdog</h4>

      @if(form){
      <div class='h-full flex flex-column align-items-center'>
          <form
              [formGroup]='form'
              (ngSubmit)='onSubmit()'
              class='w-full max-w-30rem flex flex-column gap-3 px-3'
          >
            @for(matchup of matchups; track matchup.id){
              <p-card [header]='matchup | title'>
                <input type='text' pInputText class='w-full mb-2' [formControlName]='"text_"+matchup.id' />
                @if(form.get('text_'+matchup.id)?.errors?.['maxlength']){
                  <div class='mb-2 text-red-500'>Text must be 100 characters or less.</div>
                }
                <p-selectButton [options]='[{label: matchup | awayTeam, value: false}, {label: matchup | homeTeam, value: true}]' [formControlName]='matchup.id!'/>
              </p-card>
            }
            
            <p-button
            styleClass='w-full'
            type='submit'
            [disabled]='!form.valid'
            [loading]='submitting()'
            label='Submit'
            />
          </form>
      </div>
      }
    }
  `,
    styles: `

  `
})
export default class MakePicksPageComponent implements OnInit {
  private readonly supabase: SupabaseClient = inject(SupabaseClient);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);

  round = signal<{ id: number, name: string } | null>(null);
  matchups: MatchupModel[] = [];
  userId: number | undefined;
  JSON = JSON;
  form: FormGroup | undefined;
  userHasPicks: boolean = false;
  loading: boolean = true;
  user = this.authService.user;
  submitting = signal(false);

  private async onLoad(user: User) {

    let { data: roundData, error: roundError } = await this.supabase.from('round').select('*').eq('state', 'accepting_picks').order('id', { ascending: true }).limit(1);
    if (roundError) {
      this.messageService.add({ detail: 'Error retrieving the list of rounds: ' + roundError.message, severity: 'error' });
      return;
    } else if (roundData && roundData.length > 0) {
      this.round.set(roundData[0]);
    } else {
      this.loading = false;
      return;
    }

    let { data: matchupsData, error: matchupsError } = await this.supabase.from('v_matchup').select('*').eq('round', this.round()?.id).order('id', { ascending: true });
    if (matchupsError) {
      this.messageService.add({ detail: 'Error retrieving details on the current matchups: ' + matchupsError?.message, severity: 'error' });
    } else if (matchupsData) {
      this.matchups = [];
      const group: Record<string, FormControl> = {};
      matchupsData.forEach((matchup: any) => {
        if (!matchup.is_postseason || matchup.is_b1g_postseason) {
          this.matchups.push(matchup);
          group[matchup.id] = new FormControl('', Validators.required);
          group['text_' + matchup.id] = new FormControl('', Validators.maxLength(100));
        }
      });
      this.form = new FormGroup(group);
    }

    const uuid = user.id;
    if (uuid) {
      let { data: userData, error: userError } = await this.supabase.from('auth_user').select('*').eq('uuid', uuid);
      if (userError) {
        this.messageService.add({ detail: 'Error retrieving details on the logged-in user: ' + userError?.details, severity: 'error' });
      }
      if (userData && userData.length === 1) {
        this.userId = userData[0].id;
      }
    }

    if (this.userId && this.round()) {
      let { data: pickResultData, error: pickResultError } = await this.supabase.from('v_pick_result').select('*').eq('picker_id', this.userId).eq('round', this.round()?.id);
      if (pickResultError) {
        this.messageService.add({ detail: 'Error retrieving the list of picks: ' + pickResultError?.details, severity: 'error' });
        this.userHasPicks = true;
      }
      if (pickResultData && pickResultData.length > 0) {
        this.userHasPicks = true;
      }
    }

    this.loading = false;
  }

  matchupOptions(matchup: any): string[] {
    return [matchup.away_team, matchup.home_team];
  }

  async onSubmit() {
    this.submitting.set(true);
    let picks: { pick_is_home: boolean, picker_id: number, matchup_id: string, pick_text: string }[] = [];
    let formResponse = this.form?.value;
    Object.keys(formResponse).forEach((matchupId) => {
      if (matchupId.includes('text')) {
        return;
      }
      picks.push({ picker_id: this.userId!, matchup_id: matchupId, pick_is_home: formResponse[matchupId], pick_text: formResponse['text_' + matchupId] })
    });
    const { error: insertError } = await this.supabase.from('pick').insert(picks).select();
    if (insertError) {
      this.messageService.add({ detail: insertError.message, severity: 'error' });
    } else {
      this.messageService.add({ detail: 'Picks submitted.', severity: 'success' })
    }
    this.submitting.set(false);
    this.router.navigate(['/']);
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
