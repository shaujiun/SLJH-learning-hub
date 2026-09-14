export const functionDefenseMap = {
  accuse: { code: 'clarify', name: '澄清' },
  tempt: { code: 'gender_error', name: '性別錯誤' },
}

export function functionCardTargets(animals = [], functionCode, actorPlayerId) {
  if (functionCode === 'tame') {
    return animals.filter((animal) => !animal.revealed && !animal.ownerPlayerId)
  }
  if (functionCode === 'accuse' || functionCode === 'tempt') {
    return animals.filter((animal) => (
      animal.revealed && animal.ownerPlayerId && animal.ownerPlayerId !== actorPlayerId
    ))
  }
  return []
}

export function recalculateAnimalEquationPlayers(players = [], animals = []) {
  return players.map((player) => {
    const owned = animals.filter((animal) => animal.revealed && animal.ownerPlayerId === player.id)
    return {
      ...player,
      animalCount: owned.length,
      animalScore: owned.reduce((total, animal) => total + Number(animal.score || 0), 0),
    }
  })
}

export function resolveFunctionCardState({
  players = [], animals = [], actorPlayerId, targetAnimalId, functionCode, defended = false,
}) {
  const target = animals.find((animal) => animal.id === targetAnimalId)
  if (!target) throw new Error('animal_target_invalid')
  const allowedTargets = functionCardTargets(animals, functionCode, actorPlayerId)
  if (!allowedTargets.some((animal) => animal.id === targetAnimalId)) {
    throw new Error('animal_function_target_invalid')
  }

  let result = ''
  const nextAnimals = animals.map((animal) => {
    if (animal.id !== targetAnimalId) return { ...animal }
    if (functionCode === 'tame') {
      result = 'tame_success'
      return { ...animal, revealed: true, ownerPlayerId: actorPlayerId }
    }
    if (functionCode === 'accuse') {
      result = defended ? 'accuse_blocked' : 'accuse_success'
      return defended ? { ...animal } : { ...animal, revealed: false, ownerPlayerId: null }
    }
    result = defended ? 'tempt_blocked' : 'tempt_success'
    return defended ? { ...animal } : { ...animal, revealed: true, ownerPlayerId: actorPlayerId }
  })
  const nextPlayers = recalculateAnimalEquationPlayers(players, nextAnimals)
  const winner = nextPlayers.find((player) => player.animalCount >= 4 || player.animalScore >= 40) || null
  return { animals: nextAnimals, players: nextPlayers, result, winnerPlayerId: winner?.id || null }
}
