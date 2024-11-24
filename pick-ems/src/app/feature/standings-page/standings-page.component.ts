import { Component, inject, OnInit } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableModule } from 'primeng/table';
import { StandingsService } from '../../data-access/standings.service';

@Component({
  selector: 'pickems-standings-page',
  standalone: true,
  imports: [TableModule],
  template: `
    <p-table [value]="standings" styleClass="mt-5">
      <ng-template pTemplate="header">
        <tr>
          <th>Picker</th>
          <th>B1G Record</th>
          <th>B1G %</th>
          <th>Total Record</th>
          <th>Total %</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-standing>
        <tr>
          <td [style]="'color: ' + standing.picker_text_color + '; background: ' + standing.picker_background_color + ';'">{{ standing.nickname }}</td>
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

  standings: any;

  private async onLoad(){
    this.standings = await this.standingsService.standings();
  }

  ngOnInit(){
    this.onLoad();
  }
}
