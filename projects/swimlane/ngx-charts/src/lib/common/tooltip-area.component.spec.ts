import { TooltipArea } from './tooltip-area.component';

describe('TooltipArea getToolTipText', () => {
  function createComponent(): TooltipArea {
    return new TooltipArea('browser');
  }

  it('renders the value when present', () => {
    const component = createComponent();
    expect(component.getToolTipText({ series: 'Sales', value: 1234 } as any)).toBe('Sales: 1,234');
  });

  it('renders -- when the value is null', () => {
    const component = createComponent();
    expect(component.getToolTipText({ series: 'Sales', value: null } as any)).toBe('Sales: --');
  });

  it('renders -- when the value is undefined', () => {
    const component = createComponent();
    expect(component.getToolTipText({ series: 'Sales', value: undefined } as any)).toBe('Sales: --');
  });
});
