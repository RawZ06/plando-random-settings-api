import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WeightService {
  loadWeightsFile(weightsName: string): any {
    const filePath = path.join(process.cwd(), 'weights', `${weightsName}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Weights file ${weightsName} not found`);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return this.parseWeights(data);
  }

  parseWeights(datain: any) {
    const weightOptions = datain.options || null;
    const conditionals = datain.conditionals || null;
    const weightMultiselect = datain.multiselect || null;
    const weightDict = datain.weights;
    return { weightOptions, conditionals, weightMultiselect, weightDict };
  }
}
