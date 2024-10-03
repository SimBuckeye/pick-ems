import { Component, inject, OnInit } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-standings-page',
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
          <td>{{ standing.nickname }}</td>
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
  standings: any;

  private async onLoad(){
    let { data, error } = await this.supabase.from('v_standings').select('*');
    if(!error){
      this.standings = data;
    }
  }

  ngOnInit(){
    this.onLoad();
  }
}
