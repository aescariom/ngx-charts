import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  ViewEncapsulation,
  ContentChild,
  TemplateRef
} from '@angular/core';
import { scaleLinear } from 'd3-scale';

import { BaseChartComponent } from '../common/base-chart.component';
import { calculateViewDimensions } from '../common/view-dimensions.helper';
import { ColorHelper } from '../common/color.helper';
import { ArcItem } from '../gauge/gauge-arc.component';
import { ViewDimensions } from '../common/types/view-dimension.interface';
import { ScaleType } from '../common/types/scale-type.enum';

interface Arcs {
  backgroundArc: ArcItem;
  valueArc: ArcItem;
}

interface RefArcs {
  backgroundArc: ArcItem;
  colorArcs: ArcItem[];
}

interface GraphicRange {
  minValue: number | null;
  maxValue: number | null;
  color: string | null;
}

// ngx-tooltip
// [tooltipDisabled]="tooltipDisabled"
// [tooltipPlacement]="placementTypes.Top"
// [tooltipType]="styleTypes.tooltip"
// [tooltipTitle]="tooltipTemplate ? undefined : tooltipText(valueArc)"
// [tooltipTemplate]="tooltipTemplate"
// [tooltipContext]="valueArc.data"

@Component({
  standalone: false,
  selector: 'ngx-m-charts-gauge',
  template: `
    <ngx-charts-chart
      [view]="[width, height]"
      [activeEntries]="activeEntries"
      [animations]="animations"
    >
      <svg:g style="transform: {{transform}}" class="gauge chart">

        <svg:g [attr.transform]="rotation" *ngIf="refArcs.colorArcs.length > 0">
        
          <!-- frag#1 ? --> 
          <!-- Arco superior de la referencia -->
          <svg:g *ngFor="let valueArc of refArcs.colorArcs;"
            ngx-m-charts-pie-arc
            [startAngle]="valueArc.startAngle"
            [endAngle]="valueArc.endAngle"
            [innerRadius]="valueArc.innerRadius -5"
            [outerRadius]="valueArc.outerRadius - 5"
            [cornerRadius]="0"
            [fill]="valueArc.data.color"
            [data]="valueArc.data"
            [isActive]="isActive" 
            [tooltipDisabled]="false"
          ></svg:g>
        </svg:g>

        <svg:g *ngFor="let arc of arcs; trackBy: trackBy">
          <svg:g [attr.transform]="rotation"
            ngx-m-charts-gauge-arcReference
            [backgroundArc]="arc.backgroundArc"
            [valueArc]="arc.valueArc"
            [cornerRadius]="0"
            [colors]="colors"
            [refBarColors]="refBarColors"
            [isActive]="isActive(arc.valueArc.data)"
            [tooltipDisabled]="true"
            [tooltipTemplate]="tooltipTemplate"
            [valueFormatting]="valueFormatting"
            [getColor]="getColor"
            [animations]="animations"
            (select)="onClick($event)"
            (activate)="onActivate($event)"
            (deactivate)="onDeactivate($event)"
          ></svg:g>

          <svg:g
            ngx-m-charts-pie-arcArrow
            id="flecha"
            [fill]="'#000000'"
            [data]="arc.valueArc.data"
            [max]="max"
            [min]="min"
            [scale]="arc.valueArc.outerRadius"
          ></svg:g>
        </svg:g>

        <svg:g
          ngx-m-charts-gauge-axis
          *ngIf="showAxis"
          [bigSegments]="1"
          [smallSegments]="0"
          [min]="min"
          [max]="max"
          [radius]="outerRadius"
          [angleSpan]="angleSpan"
          [valueScale]="valueScale"
          [startAngle]="startAngle"
          [tickFormatting]="valueFormatting"
        ></svg:g>
      </svg:g>
    </ngx-charts-chart>
    <div class="valueContainer" *ngIf="showText">
      <div class="displayValue" style="color: #a0aabe;">{{getPercentage()}}%</div>
      <div [style.color]="getColor(arcs[0].valueArc.data.value)">{{displayValue}}</div>
    </div>
  `,
  styleUrls: ['../common/base-chart.component.scss', './m-gauge.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MGaugeComponent extends BaseChartComponent implements AfterViewInit {
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() textValue: string;
  @Input() results: any[];
  @Input() showAxis: boolean = true;
  startAngle: number = -90;
  angleSpan: number = 180;
  @Input() activeEntries: any[] = [];
  @Input() tooltipDisabled: boolean = false;
  @Input() valueFormatting: (value: any) => string;
  @Input() showText: boolean = true;
  @Input() refBarColors: GraphicRange[] = [];

  // Specify margins
  @Input() margin: number[];

  @Output() activate: EventEmitter<any> = new EventEmitter();
  @Output() deactivate: EventEmitter<any> = new EventEmitter();

  @ContentChild('tooltipTemplate') tooltipTemplate: TemplateRef<any>;

  @ViewChild('textEl') textEl: ElementRef;

  dims: ViewDimensions;
  domain: any[];
  valueDomain: [number, number];
  valueScale: any;

  colors: ColorHelper;
  transform: string;

  outerRadius: number;
  outerRadiusRef: number;
  textRadius: number; // max available radius for the text
  resizeScale: number = 1;
  rotation: string = '';
  textTransform: string = 'scale(1, 1)';
  cornerRadius: number = 10;
  arcs: Arcs[];
  // refArcs
  refArcs: RefArcs;


  Number = Number;
  displayValue: string;

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
  }

  update(): void {
    super.update();

    if (!this.showAxis) {
      if (!this.margin) {
        this.margin = [10, 20, 10, 20];
      }
    } else {
      if (!this.margin) {
        this.margin = [60, 100, 60, 100];
      }
    }

    // make the starting angle positive
    if (this.startAngle < 0) {
      this.startAngle = (this.startAngle % 360) + 360;
    }

    this.angleSpan = Math.min(this.angleSpan, 360);
    this.dims = calculateViewDimensions({
      width: this.width,
      height: this.height,
      margins: this.margin
    });
    this.domain = this.getDomain();
    this.valueDomain = this.getValueDomain();
    this.valueScale = this.getValueScale();
    this.displayValue = this.getDisplayValue();

    this.outerRadius = Math.min(this.dims.width, this.dims.height) / 2;
    this.outerRadiusRef = Math.min(this.dims.width, this.dims.height) / 1;

    this.arcs = this.getArcs();
    this.refArcs = this.getRefArcs();

    this.setColors();

    const xOffset = this.margin[3] + this.dims.width / 2;
    const yOffset = this.margin[0] + this.dims.height / 2;

    this.transform = `translate(50%, 70%)`;
    this.rotation = `rotate(${this.startAngle})`;
  }

  getArcs(): any[] {
    const arcs = [];

    const availableRadius = this.outerRadius * 0.7;

    const radiusPerArc = Math.min(availableRadius / this.results.length, 25);
    const arcWidth = radiusPerArc * 2;
    this.textRadius = this.outerRadius - this.results.length * radiusPerArc;
    // redondeo de bordes
    this.cornerRadius = Math.floor(arcWidth / 2);

    let i = 0;
    for (const d of this.results) {
      const outerRadius = this.outerRadius - i * radiusPerArc;
      const innerRadius = outerRadius - arcWidth;

      const backgroundArc = {
        endAngle: (this.angleSpan * Math.PI) / 180,
        innerRadius,
        outerRadius,
        data: {
          value: this.max,
          name: d.name
        }
      };

      const endAngle = (Math.min(this.valueScale(d.value), this.angleSpan) * Math.PI) / 180
      const valueArc = {
        endAngle: endAngle < 0 ? 0 : endAngle,
        innerRadius,
        outerRadius,
        data: {
          value: d.value < this.min ? this.min : d.value,
          name: d.name
        }
      };

      const arc = {
        backgroundArc,
        valueArc
      };

      arcs.push(arc);
      i++;
    }

    return arcs;
  }

  getRefArcs(): RefArcs {
    const availableRadius = this.outerRadius + 22;

    const radiusPerArc = Math.min(availableRadius, 10);
    const arcWidth = radiusPerArc * 1;
    this.textRadius = this.outerRadius - this.results.length * radiusPerArc;
    // redondeo de bordes
    this.cornerRadius = Math.floor(arcWidth / 2);

    const backgroundArc = {
      endAngle: (this.angleSpan * Math.PI) / 180,
      innerRadius: availableRadius - arcWidth,
      outerRadius: availableRadius,
      data: {
        value: this.max,
        name: ''
      }
    };

    let i = 0;
    const colorArcs: ArcItem[] = [];
    for (const color of this.refBarColors) {

      const endAngle = (Math.min(this.valueScale(color.maxValue), this.angleSpan) * Math.PI) / 180;
      const startAngle = (Math.min(this.valueScale(color.minValue), this.angleSpan) * Math.PI) / 180;
      const maxEnd = (Math.min(this.valueScale(this.max), this.angleSpan) * Math.PI);
      const maxStart = (Math.min(this.valueScale(this.min), this.angleSpan) * Math.PI);
      const valueArc = {
        endAngle: endAngle > maxEnd ? maxEnd : endAngle,
        innerRadius: availableRadius - arcWidth,
        outerRadius: availableRadius,
        startAngle: startAngle < maxStart ? maxStart : startAngle,
        data: {
          value: (color.minValue < this.min) ? this.min : color.minValue,
          color: color.color,
          name: color.color
        }
      };

      colorArcs.push(valueArc);
      i++;
    }

    const refArcs = {
      backgroundArc: backgroundArc,
      colorArcs: colorArcs
    }

    return refArcs;
  }


  getColor(value: number): any {
    let maxRange = { val: this.max, i: 0 };
    let minRange = { val: this.min, i: 0 };
    // const VALOR = arc.data.value;
    if (this.refBarColors.length > 0) {
      const color = this.refBarColors.find((item, i) => {
        if (item.minValue < minRange.val) minRange = { val: item.minValue, i };
        if (item.maxValue > maxRange.val) maxRange = { val: item.maxValue, i };
        return value >= item.minValue && value <= item.maxValue;
      });
      if (!color) {
        return '#8f8f8f'
      }
      return color.color;
    }

    return '#8f8f8f';
  }

  getDomain(): string[] {
    return this.results.map(d => d.name);
  }

  getValueDomain(): [number, number] {
    const values = this.results.map(d => d.value);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);

    if (this.min === undefined) {
      this.min = dataMin;
    }

    if (this.max === undefined) {
      this.max = dataMax;
    }

    return [this.min, this.max];
  }

  getValueScale(): any {
    return scaleLinear().range([0, this.angleSpan]).nice().domain(this.valueDomain);
  }

  getDisplayValue(): string {
    const value = this.results.map(d => d.value).reduce((a, b) => a + b, 0);

    if (this.textValue && 0 !== this.textValue.length) {
      return this.textValue.toLocaleString();
    }

    if (this.valueFormatting) {
      return this.valueFormatting(value);
    }

    return value.toLocaleString();
  }

  onClick(data): void {
    this.select.emit(data);
  }
  setColors(): void {
    this.colors = new ColorHelper(this.scheme, ScaleType.Ordinal, this.domain, this.customColors);
  }

  onActivate(item): void {
    const idx = this.activeEntries.findIndex(d => {
      return d.name === item.name && d.value === item.value;
    });
    if (idx > -1) {
      return;
    }

    this.activeEntries = [item, ...this.activeEntries];
    this.activate.emit({ value: item, entries: this.activeEntries });
  }

  onDeactivate(item): void {
    const idx = this.activeEntries.findIndex(d => {
      return d.name === item.name && d.value === item.value;
    });

    this.activeEntries.splice(idx, 1);
    this.activeEntries = [...this.activeEntries];

    this.deactivate.emit({ value: item, entries: this.activeEntries });
  }

  isActive(entry): boolean {
    if (!this.activeEntries) return false;
    const item = this.activeEntries.find(d => {
      return entry.name === d.name && entry.series === d.series;
    });
    return item !== undefined;
  }

  trackBy(index: number, item: Arcs): any {
    return item.valueArc.data.name;
  }

  getPercentage() {
    const value = this.results.map(d => d.value).reduce((a, b) => a + b, 0);
    const percentage = ((value - this.min) * 100 / (this.max - this.min));
    return this.valueFormatting ? this.valueFormatting(percentage) : percentage;
  }
}
