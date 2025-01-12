import { CommonModule } from "@angular/common";
import { Component, inject, Input, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { SupabaseClient } from "@supabase/supabase-js";

@Component({
    selector: 'auth/confirm',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="mt-3">
            {{error || "Confirming..."}}
        </div>
    `,
    styles: `
    
    `,
})
export default class ConfirmComponent implements OnInit {
    private readonly supabase = inject(SupabaseClient);

    @Input() token_hash!: string;

    error: string = "";

    constructor(private route: ActivatedRoute, private router: Router){}

    async verify() {
        const token_hash = this.token_hash;
        const type = "magiclink";
        const { error } = await this.supabase.auth.verifyOtp({
            token_hash, type
        })
        if(error){
            this.error = error.message;
        }else{
            this.router.navigate(["/"]);
        }
    }

    ngOnInit() {
        this.verify();
    }
}