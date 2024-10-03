import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseClient } from '@supabase/supabase-js';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';

@Component({
  selector: 'app-make-picks-page',
  standalone: true,
  imports: [CardModule, SelectButtonModule, ReactiveFormsModule, ButtonModule],
  template: `
    <div>{{JSON.stringify(user)}}</div>
    @if(picksAreLocked){
      <h2>Picks are currently locked</h2>
    }@else {
      <h4>Picks now available for week {{currentRound.week}}. Picks lock at {{picksLockAt}}.</h4>

      @if(form){
      <div class="h-full flex flex-column align-items-center">
          <form
              [formGroup]="form"
              (ngSubmit)="onSubmit()"
              class="w-full max-w-30rem flex flex-column gap-3 px-3"
          >
            @for(matchup of matchups; track matchup.id){
              <p-card [header]="matchup.away_team_name + ' @ ' + matchup.home_team_name">
                <p-selectButton [options]="[{label: matchup.away_team_name || 'Away', value: false}, {label: matchup.home_team_name || 'Home', value: true}]" [formControlName]="matchup.id"/>
              </p-card>
            }

            <!-- Log In Button -->
            <p-button
            styleClass="w-full"
            type="submit"
            [disabled]="!form.valid"
            label="Log In"
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

  currentRound: any;
  picksLockAt: Date | undefined;
  picksAreLocked: boolean = true;
  matchups: any;
  userId: number | undefined;
  JSON = JSON;
  form: FormGroup | undefined;
  user: any;

  private async onLoad() {
    let { data, error } = await this.supabase.from('current_round').select('*');
    if (!error && data && data.length > 0) {
      this.currentRound = data[0];
      this.picksLockAt = new Date(this.currentRound.picks_lock_at);
      if(new Date() < this.picksLockAt){
        this.picksAreLocked = false;
      }
    }

    let {data: matchupsData, error: matchupsError} = await this.supabase.from('v_matchup').select("*").eq('week',6);
    if(!matchupsError){
      this.matchups = matchupsData;
      const group: any = {};
      this.matchups.forEach((matchup: any) => {
        group[matchup.id] = new FormControl('', Validators.required)
      });
      this.form = new FormGroup(group);
    }

    const uuid = (await this.supabase.auth.getUser()).data.user?.id;
    if(uuid){
      let {data: userData, error: userError} = await this.supabase.from("auth_user").select("*").eq('uuid', uuid);
      if(!userError && userData && userData.length === 1){
        this.userId = userData[0].id;
      }
    }

    this.user = this.supabase.auth.getUser();
  }

  matchupOptions(matchup: any): string[]{
    return [matchup.away_team, matchup.home_team];
  }

  onSubmit(){
    console.log(JSON.stringify(this.form?.value));
  }

  ngOnInit() {
    this.onLoad();
  }
}
