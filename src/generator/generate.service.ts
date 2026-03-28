import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WeightService } from './weight.service';
import { ConditionalsService } from './conditionals.service';
import { SettingsMetadataService } from './settings-metadata.service';
import { MS_OPTION_LOOKUP } from '../common/multiselects';
import { geometricWeights } from '../common/utils';

@Injectable()
export class GenerateService {
  private readonly logger = new Logger(GenerateService.name);

  constructor(
    private weightService: WeightService,
    private conditionalsService: ConditionalsService,
    private settingsMetadataService: SettingsMetadataService,
    private configService: ConfigService,
  ) {}

  async generateSettings(weightsName: string): Promise<any> {
    const { weightOptions, conditionals, weightMultiselect, weightDict } =
      this.weightService.loadWeightsFile(weightsName);

    // Initial random choice for each setting
    const randomSettings: Record<string, any> = {};
    for (const [setting, options] of Object.entries(weightDict)) {
      randomSettings[setting] = this.weightedChoice(
        options as Record<string, number>,
      );
    }

    // Resolve multiselects
    if (weightMultiselect) {
      for (const [setting, probability] of Object.entries(weightMultiselect)) {
        if (Math.random() * 100 < (probability as number)) {
          randomSettings[setting] = MS_OPTION_LOOKUP[setting] || [];
        } else {
          randomSettings[setting] = [];
        }
      }
    }

    // Add constants/calculated weights (like tokens, hearts, triforce)
    // based on roll_settings.py:210
    const calculatedSettings = [
      'bridge_tokens',
      'ganon_bosskey_tokens',
      'bridge_hearts',
      'ganon_bosskey_hearts',
      'triforce_goal_per_world',
      'triforce_count_per_world',
    ];
    for (const nset of calculatedSettings) {
      const kwx = nset + '_max';
      const kwn = nset + '_min';
      const nmax = weightOptions[kwx] !== undefined ? weightOptions[kwx] : 100;
      const nmin = weightOptions[kwn] !== undefined ? weightOptions[kwn] : 1;
      const range = nmax - nmin + 1;
      randomSettings[nset] = Math.floor(Math.random() * range) + nmin;
    }

    // Apply conditionals
    const startWith = {
      starting_inventory: [],
      starting_songs: [],
      starting_equipment: [],
    };
    if (conditionals) {
      this.conditionalsService.parseConditionals(
        conditionals,
        weightDict,
        randomSettings,
        startWith,
      );
    }

    // Add tricks, disabled_locations, etc.
    if (weightOptions) {
      if (weightOptions.tricks)
        randomSettings.allowed_tricks = weightOptions.tricks;
      if (weightOptions.disabled_locations)
        randomSettings.disabled_locations = weightOptions.disabled_locations;
      randomSettings.misc_hints = weightOptions.misc_hints || [];
      // starting_items logic skipped for now as it's complex, but could be added
    }

    // Final formatting based on metadata
    const metadata = await this.settingsMetadataService.getSettingsInfo();
    for (const [setting, value] of Object.entries(randomSettings)) {
      const info = metadata.setting_infos[setting];
      if (info) {
        if (info.type === Boolean) {
          if (value === 'true') randomSettings[setting] = true;
          else if (value === 'false') randomSettings[setting] = false;
        } else if (info.type === Number) {
          randomSettings[setting] = Number(value);
        }
      }
    }

    return {
      weights: weightsName,
      version: this.configService.get('RANDOMIZER_VERSION'),
      settings: randomSettings,
    };
  }

  private weightedChoice(options: Record<string, number>): any {
    const keys = Object.keys(options);
    const weights = Object.values(options);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < keys.length; i++) {
      r -= weights[i];
      if (r <= 0) return keys[i];
    }
    return keys[0];
  }
}
