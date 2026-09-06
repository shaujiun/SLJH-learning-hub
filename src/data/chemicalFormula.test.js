import { describe, expect, it } from 'vitest'
import {
  commonPolyatomicIons,
  ionicCompounds,
  typicalIonElements,
} from './chemicalFormula.js'

describe('化學事前哨站題庫', () => {
  it('基礎模式包含十種典型元素及正確粒子數', () => {
    expect(typicalIonElements).toHaveLength(10)
    typicalIonElements.forEach((element) => {
      expect(element.shells.reduce((total, count) => total + count, 0)).toBe(element.atomicNumber)
      expect(element.ionShells.reduce((total, count) => total + count, 0)).toBe(element.atomicNumber - element.charge)
      expect(element.neutrons).toBeGreaterThan(0)
    })
  })

  it('一般模式只使用確認的八種常見根離子', () => {
    expect(commonPolyatomicIons.map((ion) => ion.name)).toEqual(expect.arrayContaining([
      '氫氧根', '銨根', '碳酸根', '碳酸氫根', '硫酸根', '醋酸根', '硝酸根', '鉻酸根',
    ]))
    expect(commonPolyatomicIons).toHaveLength(8)
  })

  it('進階化合物題庫電荷皆能互相抵銷，且題型不只五種', () => {
    expect(ionicCompounds.length).toBeGreaterThan(30)
    ionicCompounds.forEach((compound) => {
      const totalCharge = compound.cationCount * compound.cation.charge
        + compound.anionCount * compound.anion.charge
      expect(totalCharge).toBe(0)
    })
    expect(ionicCompounds.find((compound) => compound.id === 'lithium-chloride')?.formula).toBe('LiCl')
    expect(ionicCompounds.find((compound) => compound.id === 'potassium-chloride')?.formula).toBe('KCl')
    expect(ionicCompounds.find((compound) => compound.id === 'calcium-hydroxide')?.formula).toBe('Ca(OH)2')
  })
})

