import { Component, computed, effect, HostListener, Inject, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableModule } from 'primeng/table';
import { StandingsService } from '../../data-access/standings.service';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { DOCUMENT } from '@angular/common';
import { VRoundModel, VStandingsModel } from '../../util/types/supabase.types';
import { StandingPickerStylePipe } from '../../util/pipes/standing-picker-style.pipe';

@Component({
  selector: 'pickems-standings-page',
  standalone: true,
  imports: [TableModule, DropdownModule, FormsModule, CheckboxModule, StandingPickerStylePipe],
  template: `
    <div class='mt-3 flex flex-row align-items-center'>
      <p-dropdown 
        styleClass='mr-3'
        [options]='years'
        [(ngModel)]='selectedYear'
        placeholder='Select a year'/>
      <label>
        <div class='flex flex-row align-items-center'>
          <p-checkbox [(ngModel)]='showExtendedStats' [binary]='true' />
          <span class='ml-2'>Extended Stats</span>
        </div>
      </label>
      <label class='ml-4'>
        <div class='flex flex-row align-items-center'>
          <p-checkbox [(ngModel)]='showLastWeekRecord' [binary]='true' />
          <span class='ml-2'>Last Week</span>
        </div>
      </label>
    </div>
    <!-- If scrollable on large screens, will be hidden by the menubar TODO when updating to primeng 18+ will need more robust solution for smaller breakpoint -->
    <p-table [value]='standings()' styleClass='mt-3' [scrollable]='vpWidth < 960'> 
      <ng-template pTemplate='header'>
        <tr>
          <th pFrozenColumn>Picker</th>
          @if(showLastWeekRecord()){
            <th>Last Week</th>
          }
          @if(includePostseason()){
            <th>Post Record</th>
            @if(showExtendedStats()){
              <th>Post %</th>
            }
          }
          <th>Points</th>
          <th>B1G Record</th>
          @if(showExtendedStats()){
            <th>B1G %</th>
          }
          <th>Total Record</th>
          @if(showExtendedStats()){
            <th>Total %</th>
          }
        </tr>
      </ng-template>
      <ng-template pTemplate='body' let-standing>
        <tr>
          <td pFrozenColumn [style]='standing | pickerStyle'>{{ standing.nickname }}</td>
          @if(showLastWeekRecord()){
            <td>{{ standing.last_week_results}}</td>
          }
          @if(includePostseason()){
            <td>{{ standing.postseason_wins}}-{{standing.postseason_losses}}</td>
            @if(showExtendedStats()){
              <td>{{ standing.postseason_percentage.toPrecision(3) }}</td>
            }
          }
          <td>{{ standing.points}}</td>
          <td>{{ standing.b1g_wins}}-{{standing.b1g_losses}}</td>
          @if(showExtendedStats()){
            <td>{{ standing.b1g_percentage.toPrecision(3) }}</td>
          }
          <td>{{ standing.total_wins}}-{{standing.total_losses}}</td>
          @if(showExtendedStats()){
            <td>{{ standing.total_percentage.toPrecision(3) }}</td>
          }
        </tr>
      </ng-template>
    </p-table>
  `,
  styles: `
  
  `,
})
export default class StandingsPageComponent implements OnInit {
  private readonly supabase: SupabaseClient = inject(SupabaseClient);
  private readonly standingsService = inject(StandingsService);
  private readonly messageService = inject(MessageService);

  vpWidth = 960;
  years: number[] = [];
  selectedYear: WritableSignal<number | null> = signal(null);
  allStandings: WritableSignal<VStandingsModel[]> = signal([]);
  showExtendedStats = signal(false);
  showLastWeekRecord = signal(false);

  standings = computed(() => {
    const year = this.selectedYear();
    const allStandings = this.allStandings();
    if (year) {
      return allStandings.filter((standing: VStandingsModel) => standing.year === year);
    } else {
      return [];
    }
  });

  includePostseason = computed(() => {
    const standings = this.standings();
    if (standings && standings.length > 0) {
      return standings.some((standing: VStandingsModel) => standing.postseason_wins! > 0 || standing.postseason_losses! > 0);
    }
    return false;
  });

  private async onLoad() {
    this.allStandings.set(await this.standingsService.standings());

    let { data: yearsData, error: yearsError } = await this.supabase.from('v_round').select<'year', VRoundModel>('year');

    if (yearsError) {
      this.messageService.add({ detail: 'Error retrieving list of years: ' + yearsError.message, severity: 'error' });
    } else if (yearsData) {
      this.years = yearsData.map((round: VRoundModel) => round.year!);
      if (this.years && this.years.length > 0) {
        this.selectedYear.set(this.years[0]);
      }
    }
  }

  ngOnInit() {
    this.onLoad();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.vpWidth = event.target.innerWidth;
  }

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.vpWidth = this.document.documentElement.clientWidth;
    document.addEventListener('resize', () => {
      this.vpWidth = this.document.documentElement.clientWidth;
    });
  }
}
