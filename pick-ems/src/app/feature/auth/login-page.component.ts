import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseClient } from '@supabase/supabase-js';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'login-page',
    imports: [CommonModule, InputTextModule, ButtonModule, ReactiveFormsModule],
    template: `
        <div class='h-full flex flex-column justify-content-center align-items-center'>
            <form
                [formGroup]='form'
                (ngSubmit)='onSubmit()'
                class='w-full max-w-30rem flex flex-column gap-3 px-3'
            >
                <!-- Username -->
                <input
                pInputText
                type='text'
                placeholder='Username'
                [formControl]='form.controls.username'
                />

                <!-- Password -->
                <input
                pInputText
                type='password'
                placeholder='Password'
                [formControl]='form.controls.password'
                />

                <!-- Log In Button -->
                <p-button
                styleClass='w-full'
                type='submit'
                [disabled]='!form.valid'
                label='Log In'
                />
            </form>
        </div>
    `,
    styles: `
    
    `
})
export default class LoginPageComponent implements OnInit {
    private readonly supabase = inject(SupabaseClient);
    private readonly formBuilder = inject(FormBuilder);
    private readonly messageService = inject(MessageService);
    returnUrl: string = '/';

    readonly form = this.formBuilder.nonNullable.group({
        username: ['', Validators.required],
        password: ['', Validators.required],
    });

    constructor(private route: ActivatedRoute, private router: Router) { }

    onSubmit(): void {
        const { username, password } = this.form.getRawValue();
        this.supabase.auth.signInWithPassword({
            email: username,
            password: password
        }).then((response) => {
            if (response.error) {
                this.messageService.add({ severity: 'error', detail: response.error.message })
            } else {
                this.router.navigateByUrl(this.returnUrl);
            }
        });
    }

    ngOnInit() {
        this.route.queryParams.subscribe((params) => {
            this.returnUrl = params['returnUrl'] || '/';
        })
    }
}