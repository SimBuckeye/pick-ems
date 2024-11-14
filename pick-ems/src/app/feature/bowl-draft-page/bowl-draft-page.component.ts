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

@Component({
  selector: 'pickems-bowl-draft-page',
  standalone: true,
  imports: [CardModule, SelectButtonModule, ReactiveFormsModule, ButtonModule, InputTextModule],
  template: `
    @if(loading){
      <h2>loading...</h2>
    }@else if(!userId){
      <h2>Current user not found. Try logging out and back in.</h2>
    }@else {
      <h4>You are on the clock! Please select one of the options below.</h4>

      @if(form){
      <div class="h-full flex flex-column align-items-center">
          <form
              [formGroup]="form"
              class="w-full max-w-30rem flex flex-column gap-3 px-3"
          >
            @for(matchup of matchups; track matchup.id){
              <p-card [header]="matchup.matchup_title">
                <input type="text" pInputText class="w-full mb-2" [formControlName]="'text_'+matchup.id" />
                @if(form.get('text_'+matchup.id)?.errors?.['maxlength']){
                  <div class="mb-2 text-red-500">Text must be 100 characters or less.</div>
                }
                <p-selectButton [options]="[{label: matchup.away_team_name || 'Away', value: false}, {label: matchup.home_team_name || 'Home', value: true}]" [formControlName]="matchup.id"/>
                <p-button
                  styleClass="w-full mt-2"
                  label="Draft this pick"
                  [disabled]="!form.valid || (!(form.value.hasOwnProperty(matchup.id))) || form.value[matchup.id] === null || form.value[matchup.id] === undefined || form.value[matchup.id]===''"
                  (onClick)="onDraftThisPick(matchup.id)"/>
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

  matchups: any[] = [];
  userId: number | undefined;
  JSON = JSON;
  form: FormGroup | undefined;
  loading: boolean = true;
  user = this.authService.user;
  pickedMatchups: number[] = [];

  private async onLoad(user: User) {
    let {data: picksData, error: picksError} = await this.supabase.from('v_pick_result').select("*").eq('is_postseason', true);
    if(picksError){
      this.messageService.add({ detail: "Error retrieving list of made picks: " + picksError?.details, severity: "error"});
    }else{
      this.pickedMatchups = picksData?.map((pick) => pick.matchup_id) ?? [];
    }

    let {data: matchupsData, error: matchupsError} = await this.supabase.from('v_matchup').select("*").eq('is_postseason', true).eq('is_b1g_postseason', false);
    if(matchupsError){
      this.messageService.add({ detail: "Error retrieving details on the current matchups: " + matchupsError?.details, severity: "error"});
    } else {
      this.matchups = matchupsData ?? [];
      this.matchups = this.matchups.filter((matchup) => !this.pickedMatchups.includes(matchup.id));
      const group: any = {};
      this.matchups.forEach((matchup: any) => {
        group[matchup.id] = new FormControl('');
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

    this.loading = false;
  }

  matchupOptions(matchup: any): string[]{
    return [matchup.away_team, matchup.home_team];
  }

  async onDraftThisPick(matchupId: string){
    const pick = {picker_id: this.userId!, matchup_id: matchupId, pick_is_home: this.form!.value[matchupId], pick_text: this.form!.value['text_'+matchupId]};
    const {data, error} = await this.supabase.from('pick').insert(pick).select();
    if(error){
      this.messageService.add({detail: error.details, severity: "error"});
    }else{
      this.messageService.add({detail: "Pick drafted.", severity: "success"});
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
