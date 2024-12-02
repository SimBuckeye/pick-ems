import { Component, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AuthService } from '../../data-access/auth.service';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'pickems-make-picks-page',
  standalone: true,
  imports: [CardModule, SelectButtonModule, ReactiveFormsModule, ButtonModule, InputTextModule],
  template: `
    @if(loading){
      <h2>loading...</h2>
    }@else if(!round){
      <h2>Not currently accepting picks.</h2>
    }@else if(!userId){
      <h2>Current user not found. Try logging out and back in.</h2>
    }@else if(userHasPicks){
      <h2>You have already submitted picks for the current round.</h2>
    }@else {
      <h4>Picks now available for week {{round.name}}.</h4>

      @if(form){
      <div class="h-full flex flex-column align-items-center">
          <form
              [formGroup]="form"
              (ngSubmit)="onSubmit()"
              class="w-full max-w-30rem flex flex-column gap-3 px-3"
          >
            @for(matchup of matchups; track matchup.id){
              <p-card [header]="matchup.matchup_title || (matchup.away_team_name + ' @ ' + matchup.home_team_name)">
                <input type="text" pInputText class="w-full mb-2" [formControlName]="'text_'+matchup.id" />
                @if(form.get('text_'+matchup.id)?.errors?.['maxlength']){
                  <div class="mb-2 text-red-500">Text must be 100 characters or less.</div>
                }
                <p-selectButton [options]="[{label: matchup.away_team_name || 'Away', value: false}, {label: matchup.home_team_name || 'Home', value: true}]" [formControlName]="matchup.id"/>
              </p-card>
            }
            <!-- Log In Button -->
            <p-button
            styleClass="w-full"
            type="submit"
            [disabled]="!form.valid"
            label="Submit"
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

  round: any;
  matchups: any;
  userId: number | undefined;
  JSON = JSON;
  form: FormGroup | undefined;
  userHasPicks: boolean = false;
  loading: boolean = true;
  user = this.authService.user;

  private async onLoad(user: User) {

    let {data: roundData, error: roundError} = await this.supabase.from('round').select("*").eq("state", 'accepting_picks');
    if(roundError){
      this.messageService.add({detail: "Error retrieving the list of rounds: " + roundError.details, severity: "error"});
      return;
    }else if(roundData && roundData.length > 0){
      this.round = roundData[0];
    }

    let {data: matchupsData, error: matchupsError} = await this.supabase.from('v_matchup').select("*").eq('round',this.round.id);
    if(matchupsError){
      this.messageService.add({ detail: "Error retrieving details on the current matchups: " + matchupsError?.details, severity: "error"});
    } else {
      this.matchups = matchupsData;
      const group: any = {};
      this.matchups.forEach((matchup: any) => {
        group[matchup.id] = new FormControl('', Validators.required);
        group['text_'+matchup.id] = new FormControl('', Validators.maxLength(100));
      });
      this.form = new FormGroup(group);
    }

    const uuid = user.id;
    if(uuid){
      let {data: userData, error: userError} = await this.supabase.from("auth_user").select("*").eq('uuid', uuid);
      if(userError){
        this.messageService.add({ detail: "Error retrieving details on the logged-in user: " + userError?.details, severity: "error"});
      }
      if(userData && userData.length === 1){
        this.userId = userData[0].id;
      }
    }

    if(this.userId && this.round){
      let {data: pickResultData, error: pickResultError} = await this.supabase.from("v_pick_result").select("*").eq('picker_id', this.userId).eq('round', this.round.id);
      if(pickResultError){
        this.messageService.add({ detail: "Error retrieving the list of picks: " + pickResultError?.details, severity: "error"});
        this.userHasPicks = true;
      }
      if(pickResultData && pickResultData.length > 0){
        this.userHasPicks = true;
      }
    }

    this.loading = false;
  }

  matchupOptions(matchup: any): string[]{
    return [matchup.away_team, matchup.home_team];
  }

  async onSubmit(){
    let picks: {pick_is_home: boolean, picker_id: number, matchup_id: string, pick_text: string}[] = [];
    let formResponse = this.form?.value;
    Object.keys(formResponse).forEach((matchupId) => {
      if(matchupId.includes('text')){
        return;
      }
      picks.push({picker_id: this.userId!, matchup_id: matchupId, pick_is_home: formResponse[matchupId], pick_text: formResponse['text_'+matchupId] })
    });
    const {data, error} = await this.supabase.from('pick').insert(picks).select();
    if(error){
      this.messageService.add({detail: error.details, severity: "error"});
    }else{
      this.messageService.add({detail: "Picks submitted.", severity: "success"})
    }
    this.router.navigate(["/"]);
  }

  ngOnInit() {
  }

  constructor(){
    effect(() =>{
      const user = this.user();
      if (user) {
        this.onLoad(user);
      }
    })
  }
}
