// New deterministic roles: beneficiary_or_result_list + technical_form (SQ + EN),
// with precedence proofs (a result list is never a public call; a technical form is a
// budget template only when the label/file identifies it as one).
import { describe, it, expect } from 'vitest'
import { classifyAttachmentRole, roleProvidesCallRequirements } from './role'

describe('attachment role — beneficiary/result list', () => {
  it('classifies Albanian + English result/beneficiary/participant lists', () => {
    expect(classifyAttachmentRole('Lista e përfituesve')).toBe('beneficiary_or_result_list')
    expect(classifyAttachmentRole('Lista e pjesëmarrësve')).toBe('beneficiary_or_result_list')
    expect(classifyAttachmentRole('List of beneficiaries 2026')).toBe('beneficiary_or_result_list')
  })
  it('a result list is NEVER treated as an active public call', () => {
    expect(classifyAttachmentRole('Lista e përfituesve - Thirrje Publike 2026')).toBe('beneficiary_or_result_list')
    expect(roleProvidesCallRequirements('beneficiary_or_result_list')).toBe(false)
    expect(roleProvidesCallRequirements('public_call')).toBe(true)
  })
})

describe('attachment role — technical form vs budget template', () => {
  it('“Formulari teknik” → technical_form', () => {
    expect(classifyAttachmentRole('Formulari teknik')).toBe('technical_form')
    expect(classifyAttachmentRole('Technical form - Measure 1')).toBe('technical_form')
  })
  it('a technical form that is specifically a budget → budget_template', () => {
    expect(classifyAttachmentRole('Formulari teknik i buxhetit')).toBe('budget_template')
    expect(classifyAttachmentRole('Sistemet solare - Formulari teknik - Masa 1', 'budget.xlsx')).toBe('budget_template')
  })
})

describe('attachment role — regression of the original set', () => {
  it('still classifies the core roles', () => {
    expect(classifyAttachmentRole('THIRRJE PUBLIKE PËR PËRKRAHJE')).toBe('public_call')
    expect(classifyAttachmentRole('Udhëzues për aplikim')).toBe('guideline')
    expect(classifyAttachmentRole('Deklaratë në betim')).toBe('declaration')
    expect(classifyAttachmentRole('Formular aplikimi')).toBe('application_form')
    expect(classifyAttachmentRole('Aneks 1')).toBe('annex')
    expect(classifyAttachmentRole('Diçka tjetër')).toBe('other')
  })
})
