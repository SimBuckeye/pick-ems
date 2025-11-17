import { ApplicationConfig, Provider, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Database } from './util/types/supabase.schema';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeuix/themes/aura';

const preset = definePreset(Aura, {
  extend: {
    semantic: {
      primary: {
        50: '{pink.50}',
        100: '{pink.100}',
        200: '{pink.200}',
        300: '{pink.300}',
        400: '{pink.400}',
        500: '{pink.500}',
        600: '{pink.600}',
        700: '{pink.700}',
        800: '{pink.800}',
        900: '{pink.900}',
        950: '{pink.950}',
      },
    },
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(),
    provideSupabase(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: preset,
        options: {
          darkModeSelector: '.pick-ems-dark',
          cssLayer: false
        }
      }
    }),
    MessageService]
};

function provideSupabase(): Provider {
  return {
    provide: SupabaseClient,
    useValue: createClient<Database>("https://gurlskirvdndaprqtsfa.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1cmxza2lydmRuZGFwcnF0c2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc4MTEyODQsImV4cCI6MjA0MzM4NzI4NH0.3508WoItjRn-zvxjVgIVv4yaoaVJ8I30gio6vSgjFNg")
  }
}