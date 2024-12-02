import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SupabaseClient } from '@supabase/supabase-js';
import { MenubarModule } from 'primeng/menubar';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'pickems-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule, MenubarModule],
  template: `
  <div className="pick-ems">
    <p-menubar [model]="menuItems" autoHide="false" />
  </div>
  <p-toast/>
  <router-outlet />
  `,
  styles: `
  `
})
export class AppComponent {
  title = 'Pick-ems';
  router = inject(Router);
  supabase = inject(SupabaseClient);

  menuItems = [
    {
      label: 'Standings',
      command: () => this.router.navigate(["/standings"])
    },
    {
      label: 'Make Picks',
      command: () => this.router.navigate(["/make-picks"])
    },
    {
      label: 'View Picks',
      command: () => this.router.navigate(["/view-picks"]) 
    },
    {
      label: 'Draft Central',
      command: () => this.router.navigate(["/draft-central"])
    },
    {
      label: 'Log Out',
      command: () => {
        this.supabase.auth.signOut();
        this.router.navigate(['/login']);
      }
    }
  ]
}
