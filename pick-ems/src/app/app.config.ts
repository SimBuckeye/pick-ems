import { ApplicationConfig, Provider, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideClientHydration(),
    provideSupabase(),
    provideAnimations(),
    MessageService]
};

function provideSupabase(): Provider {
  return {
    provide: SupabaseClient,
    useValue: createClient("https://gurlskirvdndaprqtsfa.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1cmxza2lydmRuZGFwcnF0c2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc4MTEyODQsImV4cCI6MjA0MzM4NzI4NH0.3508WoItjRn-zvxjVgIVv4yaoaVJ8I30gio6vSgjFNg")
  }
}