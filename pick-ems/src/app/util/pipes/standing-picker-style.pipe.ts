import { Pipe, PipeTransform } from '@angular/core';
import { MatchupAwayTeamPipe, MatchupHomeTeamPipe } from './matchup-team.pipe';
import { VStandingsModel } from '../types/supabase.types';

@Pipe({
    name: 'pickerStyle',
    standalone: true,
    pure: true
})
export class StandingPickerStylePipe implements PipeTransform {
    transform(standing: Pick<VStandingsModel, 'picker_text_color' | 'picker_background_color'>): any {
        return 'color: ' + standing.picker_text_color + '; background: ' + standing.picker_background_color + ';';
    }
}