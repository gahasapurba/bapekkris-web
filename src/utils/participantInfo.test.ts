import { describe, expect, it } from 'vitest';
import { fieldValue, participantInfo, participantName, winnerNameFrom } from './participantInfo';

const fields = [
  { id: 'f-1', label: 'Nama Lengkap', type: 'text' },
  { id: 'f-2', label: 'Unit Kerja', type: 'text' },
  { id: 'f-3', label: 'Nomor WhatsApp', type: 'text' }
];

describe('participantName', () => {
  it('prefers the standard name keys', () => {
    expect(participantName({ 'f-name': '  Maria ', nama_panggilan: 'Mar' }, fields)).toBe('Maria');
  });
  it('falls back to a field labelled as a name', () => {
    expect(participantName({ 'f-1': 'Yohanes', 'f-2': 'IT' }, fields)).toBe('Yohanes');
  });
  it('reads label-keyed data from older submissions', () => {
    expect(participantName({ 'Nama Lengkap': 'Paulus' }, fields)).toBe('Paulus');
  });
  it('returns an empty string when there is no name', () => {
    expect(participantName({ 'f-2': 'IT' }, fields)).toBe('');
    expect(participantName(null, fields)).toBe('');
  });
});

describe('winnerNameFrom', () => {
  it('uses the first field answer when no name field exists', () => {
    expect(winnerNameFrom({ 'f-x': 'Kode 12' }, [{ id: 'f-x', label: 'Kode undian', type: 'text' }])).toBe('Kode 12');
  });
});

describe('fieldValue', () => {
  it('reads by label first, then by id', () => {
    expect(fieldValue({ 'Unit Kerja': 'Label', 'f-2': 'Id' }, fields[1])).toBe('Label');
    expect(fieldValue({ 'f-2': 'Id' }, fields[1])).toBe('Id');
  });
});

describe('participantInfo', () => {
  it('extracts name, unit and identifier with fallbacks', () => {
    expect(participantInfo({ id: 'sub-abcd1234', data: { 'f-1': 'Ester', unit: 'Treasury', whatsapp: '0812' } }, fields))
      .toEqual({ id: 'sub-abcd1234', name: 'Ester', department: 'Treasury', identifier: '0812' });
    expect(participantInfo({ id: 'sub-abcd1234', data: {} }, fields))
      .toEqual({ id: 'sub-abcd1234', name: 'Pendaftar #1234', department: 'Bank Mandiri', identifier: '-' });
  });
});
