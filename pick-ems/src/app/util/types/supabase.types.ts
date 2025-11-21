import { Database } from "./supabase.generated";

export type AuthUserModel = Omit<Database['public']['Tables']['auth_user']['Row'], 'created_at'>;
export type CurrentRoundModel = Omit<Database['public']['Tables']['current_round']['Row'], 'created_at'>;
export type MatchupModel = Omit<Database['public']['Tables']['matchup']['Row'], 'created_at'>;
export type PickModel = Omit<Database['public']['Tables']['pick']['Row'], 'created_at'>;
export type RoundModel = Omit<Database['public']['Tables']['round']['Row'], 'created_at'>;
export type TeamModel = Omit<Database['public']['Tables']['team']['Row'], 'created_at'>;

export type VBowlMatchupModel = Database['public']['Views']['v_bowl_matchup']['Row'];
export type VMatchupModel = Database['public']['Views']['v_matchup']['Row'];
export type VPickResultModel = NonNullable<Database['public']['Views']['v_pick_result']['Row']>;
export type VRoundModel = Database['public']['Views']['v_round']['Row'];
export type VStandingsModel = Database['public']['Views']['v_standings']['Row'];

export enum Functions {
    f_on_the_clock = 'f_on_the_clock',
    f_users_for_year = 'f_users_for_year',
    get_last_week_results_for_picker = 'f_last_week_results_for_picker',
    insert_matchup = 'insert_matchup',
}

export type Round_State = Database['public']['Enums']['Round_State'];
export type Underdog_Type = Database['public']['Enums']['Underdog_Type'];