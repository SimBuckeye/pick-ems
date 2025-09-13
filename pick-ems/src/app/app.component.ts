import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { Menubar, MenubarModule } from 'primeng/menubar';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'pickems-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule, MenubarModule],
  template: `
  <div className="pick-ems">
    @if(loaded()){
      <p-menubar #menubar [model]="menuItems()"/>
    }
  </div>
  <p-toast/>
  <router-outlet />
  `,
  styles: `
  `
})
export class AppComponent implements OnInit {
  title = 'Pick-ems';
  router = inject(Router);
  supabase = inject(SupabaseClient);
  private readonly messageService = inject(MessageService);
  @ViewChild('menubar') menuBar: Menubar | undefined;
  loaded = signal(false);

  menuItems = signal([
    {
      label: 'Standings',
      command: () => this.router.navigate(["/"])
    },
    {
      label: 'Picks',
      items: [
        {
          label: 'Make Picks',
          command: () => this.router.navigate(["/make-picks"])
        },
        {
          label: 'View Picks',
          command: () => this.router.navigate(["/view-picks"])
        },
      ]
    },
    {
      label: 'Log Out',
      command: () => {
        this.supabase.auth.signOut();
        this.router.navigate(['/login']);
      }
    }
  ]);

  ngOnInit(): void {
    this.supabase.from('current_round').select('draft_open').single().then((
      { data, error }) => {
      if (error) {
        this.messageService.add({ severity: 'error', detail: 'Error checking draft status: ' + error.message });
      } else if (data && data.draft_open && this.menuBar) {
        const menuItems = this.menuItems();
        menuItems[1].items?.push({
          label: 'Draft Central',
          command: () => this.router.navigate(["/draft-central"])
        });
        this.menuItems.set(menuItems);
        this.menuBar._processedItems = [];
      }
      this.loaded.set(true);
    });
  }
}
