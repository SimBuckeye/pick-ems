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
          @if(includePostseason){
            <th>Post Record</th>
            <th>Post %</th>
          }
          <th>B1G Record</th>
          <th>B1G %</th>
          <th>Total Record</th>
          <th>Total %</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-standing>
        <tr>
          <td [style]="'color: ' + standing.picker_text_color + '; background: ' + standing.picker_background_color + ';'">{{ standing.nickname }}</td>
          @if(includePostseason){
            <td>{{ standing.postseason_wins}}-{{standing.postseason_losses}}</td>
            <td>{{ standing.postseason_percentage.toPrecision(3) }}</td>
          }
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
  includePostseason = false;

  private async onLoad(){
    this.standings = await this.standingsService.standings();
    if(this.standings.length > 0){
      this.includePostseason = this.standings.some((standing: any) => standing.postseason_wins > 0 || standing.postseason_losses > 0);
    }
  }

  ngOnInit(){
    this.onLoad();
  }
}
