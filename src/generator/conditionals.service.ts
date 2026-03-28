import { Injectable } from '@nestjs/common';
import { MS_OPTION_LOOKUP } from '../common/multiselects';
import { stringToInt, geometricWeights } from '../common/utils';

@Injectable()
export class ConditionalsService {
  parseConditionals(
    conditionalList: Record<string, any[]>,
    weightDict: Record<string, any>,
    randomSettings: Record<string, any>,
    extraStartingItems: Record<string, any>,
  ): void {
    for (const [cond, details] of Object.entries(conditionalList)) {
      if (details[0]) {
        if (typeof (this as any)[cond] === 'function') {
          (this as any)[cond](randomSettings, {
            weightDict,
            extraStartingItems,
            cparams: details.slice(1),
          });
        }
      }
    }
  }

  constant_triforce_hunt_extras(randomSettings: any): void {
    randomSettings['triforce_count_per_world'] = Math.ceil(
      randomSettings['triforce_goal_per_world'] * 1.25,
    );
  }

  exclude_minimal_triforce_hunt(
    randomSettings: any,
    { weightDict }: any,
  ): void {
    const weights = { ...weightDict['item_pool_value'] };
    if (weights['minimal'] && randomSettings['triforce_hunt'] === 'true') {
      delete weights['minimal'];
    }
    randomSettings['item_pool_value'] = this.randomChoice(weights);
  }

  exclude_ice_trap_misery(randomSettings: any, { weightDict }: any): void {
    const weights = { ...weightDict['junk_ice_traps'] };
    if (['quadruple', 'ohko'].includes(randomSettings['damage_multiplier'])) {
      if (weights['mayhem']) delete weights['mayhem'];
      if (weights['onslaught']) delete weights['onslaught'];
    }
    randomSettings['junk_ice_traps'] = this.randomChoice(weights);
  }

  disable_pot_chest_texture_independence(randomSettings: any): void {
    if (
      ['textures', 'both', 'classic'].includes(
        randomSettings['correct_chest_appearances'],
      )
    ) {
      randomSettings['correct_potcrate_appearances'] = 'textures_content';
    } else {
      randomSettings['correct_potcrate_appearances'] = 'off';
    }
  }

  disable_keysanity_independence(randomSettings: any): void {
    if (randomSettings['shuffle_smallkeys'] === 'remove') {
      randomSettings['shuffle_hideoutkeys'] = 'vanilla';
    } else if (
      ['vanilla', 'dungeon'].includes(randomSettings['shuffle_smallkeys'])
    ) {
      randomSettings['shuffle_hideoutkeys'] = 'vanilla';
    } else {
      randomSettings['shuffle_hideoutkeys'] =
        randomSettings['shuffle_smallkeys'];
    }
  }

  restrict_one_entrance_randomizer(randomSettings: any): void {
    const erlist = [
      'shuffle_interior_entrances:off',
      'shuffle_grotto_entrances:false',
      'shuffle_dungeon_entrances:off',
      'shuffle_overworld_entrances:false',
    ];

    const enabledEr: string[] = [];
    for (const item of erlist) {
      const [setting, offOption] = item.split(':');
      if (randomSettings[setting] !== offOption) {
        enabledEr.push(setting);
      }
    }

    if (enabledEr.length < 2) {
      return;
    }

    const keepon = this.choice(enabledEr);

    for (const item of erlist) {
      const [setting, offOption] = item.split(':');
      if (setting !== keepon) {
        randomSettings[setting] = offOption;
      }
    }
  }

  random_scrubs_start_wallet(
    randomSettings: any,
    { extraStartingItems }: any,
  ): void {
    if (randomSettings['shuffle_scrubs'] === 'random') {
      if (!extraStartingItems['starting_equipment']) {
        extraStartingItems['starting_equipment'] = [];
      }
      extraStartingItems['starting_equipment'].push('wallet');
    }
  }

  shuffle_goal_hints(randomSettings: any, { cparams }: any): void {
    const chanceOfGoals = stringToInt(cparams[0]);
    const currentDistro = randomSettings['hint_dist'];

    if (Math.random() * 100 >= chanceOfGoals || currentDistro === 'useless') {
      return;
    }

    if (!randomSettings['hint_dist_user']) {
      return;
    }

    const distro = randomSettings['hint_dist_user'];
    const woth = { ...distro['distribution']['woth'] };
    distro['distribution']['woth'] = { ...distro['distribution']['goal'] };
    distro['distribution']['goal'] = woth;
  }

  replace_dampe_diary_hint_with_lightarrow(randomSettings: any): void {
    // Similarly to shuffle_goal_hints, this needs the hint distro.
    // If it's not loaded, we can't easily modify it.
    // But we can mark it in randomSettings for later processing if needed.
    if (randomSettings['hint_dist_user']) {
      randomSettings['hint_dist_user']['misc_hint_items'] = {
        ...randomSettings['hint_dist_user']['misc_hint_items'],
        dampe_diary: 'Light Arrows',
      };
    }
  }

  split_collectible_bridge_conditions(randomSettings: any, { cparams }: any): void {
    const chanceOfCollectibleWincon = stringToInt(cparams[0]);
    const typeweights = cparams[1].split('/').map((x: string) => parseInt(x, 10));
    const weights = cparams[2].split('/').map((x: string) => parseInt(x, 10));

    if (Math.random() * 100 >= chanceOfCollectibleWincon) {
      return;
    }

    const condition = this.weightedChoice(['hearts', 'tokens'], typeweights);
    const whichtype = this.weightedChoice(['bridge', 'gbk', 'both'], weights);

    if (['bridge', 'both'].includes(whichtype)) {
      randomSettings['bridge'] = condition;
    }
    if (['gbk', 'both'].includes(whichtype)) {
      randomSettings['shuffle_ganon_bosskey'] = condition;
    }
  }

