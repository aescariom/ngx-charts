import { TestBed } from '@angular/core/testing';
import { curveLinear } from 'd3-shape';

import { LineChartModule } from './line-chart.module';
import { LineSeriesComponent } from './line-series.component';
import { ScaleType } from '../common/types/scale-type.enum';

function configureInputs(
  component: LineSeriesComponent,
  series: Array<{ name: any; value: any }>,
  connectNull: boolean
): LineSeriesComponent {
  const yScale: any = (v: any) => v;
  yScale.range = () => [0, 100];

  component.scaleType = ScaleType.Linear;
  component.xScale = ((v: any) => Number(v)) as any;
  component.yScale = yScale;
  component.curve = curveLinear;
  component.colors = {
    scaleType: ScaleType.Ordinal,
    getColor: () => '#000'
  } as any;
  component.data = { name: 'A', series } as any;
  component.connectNull = connectNull;
  return component;
}

function countMoveTo(path: string): number {
  return (path.match(/M/g) || []).length;
}

describe('LineSeriesComponent null handling', () => {
  let component: LineSeriesComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartModule]
    }).compileComponents();

    component = TestBed.createComponent(LineSeriesComponent).componentInstance;
  });

  describe('getNullBridgeSegments', () => {
    it('returns no segments when there are no missing values', () => {
      const data = [
        { name: 0, value: 1 },
        { name: 1, value: 2 },
        { name: 2, value: 3 }
      ];
      expect(component.getNullBridgeSegments(data)).toEqual([]);
    });

    it('bridges a single interior gap', () => {
      const before = { name: 0, value: 1 };
      const after = { name: 2, value: 3 };
      const data = [before, { name: 1, value: null }, after];
      expect(component.getNullBridgeSegments(data)).toEqual([[before, after]]);
    });

    it('collapses consecutive missing values into one bridge', () => {
      const before = { name: 0, value: 1 };
      const after = { name: 3, value: 4 };
      const data = [before, { name: 1, value: null }, { name: 2, value: undefined }, after];
      expect(component.getNullBridgeSegments(data)).toEqual([[before, after]]);
    });

    it('produces multiple bridges for multiple gaps', () => {
      const a = { name: 0, value: 1 };
      const b = { name: 2, value: 3 };
      const c = { name: 4, value: 5 };
      const data = [a, { name: 1, value: null }, b, { name: 3, value: null }, c];
      expect(component.getNullBridgeSegments(data)).toEqual([
        [a, b],
        [b, c]
      ]);
    });

    it('ignores leading missing values (no point before the gap)', () => {
      const after = { name: 2, value: 3 };
      const data = [{ name: 0, value: null }, { name: 1, value: undefined }, after, { name: 3, value: 4 }];
      expect(component.getNullBridgeSegments(data)).toEqual([]);
    });

    it('ignores trailing missing values (no point after the gap)', () => {
      const data = [
        { name: 0, value: 1 },
        { name: 1, value: 2 },
        { name: 2, value: null }
      ];
      expect(component.getNullBridgeSegments(data)).toEqual([]);
    });

    it('handles all-missing series without crashing', () => {
      const data = [
        { name: 0, value: null },
        { name: 1, value: undefined }
      ];
      expect(component.getNullBridgeSegments(data)).toEqual([]);
    });
  });

  describe('rendering with connectNull = false (default, upstream behaviour)', () => {
    it('does not break the line at missing points and emits no dashed path', () => {
      configureInputs(
        component,
        [
          { name: 0, value: 10 },
          { name: 1, value: null },
          { name: 2, value: 20 }
        ],
        false
      );

      component.update();

      expect(component.nullPath).toBe('');
      // No `.defined` guard -> a single continuous moveto, identical to a plain line.
      expect(countMoveTo(component.path)).toBe(1);
    });
  });

  describe('rendering with connectNull = true', () => {
    it('breaks the solid line at the gap and bridges it with a dashed path', () => {
      configureInputs(
        component,
        [
          { name: 0, value: 10 },
          { name: 1, value: null },
          { name: 2, value: 20 }
        ],
        true
      );

      component.update();

      // Solid line breaks: two separate subpaths around the missing point.
      expect(countMoveTo(component.path)).toBe(2);
      // Dashed bridge connects the two real points.
      expect(component.nullPath).toContain('L');
      expect(component.nullPath.length).toBeGreaterThan(0);
    });

    it('emits an empty dashed path when there are no interior gaps', () => {
      configureInputs(
        component,
        [
          { name: 0, value: 10 },
          { name: 1, value: 20 }
        ],
        true
      );

      component.update();

      expect(component.nullPath).toBe('');
    });
  });
});
