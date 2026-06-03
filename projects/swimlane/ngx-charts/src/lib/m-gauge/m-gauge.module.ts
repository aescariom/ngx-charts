import { NgModule } from '@angular/core';
import { ChartCommonModule } from '../common/chart-common.module';
import { MGaugeComponent } from './m-gauge.component';
import { MGaugeArcComponent } from './m-gauge-arc.component';
import { MGaugeAxisComponent } from './m-gauge-axis.component';
import { MGaugeArcComponentRef } from './m-gauge-arcReference.component';
import { BarChartModule } from '../bar-chart/bar-chart.module';
import {MPieArcArrowComponent} from "./m-pie-arcArrow.component";
import {MPieArcComponent} from "./m-pie-arc.component";

@NgModule({
  imports: [ChartCommonModule, BarChartModule],
  declarations: [MGaugeComponent, MGaugeArcComponent, MGaugeAxisComponent, MGaugeArcComponentRef, MPieArcArrowComponent, MPieArcComponent],
  exports: [MGaugeComponent, MGaugeArcComponent, MGaugeAxisComponent, MGaugeArcComponentRef, MPieArcArrowComponent, MPieArcComponent]
})
export class MGaugeModule {}
