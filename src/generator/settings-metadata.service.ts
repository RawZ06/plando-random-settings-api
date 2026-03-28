import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SettingsMetadataService {
  private readonly logger = new Logger(SettingsMetadataService.name);
  private settingsMetadata: any = null;

  constructor(private configService: ConfigService) {}

  async getSettingsInfo(): Promise<any> {
    if (this.settingsMetadata) {
      return this.settingsMetadata;
    }

    const repo = this.configService.get<string>('RANDOMIZER_REPO');
    const commit = this.configService.get<string>('RANDOMIZER_COMMIT');
    const url = `https://raw.githubusercontent.com/${repo}/${commit}/SettingsList.py`;

    try {
      this.logger.log(`Fetching settings metadata from ${url}`);
      const response = await axios.get(url);
      this.settingsMetadata = this.parseSettingsList(response.data);
      return this.settingsMetadata;
    } catch (error) {
      this.logger.error(`Failed to fetch settings metadata: ${error.message}`);
      throw error;
    }
  }

  private parseSettingsList(content: string): any {
    // This is a simplified parser for SettingsList.py
    // We need setting names and their types (bool, int, str)
    // and choices for validation and redundant settings removal.

    const settingInfos: Record<string, any> = {};

    // Regex to find setting definitions
    // Look for 'setting_name': SettingInfo(...)
    // This is a bit complex to parse with regex perfectly,
    // but we can try to extract the main parts.

    const settingRegex = /'([^']+)':\s*SettingInfo\(([\s\S]*?)\),\s*\n/g;
    let match;

    while ((match = settingRegex.exec(content)) !== null) {
      const name = match[1];
      const body = match[2];

      const typeMatch = /type=([^,\s)]+)/.exec(body);
      let type: any = String;
      if (typeMatch) {
        const typeStr = typeMatch[1];
        if (typeStr === 'bool') type = Boolean;
        else if (typeStr === 'int') type = Number;
        else type = String;
      }

      const disableMatch = /disable=({[\s\S]*?})/.exec(body);
      let disable: any = null;
      if (disableMatch) {
        try {
          // Very hacky way to parse python dict to json
          const jsonStr = disableMatch[1]
            .replace(/'/g, '"')
            .replace(/True/g, 'true')
            .replace(/False/g, 'false')
            .replace(/None/g, 'null')
            .replace(/(\w+):/g, '"$1":'); // Quote keys if not quoted
          disable = JSON.parse(jsonStr);
        } catch {
          // Fallback or ignore if too complex
        }
      }

      settingInfos[name] = {
        type,
        disable,
      };
    }

    return { setting_infos: settingInfos };
  }
}
