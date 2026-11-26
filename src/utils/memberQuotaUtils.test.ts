import { describe, expect, it } from 'vitest';
import { canDeleteRole, getTenureQuotaSummary, validateMemberQuota } from './memberQuotaUtils';

const T = 'tenure-2026';
const roles = [
  { id: 'r-ketua', tenureId: T, name: 'Ketua', level: 2, max: 1, requiresDivision: false },
  { id: 'r-ketdiv', tenureId: T, name: 'Ketua Divisi', level: 3, max: 1, requiresDivision: true }
];
const divisions = [{ id: 'd-acara', tenureId: T, name: 'Acara' }, { id: 'd-mm', tenureId: T, name: 'Multimedia' }];
const members = [{ id: 'm1', tenureId: T, roleId: 'r-ketua', role: 'Ketua', name: 'Andreas' }];

describe('validateMemberQuota', () => {
  it('uses the selected role id, not a role whose name is a prefix of it', () => {
    const r = validateMemberQuota({ tenureId: T, roleId: 'r-ketdiv', role: 'Ketua Divisi', divisionId: 'd-acara' }, members, divisions, {}, roles);
    expect(r.isValid).toBe(true);
  });
  it('still enforces the global quota of the role itself', () => {
    const r = validateMemberQuota({ tenureId: T, roleId: 'r-ketua', role: 'Ketua' }, members, divisions, {}, roles);
    expect(r.isValid).toBe(false);
  });
  it('enforces the per-division quota only within the same division', () => {
    const withLead = [...members, { id: 'm2', tenureId: T, roleId: 'r-ketdiv', role: 'Ketua Divisi', divisionId: 'd-acara', name: 'Maria' }];
    expect(validateMemberQuota({ tenureId: T, roleId: 'r-ketdiv', role: 'Ketua Divisi', divisionId: 'd-acara' }, withLead, divisions, {}, roles).isValid).toBe(false);
    expect(validateMemberQuota({ tenureId: T, roleId: 'r-ketdiv', role: 'Ketua Divisi', divisionId: 'd-mm' }, withLead, divisions, {}, roles).isValid).toBe(true);
  });
});

describe('role usage', () => {
  const withLead = [...members, { id: 'm2', tenureId: T, roleId: 'r-ketdiv', role: 'Ketua Divisi', divisionId: 'd-acara', name: 'Maria' }];
  it('counts members by role id, so "Ketua" does not include "Ketua Divisi"', () => {
    const summary = getTenureQuotaSummary(T, withLead, divisions, {}, roles);
    expect(summary.roles.find((r) => r.id === 'r-ketua')?.current).toBe(1);
    expect(summary.roles.find((r) => r.id === 'r-ketdiv')?.current).toBe(1);
  });
  it('blocks deleting a role that is still in use', () => {
    expect(canDeleteRole(roles[1], T, withLead).canDelete).toBe(false);
    expect(canDeleteRole(roles[0], T, [withLead[1]]).canDelete).toBe(true);
  });
  it('matches legacy members without a role id by name', () => {
    const legacy = [{ id: 'm3', tenureId: T, role: 'Ketua Divisi Acara', name: 'Lama', divisionId: 'd-acara' }];
    expect(canDeleteRole(roles[1], T, legacy).canDelete).toBe(false);
    expect(canDeleteRole(roles[0], T, legacy).canDelete).toBe(true);
  });
});
