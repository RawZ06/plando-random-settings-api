import { Injectable } from '@nestjs/common';

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
    const weights = weightDict['item_pool_value'];
    if (weights['minimal'] && randomSettings['triforce_hunt'] === 'true') {
      delete weights['minimal'];
    }
    randomSettings['item_pool_value'] = this.randomChoice(weights);
  }

  exclude_ice_trap_misery(randomSettings: any, { weightDict }: any): void {
    const weights = weightDict['junk_ice_traps'];
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

  // Helper for random choices from weight dict
  private randomChoice(weights: Record<string, number>): string {
    const keys = Object.keys(weights);
    const values = Object.values(weights);
    const totalWeight = values.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < keys.length; i++) {
      r -= values[i];
      if (r <= 0) return keys[i];
    }
    return keys[0];
  }

  // More conditionals would be added here by reversing conditionals.py
}
