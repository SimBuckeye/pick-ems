import { Component, computed, effect, HostListener, Inject, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableModule } from 'primeng/table';
import { StandingsService } from '../../data-access/standings.service';
import { DropdownModule } from "primeng/dropdown";
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'pickems-standings-page',
  standalone: true,
  imports: [TableModule, DropdownModule, FormsModule, CheckboxModule],
  template: `
    <div class="mt-3 flex flex-row align-items-center">
      <p-dropdown 
        styleClass="mr-3"
        [options]="years"
        [(ngModel)]="selectedYear"
        placeholder="Select a year"/>
      <label>
        <p-checkbox [(ngModel)]="showExtendedStats" [binary]="true" />
        <span class="ml-2">Extended Stats</span>
      </label>
    </div>
    <!-- If scrollable on large screens, will be hidden by the menubar TODO when updating to primeng 18+ will need more robust solution for smaller breakpoint -->
    <p-table [value]="standings()" styleClass="mt-3" [scrollable]="vpWidth < 960"> 
      <ng-template pTemplate="header">
        <tr>
          <th pFrozenColumn>Picker</th>
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
      <ng-template pTemplate="body" let-standing>
        <tr>
          <td pFrozenColumn [style]="'color: ' + standing.picker_text_color + '; background: ' + standing.picker_background_color + ';'">{{ standing.nickname }}</td>
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
  allStandings: WritableSignal<any[]> = signal([]);
  showExtendedStats = signal(false);

  standings = computed(() => {
    const year = this.selectedYear();
    const allStandings = this.allStandings();
    if (year) {
      return allStandings.filter((standing: any) => standing.year === year);
    } else {
      return [];
    }
  });

  includePostseason = computed(() => {
    const standings = this.standings();
    if (standings && standings.length > 0) {
      return standings.some((standing: any) => standing.postseason_wins > 0 || standing.postseason_losses > 0);
    }
    return false;
  });

  private async onLoad() {
    this.allStandings.set(await this.standingsService.standings());

    let { data: yearsData, error: yearsError } = await this.supabase.from('v_round').select("year");

    if (yearsError) {
      this.messageService.add({ detail: "Error retrieving list of years: " + yearsError.message, severity: "error" });
    } else if (yearsData) {
      this.years = yearsData.map((round: any) => round.year);
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
