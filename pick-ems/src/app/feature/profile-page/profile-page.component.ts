import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from "primeng/inputtext";

@Component({
  selector: 'pickems-profile-page',
  standalone: true,
  imports: [FormsModule, InputTextModule, ColorPickerModule, ButtonModule],
  template: `
  @if(loading()){
      <h2>Loading...</h2>
  }@else{
    <div class='mt-2'>
      <div [style]="'color: ' + textColor() + '; background: ' + backgroundColor() + ';'" >{{ nickname() }}</div>
      <label class='w-full flex flex-row align-items-center'>
        <span class='w-5rem' >Name:</span>
        <input class='my-2 ml-2 flex-1' pInputText type="text" [value]="name()" readonly/>
      </label>
      <label class='w-full flex flex-row align-items-center'>
        <span class='w-5rem' >Email:</span>
        <input class='my-2 ml-2 flex-1' pInputText type="text" [(ngModel)]="email"/>
      </label>
      <label class='w-full flex flex-row align-items-center'>
        <span class='w-5rem' >Nickname:</span>
        <input class='my-2 ml-2 flex-1' pInputText type="text" [(ngModel)]="nickname" maxlength=12/>
      </label>
      <label class='w-full flex flex-row align-items-center'>
        <span class='w-10rem'>Text Color:</span>
        <p-colorPicker class='ml-2 my-2' [(ngModel)]='textColor'/>
        <input class='ml-2' pInputText type="text" [(ngModel)]='textColor' maxlength=7/>
      </label>
      <label class='w-full flex flex-row align-items-center'>
        <span class='w-10rem'>Background Color:</span>
        <p-colorPicker class='ml-2 my-2' [(ngModel)]='backgroundColor'/>
        <input class='ml-2' pInputText type="text" [(ngModel)]='backgroundColor' maxlength=7/>
      </label> 
      <p-button class='mt-2' (onClick)='save()' type="submit" [disabled]='saveDisabled()'>Save</p-button>
    </div>
  }
    `,
  styles: `

  `
})
export default class ProfilePageComponent implements OnInit {
  private readonly supabase: SupabaseClient = inject(SupabaseClient);
  private readonly messageService = inject(MessageService);
  email = signal<string>('');
  name = signal<string>('');
  nickname = signal<string>('');
  textColor = signal<string>('');
  backgroundColor = signal<string>('');
  loading = signal<boolean>(true);

  private oldEmail = '';
  private userId = '';

  saveDisabled = computed(() => {
    const email = this.email();
    const name = this.name();
    const nickname = this.nickname();
    const textColor = this.textColor();
    const backgroundColor = this.backgroundColor();
    return this.loading() || !email || !name || !nickname || !textColor || !backgroundColor;
  });

  private onLoad() {
    this.supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        this.messageService.add({ detail: "Error retrieving user details: " + error.message, severity: "error" });
        return;
      }
      if (user) {
        this.userId = user.id;
        this.email.set(user.email || '');
        this.oldEmail = user.email || '';
        this.supabase.from('auth_user').select('*').eq('uuid', user.id).single().then(({ data, error }) => {
          if (error) {
            this.messageService.add({ detail: "Error retrieving user profile: " + error.message, severity: "error" });
            return;
          }
          if (data) {
            this.name.set(data.name);
            this.nickname.set(data.nickname);
            this.textColor.set(data.text_color || '#000000');
            this.backgroundColor.set(data.background_color || '#ffffff');
          }
          this.loading.set(false);
        });
      }
    });
  }

  async save() {
    if (this.email() !== this.oldEmail) {
      const { error: updateError } = await this.supabase.auth.updateUser({ email: this.email() });
      if (updateError) {
        this.messageService.add({ detail: "Error updating email: " + updateError.message, severity: "error" });
      } else {
        this.oldEmail = this.email();
        this.messageService.add({ detail: "Email update request submitted. You must accept the confirmation link from both your old and new email addresses.", severity: "success", life: 15000 });
      }
    }

    const newRecord = {
      nickname: this.nickname(),
      text_color: this.textColor(),
      background_color: this.backgroundColor()
    };
    console.log(JSON.stringify(newRecord));
    console.log(this.userId);

    this.supabase.from('auth_user').update(newRecord).eq('uuid', this.userId).select().then(({ error }) => {
      if (error) {
        this.messageService.add({ detail: "Error updating profile: " + error.message, severity: "error" });
      } else {
        this.messageService.add({ detail: "Profile updated.", severity: "success" });
      }
    });
  }

  ngOnInit(): void {
    this.onLoad();
  }
}