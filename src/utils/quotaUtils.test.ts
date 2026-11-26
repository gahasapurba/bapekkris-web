import { describe, expect, it } from 'vitest';
import { getConnectedEventForForm, getConnectedFormForEvent, isFormConnectedToEvent } from './quotaUtils';

const forms = [
  { id: 'f1', eventId: 'e1', isEventConnected: true },
  { id: 'f2', eventId: 'e2', isEventConnected: false },
  { id: 'f3', eventId: null, isEventConnected: true }
];

describe('isFormConnectedToEvent', () => {
  it('requires both the connected flag and a matching event id', () => {
    expect(isFormConnectedToEvent(forms[0], 'e1')).toBe(true);
    expect(isFormConnectedToEvent(forms[0], 'e2')).toBe(false);
    expect(isFormConnectedToEvent(forms[1], 'e2')).toBe(false);
    expect(isFormConnectedToEvent(forms[2], '')).toBe(false);
    expect(isFormConnectedToEvent(null, 'e1')).toBe(false);
  });
  it('compares ids as strings', () => {
    expect(isFormConnectedToEvent({ id: 'f', eventId: 7, isEventConnected: true }, '7')).toBe(true);
  });
});

describe('connected lookups', () => {
  it('finds the form of an event and the event of a form', () => {
    expect(getConnectedFormForEvent({ id: 'e1' }, forms)?.id).toBe('f1');
    expect(getConnectedFormForEvent({ id: 'e2' }, forms)).toBeNull();
    expect(getConnectedEventForForm(forms[0], [{ id: 'e1', title: 'Ibadah' }])?.title).toBe('Ibadah');
    expect(getConnectedEventForForm(forms[1], [{ id: 'e2' }])).toBeNull();
  });
});
