import { ApplicationConfig, Provider, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Database } from './util/types/supabase.generated';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeuix/themes/aura';
import { provideServiceWorker } from '@angular/service-worker';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

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
    MessageService,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })]
}; const firebaseConfig = {
  apiKey: "AIzaSyC8tLyIU5qbHDflEuhuyogmDIBz3PYn0bk",
  authDomain: "pick-ems-9704b.firebaseapp.com",
  // The value of `databaseURL` depends on the location of the database
  databaseURL: "https://pick-ems-9704b-default-rtdb.firebaseio.com/",
  projectId: "pick-ems-9704b",
  // The value of `storageBucket` depends on when you provisioned your default bucket
  storageBucket: "pick-ems-9704b.firebasestorage.app",
  messagingSenderId: "874445096448",
  appId: "1:874445096448:web:8b9a1bb6dcc1800183bae5",
  // For Firebase JavaScript SDK v7.20.0 and later, `measurementId` is an optional field
  measurementId: "G-L46NLPC81H",
};

initializeApp(firebaseConfig);

function provideSupabase(): Provider {
  return {
    provide: SupabaseClient,
    useValue: createClient<Database>("https://gurlskirvdndaprqtsfa.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1cmxza2lydmRuZGFwcnF0c2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc4MTEyODQsImV4cCI6MjA0MzM4NzI4NH0.3508WoItjRn-zvxjVgIVv4yaoaVJ8I30gio6vSgjFNg")
  }
}