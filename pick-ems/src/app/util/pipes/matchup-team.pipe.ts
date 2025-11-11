import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'awayTeam',
    standalone: true,
    pure: true,
})
export class MatchupAwayTeamPipe implements PipeTransform {
    transform(matchup: any): any {
        if (!matchup) return 'Away';
        var awayTeamText = matchup.away_team_name;
        if (matchup.underdog === 'away_underdog') {
            awayTeamText += ' (U)';
        }
        return awayTeamText;
    }
}

@Pipe({
    name: 'homeTeam',
    standalone: true,
    pure: true,
})
export class MatchupHomeTeamPipe implements PipeTransform {
    transform(matchup: any): any {
        if (!matchup) return 'Home';
        var homeTeamText = matchup.home_team_name;
        console.log('underdog value:', matchup.underdog);
        if (matchup.underdog === 'home_underdog') {
            homeTeamText += ' (U)';
        }
        return homeTeamText;
    }
}