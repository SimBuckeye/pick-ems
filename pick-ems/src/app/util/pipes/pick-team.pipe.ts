import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'awayTeam',
    standalone: true,
    pure: true,
})
export class PickAwayTeamPipe implements PipeTransform {
    transform(pick: any): any {
        if (!pick) return 'Away';
        var awayTeamText = pick.away_team;
        if (pick.underdog === 'away_underdog') {
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
export class PickHomeTeamPipe implements PipeTransform {
    transform(pick: any): any {
        if (!pick) return 'Home';
        var homeTeamText = pick.home_team;
        if (pick.underdog === 'home_underdog') {
            homeTeamText += ' (U)';
        }
        return homeTeamText;
    }
}