  adjust_chaos_hint_distro(randomSettings: any): void {
    const distro = randomSettings['hint_dist_user'] || null;
    if (distro && distro['name'] === 'chaos') {
      distro['distribution']['always']['copies'] = 2;
      distro['distribution']['overworld']['weight'] = 0;
      distro['distribution']['dungeon']['weight'] = 0;
      distro['distribution']['song']['weight'] = 0;
      randomSettings['hint_dist_user'] = distro;
    }
  }

  exclude_mapcompass_info_remove(
    randomSettings: any,
    { weightDict }: any,
  ): void {
    const weights = { ...weightDict['shuffle_mapcompass'] };
    if (weights['remove'] && randomSettings['enhance_map_compass'] === 'true') {
      delete weights['remove'];
    }
    randomSettings['shuffle_mapcompass'] = this.randomChoice(weights);
  }

  ohko_starts_with_nayrus(
    randomSettings: any,
    { extraStartingItems }: any,
  ): void {
    if (randomSettings['damage_multiplier'] === 'ohko') {
      if (!extraStartingItems['starting_inventory']) {
        extraStartingItems['starting_inventory'] = [];
      }
      extraStartingItems['starting_inventory'].push('nayrus_love');
    }
  }

  invert_dungeons_mq_count(randomSettings: any, { cparams }: any): void {
    if (randomSettings['mq_dungeons_mode'] !== 'count') {
      return;
    }

    const chanceOfInvertingMqCount = stringToInt(cparams[0]);
    if (Math.random() * 100 < chanceOfInvertingMqCount) {
      const currentMqCount = parseInt(randomSettings['mq_dungeons_count'], 10);
      randomSettings['mq_dungeons_count'] = 12 - currentMqCount;
    }
  }

  shuffle_valley_lake_exit(randomSettings: any): void {
    if (
      randomSettings['shuffle_overworld_entrances'] === 'true' &&
      randomSettings['owl_drops'] === 'true'
    ) {
      randomSettings['shuffle_gerudo_valley_river_exit'] = 'true';
    }
  }

  select_one_pots_crates_freestanding(randomSettings: any, { cparams }: any): void {
    const chanceOneIsOn = stringToInt(cparams[0]);
    const settingWeights = cparams[1].split('/').map((x: string) => parseInt(x, 10));
    const weights = cparams[2].split('/').map((x: string) => parseInt(x, 10));

    if (Math.random() * 100 >= chanceOneIsOn) {
      return;
    }

    const setting = this.weightedChoice(
      ['shuffle_pots', 'shuffle_crates', 'shuffle_freestanding_items'],
      settingWeights,
    );
    randomSettings[setting] = this.weightedChoice(
      ['overworld', 'dungeons', 'all'],
      weights,
    );
  }

  geometrically_draw_dungeon_shortcuts(randomSettings: any): void {
    const options = MS_OPTION_LOOKUP['dungeon_shortcuts'];
    const nunique = options.length;
    const weights = geometricWeights(nunique + 1) as number[];
    const chooseN = this.weightedChoice(
      Array.from({ length: nunique + 1 }, (_, i) => i),
      weights,
    );
    randomSettings['dungeon_shortcuts'] = this.sample(options, chooseN);
  }

  limit_overworld_entrances_in_mixed_entrance_pools(
    randomSettings: any,
    { cparams }: any,
  ): void {
    if (!randomSettings['mix_entrance_pools'] || randomSettings['mix_entrance_pools'].length < 1) {
      return;
    }

    const overworldProbability = stringToInt(cparams[0]);
    if (Math.random() * 100 >= overworldProbability) {
      const index = randomSettings['mix_entrance_pools'].indexOf('Overworld');
      if (index > -1) {
        randomSettings['mix_entrance_pools'].splice(index, 1);
      }
    }
  }

  limit_mixed_pool_entrances(randomSettings: any, { cparams }: any): void {
    const maxMixed = parseInt(cparams[0], 10);
    const omitOverworld = cparams[1] === true || cparams[1] === 'True';

    if (!randomSettings['mix_entrance_pools']) return;

    if (omitOverworld) {
      const index = randomSettings['mix_entrance_pools'].indexOf('Overworld');
      if (index > -1) {
        randomSettings['mix_entrance_pools'].splice(index, 1);
      }
    }

    if (randomSettings['mix_entrance_pools'].length > maxMixed) {
      randomSettings['mix_entrance_pools'] = this.sample(
        randomSettings['mix_entrance_pools'],
        maxMixed,
      );
    }
  }

  keysanity_key_get_keyrings(randomSettings: any): void {
    if (randomSettings['shuffle_smallkeys'] === 'keysanity') {
      randomSettings['key_rings'] = MS_OPTION_LOOKUP['key_rings'];
    }
  }

  // Helper for random choices from weight dict
  private randomChoice(weights: Record<string, number>): string {
    const keys = Object.keys(weights);
    const values = Object.values(weights);
    return this.weightedChoice(keys, values);
  }

  private weightedChoice(options: any[], weights: number[]): any {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < options.length; i++) {
      r -= weights[i];
      if (r <= 0) return options[i];
    }
    return options[0];
  }

  private choice(options: any[]): any {
    return options[Math.floor(Math.random() * options.length)];
  }

  private sample(options: any[], n: number): any[] {
    const shuffled = [...options].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }
}
