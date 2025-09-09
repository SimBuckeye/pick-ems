import { Component, computed, effect, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableModule } from 'primeng/table';
import { StandingsService } from '../../data-access/standings.service';
import { DropdownModule } from "primeng/dropdown";
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'pickems-standings-page',
  standalone: true,
  imports: [TableModule, DropdownModule, FormsModule],
  template: `
    <p-dropdown 
        styleClass="mt-3 mr-3"
        [options]="years"
        [(ngModel)]="selectedYear"
        placeholder="Select a year"/>
    <p-table [value]="standings()" styleClass="mt-3" [scrollable]="true">
      <ng-template pTemplate="header">
        <tr>
          <th pFrozenColumn>Picker</th>
          @if(includePostseason()){
            <th>Post Record</th>
            <th>Post %</th>
          }
          <th>Points</th>
          <th>B1G Record</th>
          <th>B1G %</th>
          <th>Total Record</th>
          <th>Total %</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-standing>
        <tr>
          <td pFrozenColumn [style]="'color: ' + standing.picker_text_color + '; background: ' + standing.picker_background_color + ';'">{{ standing.nickname }}</td>
          @if(includePostseason()){
            <td>{{ standing.postseason_wins}}-{{standing.postseason_losses}}</td>
            <td>{{ standing.postseason_percentage.toPrecision(3) }}</td>
          }
          <td>{{ standing.points}}</td>
          <td>{{ standing.b1g_wins}}-{{standing.b1g_losses}}</td>
          <td>{{ standing.b1g_percentage.toPrecision(3) }}</td>
          <td>{{ standing.total_wins}}-{{standing.total_losses}}</td>
          <td>{{ standing.total_percentage.toPrecision(3) }}</td>
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

  years: number[] = [];
  selectedYear: WritableSignal<number | null> = signal(null);

  allStandings: WritableSignal<any[]> = signal([]);

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
}
