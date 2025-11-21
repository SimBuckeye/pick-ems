import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { Menubar, MenubarModule } from 'primeng/menubar';
import { ToastModule } from 'primeng/toast';
import { AuthService } from './data-access/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'pickems-root',
  imports: [RouterOutlet, ToastModule, MenubarModule, Menubar],
  template: `
  <div>
    @if(loaded()){
      <p-menubar #menubar [model]='menuItems'/>
    }
  </div>
  <p-toast/>
  <router-outlet />
  `,
  styles: ``
})
export class AppComponent implements OnInit {
  title = 'Pick-ems';
  router = inject(Router);
  supabase = inject(SupabaseClient);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  userSubscription: Subscription | null = null;
  @ViewChild('menubar') menuBar: Menubar | undefined;
  loaded = signal(false);

  menuItems = [
    {
      label: 'Standings',
      command: () => this.router.navigate(['/']),
      hidden: true
    },
    {
      label: 'Picks',
      items: [
        {
          label: 'Make Picks',
          command: () => this.router.navigate(['/make-picks'])
        },
        {
          label: 'View Picks',
          command: () => this.router.navigate(['/view-picks'])
        },
      ]
    },
    {
      label: 'User',
      items: [
        {
          label: 'Profile',
          command: () => this.router.navigate(['/profile'])
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
  ];

  ngOnInit(): void {
    this.userSubscription = this.authService.user$.subscribe((user) => {
      this.buildMenuBar(user ? user.id : '');
    });
    this.buildMenuBar('');
  };

  async buildMenuBar(uuid: string) {
    this.loaded.set(false);
    const menuItems = [
      {
        label: 'Standings',
        command: () => this.router.navigate(['/']),
        hidden: true
      },
      {
        label: 'Picks',
        items: [
          {
            label: 'Make Picks',
            command: () => this.router.navigate(['/make-picks'])
          },
          {
            label: 'View Picks',
            command: () => this.router.navigate(['/view-picks'])
          },
        ]
      },
      {
        label: 'User',
        items: [
          {
            label: 'Profile',
            command: () => this.router.navigate(['/profile'])
          },
        ]
      }
    ];

    let { data: roundData, error: roundError } = await this.supabase.from('current_round').select('draft_open').single();
    if (roundError) {
      this.messageService.add({ severity: 'error', detail: 'Error checking draft status: ' + roundError.message });
    } else if (roundData && roundData.draft_open) {
      menuItems[1].items?.push({
        label: 'Draft Central',
        command: () => this.router.navigate(['/draft-central'])
      });
    }

    if (uuid) {
      menuItems[2].items?.push({
        label: 'Log Out',
        command: () => {
          this.supabase.auth.signOut();
          return this.router.navigate(['/login']);
        }
      })
    } else {
      menuItems[2].items?.push({
        label: 'Log In',
        command: () => this.router.navigate(['/login'])
      })
    }

    if (uuid === 'e1320165-692d-4453-a49f-a550b83f7373') {
      menuItems.push({
        label: 'Admin',
        items: [
          {
            label: 'Create Matchup',
            command: () => this.router.navigate(['/admin/create-matchup']),
          },
          {
            label: 'Resolve Matchups',
            command: () => this.router.navigate(['/admin/resolve-matchups']),
          }
        ]
      });
    }

    this.menuItems = menuItems;
    if (this.menuBar) {
      this.menuBar._processedItems = [];
    }

    this.loaded.set(true);
  }
}
