import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class HintsService {
  private readonly logger = new Logger(HintsService.name);
  private hintsCache: Record<string, any> = {};

  constructor(private configService: ConfigService) {}

  async getHintDistribution(distroName: string): Promise<any> {
    if (this.hintsCache[distroName]) {
      return this.hintsCache[distroName];
    }

    const repo = this.configService.get<string>('RANDOMIZER_REPO');
    const commit = this.configService.get<string>('RANDOMIZER_COMMIT');
    const url = `https://raw.githubusercontent.com/${repo}/${commit}/data/Hints/${distroName}.json`;

    try {
      this.logger.log(`Fetching hint distribution from ${url}`);
      const response = await axios.get(url);
      this.hintsCache[distroName] = response.data;
      return this.hintsCache[distroName];
    } catch (error) {
      this.logger.warn(
        `Failed to fetch hint distribution ${distroName}: ${error.message}`,
      );
      // Return a basic placeholder if fetching fails to avoid breaking generation
      return {
        name: distroName,
        distribution: {
          always: { weight: 1.0, copies: 1 },
          overworld: { weight: 1.0, copies: 1 },
          dungeon: { weight: 1.0, copies: 1 },
          song: { weight: 1.0, copies: 1 },
        },
        misc_hint_items: {},
      };
    }
  }
}
