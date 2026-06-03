import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, TemplateRef } from '@angular/core';
import { formatLabel, escapeLabel } from '../common/label.helper';
import { ColorHelper } from '../common/color.helper';
import { DataItem } from '../models/chart-data.model';
import { PlacementTypes } from '../common/tooltip/position';
import { StyleTypes } from '../common/tooltip/style.type';

export interface ArcItemRef {
  data: DataItem;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
}

@Component({
  standalone: false,
  selector: 'g[ngx-m-charts-gauge-arcReference]',
  template: `
    <svg:g
      ngx-m-charts-pie-arc
      class="background-arc"
      [startAngle]="0"
      [endAngle]="backgroundArc.endAngle"
      [innerRadius]="backgroundArc.innerRadius"
      [outerRadius]="backgroundArc.outerRadius"
      [cornerRadius]="cornerRadius"
      [data]="backgroundArc.data"
      [animate]="false"
      [pointerEvents]="false"
    ></svg:g>
    <svg:g
      ngx-m-charts-pie-arc
      [startAngle]="0"
      [endAngle]="valueArc.endAngle - 0.02"
      [innerRadius]="valueArc.innerRadius"
      [outerRadius]="valueArc.outerRadius"
      [cornerRadius]="cornerRadius"
      [fill]="this.getColor(valueArc.data.value)"
      [data]="valueArc.data"
      [animate]="animations"
    ></svg:g>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MGaugeArcComponentRef {
  @Input() backgroundArc: ArcItemRef;
  @Input() valueArc: ArcItemRef;
  @Input() cornerRadius: number;
  @Input() colors: ColorHelper;
  @Input() refBarColors: any[] = [];
  @Input() isActive: boolean = false;
  @Input() tooltipDisabled: boolean = false;
  @Input() valueFormatting: (value: any) => string;
  @Input() getColor: (arc: number) => string;
  @Input() tooltipTemplate: TemplateRef<any>;
  @Input() animations: boolean = true;

  @Output() select = new EventEmitter();
  @Output() activate = new EventEmitter();
  @Output() deactivate = new EventEmitter();

  placementTypes = PlacementTypes;
  styleTypes = StyleTypes;

  // getColor(arc: ArcItemRef): any {
  //   const VALOR = arc.data.value;
  //   let color = this.refBarColors.find((item) => VALOR >= item.min && VALOR <= item.max);
  //   return color.color;
  // }

  getColorMarker(): any {
    return "#ff0000";
  }

  tooltipText(arc: ArcItemRef): string {
    const label = formatLabel(arc.data.name);
    let val;

    if (this.valueFormatting) {
      val = this.valueFormatting(arc.data.value);
    } else {
      val = formatLabel(arc.data.value);
    }

    return `
      <span class="tooltip-label">${escapeLabel(label)}</span>
      <span class="tooltip-val">${val}</span>
    `;
  }
}
