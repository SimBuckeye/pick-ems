import { Pipe, PipeTransform } from '@angular/core';
import { MatchupAwayTeamPipe, MatchupHomeTeamPipe } from './matchup-team.pipe';

@Pipe({
    name: 'title',
    standalone: true,
    pure: true
})
export class MatchupTitlePipe implements PipeTransform {
    transform(matchup: any): any {
        const matchupAwayTeamPipe = new MatchupAwayTeamPipe();
        const matchupHomeTeamPipe = new MatchupHomeTeamPipe();

        return matchup.matchup_title || matchupAwayTeamPipe.transform(matchup) + " @ " + matchupHomeTeamPipe.transform(matchup);
    }
}