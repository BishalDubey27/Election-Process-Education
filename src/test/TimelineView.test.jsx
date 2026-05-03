import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TimelineView from '../components/TimelineView';

const mockPhases = [
  { id: 'p1', label: 'Phase 1', icon: '1' },
  { id: 'p2', label: 'Phase 2', icon: '2' },
];

describe('TimelineView', () => {
  it('renders all phases', () => {
    render(<TimelineView phases={mockPhases} currentPhaseIndex={0} completedPhases={[]} onPhaseSelect={() => {}} />);
    expect(screen.getByText('Phase 1')).toBeInTheDocument();
    expect(screen.getByText('Phase 2')).toBeInTheDocument();
  });

  it('calls onPhaseSelect when a phase is clicked', () => {
    const onPhaseSelect = vi.fn();
    render(<TimelineView phases={mockPhases} currentPhaseIndex={0} completedPhases={[]} onPhaseSelect={onPhaseSelect} />);
    fireEvent.click(screen.getByText('Phase 1'));
    expect(onPhaseSelect).toHaveBeenCalledWith(0);
  });
});
