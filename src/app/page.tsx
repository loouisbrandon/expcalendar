'use client'

import { useState, useMemo } from 'react'

type Experience = {
  id: number
  startDate: string
  endDate: string
}

type ExperienceResult = {
  id: number
  days: number
  periods: number
  remaining: number
  points: number
  hasError: boolean
  errorMessage?: string
}

export default function Home() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [hasDegree, setHasDegree] = useState<boolean>(false)
  const multiplier = 4.5 // Valor fixo

  const addExperience = () => {
    const newId = experiences.length > 0 
      ? Math.max(...experiences.map(e => e.id)) + 1 
      : 1
    setExperiences(prev => [...prev, { id: newId, startDate: '', endDate: '' }])
  }

  const removeExperience = (id: number) => {
    setExperiences(prev => prev.filter(exp => exp.id !== id))
  }

  // Função para converter DD/MM/YYYY para Date
  const parseDDMMYYYY = (dateStr: string): Date | null => {
    if (!dateStr) return null
    const parts = dateStr.split('/')
    if (parts.length !== 3) return null
    
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null
    
    const date = new Date(year, month - 1, day)
    // Valida se a data é válida (ex: 31/02 não é válido)
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return null
    }
    
    return date
  }

  // Função para aplicar máscara DD/MM/YYYY
  const applyDateMask = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 8 dígitos
    const limited = numbers.slice(0, 8)
    
    // Aplica a máscara
    if (limited.length === 0) {
      return ''
    } else if (limited.length <= 2) {
      return limited
    } else if (limited.length <= 4) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`
    } else {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`
    }
  }

  const updateExperience = (id: number, field: 'startDate' | 'endDate', value: string) => {
    const maskedValue = applyDateMask(value)
    setExperiences(prev => 
      prev.map(exp => exp.id === id ? { ...exp, [field]: maskedValue } : exp)
    )
  }

  const calculateExperience = (exp: Experience): ExperienceResult => {
    if (!exp.startDate || !exp.endDate) {
      return {
        id: exp.id,
        days: 0,
        periods: 0,
        remaining: 0,
        points: 0,
        hasError: false
      }
    }

    const startDateObj = parseDDMMYYYY(exp.startDate)
    const endDateObj = parseDDMMYYYY(exp.endDate)

    if (!startDateObj || !endDateObj) {
      return {
        id: exp.id,
        days: 0,
        periods: 0,
        remaining: 0,
        points: 0,
        hasError: true,
        errorMessage: 'Data inválida. Use o formato DD/MM/AAAA.'
      }
    }

    if (endDateObj <= startDateObj) {
      return {
        id: exp.id,
        days: 0,
        periods: 0,
        remaining: 0,
        points: 0,
        hasError: true,
        errorMessage: 'Data final deve ser maior que a data inicial.'
      }
    }

    const msPerDay = 1000 * 60 * 60 * 24
    const diffDays = Math.round((endDateObj.getTime() - startDateObj.getTime()) / msPerDay)
    const periods = Math.floor(diffDays / 180)
    const remaining = diffDays % 180
    const points = periods * multiplier

    return {
      id: exp.id,
      days: diffDays,
      periods,
      remaining,
      points,
      hasError: false
    }
  }

  const results = useMemo(() => {
    return experiences.map(exp => calculateExperience(exp))
  }, [experiences])

  const validResults = results.filter(r => !r.hasError && r.days > 0)

  const totalPeriods = useMemo(() => {
    return validResults.reduce((sum, r) => sum + r.periods, 0)
  }, [validResults])

  const totalPointsFromPeriods = useMemo(() => {
    return validResults.reduce((sum, r) => sum + r.points, 0)
  }, [validResults])

  const bonusPoints = hasDegree ? 10 : 0
  const totalPoints = totalPointsFromPeriods + bonusPoints

  const formatNumber = (num: number): string => {
    return num.toFixed(1).replace('.', ',')
  }

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 px-2">
            Calculadora de Pontuação por Experiência
          </h1>
          <p className="text-sm sm:text-base text-gray-400 px-2">
            Soma períodos de 180 dias de múltiplas experiências, aplica um multiplicador de pontos por período e adiciona bônus por curso superior.
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-5 md:p-6">
          {/* Header da calculadora */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium">
                Período base: 180 dias
              </span>
              <span className="inline-block bg-purple-600 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium">
                Multiplicador: 4,5 pontos
              </span>
            </div>
            <button
              onClick={addExperience}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors"
            >
              Adicionar experiência
            </button>
          </div>

          {/* Tabela de experiências */}
          {experiences.length > 0 && (
            <div className="mb-4 sm:mb-6 overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6">
              <div className="min-w-full inline-block align-middle">
                <table className="w-full border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap">#</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap">Data inicial</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap">Data final</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap">Dias</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap">Períodos</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap">Pontos</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {experiences.map((exp, index) => {
                      const result = results.find(r => r.id === exp.id)
                      return (
                        <tr key={exp.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium">{index + 1}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <input
                              type="text"
                              placeholder="DD/MM/AAAA"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                              maxLength={10}
                              className="w-full min-w-[120px] bg-gray-700 border border-gray-600 rounded px-2 sm:px-3 py-1.5 sm:py-1 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <input
                              type="text"
                              placeholder="DD/MM/AAAA"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                              maxLength={10}
                              className="w-full min-w-[120px] bg-gray-700 border border-gray-600 rounded px-2 sm:px-3 py-1.5 sm:py-1 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                            {result && result.days > 0 ? result.days : '-'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                            {result && result.days > 0 ? result.periods : '-'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                            {result && result.days > 0 ? formatNumber(result.points) : '-'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <button
                              onClick={() => removeExperience(exp.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1.5 sm:py-1 rounded text-xs sm:text-sm transition-colors whitespace-nowrap"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mensagens de erro */}
          {results.some(r => r.hasError) && (
            <div className="mb-4 sm:mb-6 bg-red-900/30 border border-red-600 rounded-lg p-3 sm:p-4">
              <h3 className="text-red-400 font-medium mb-2 text-sm sm:text-base">Erros encontrados:</h3>
              <ul className="list-disc list-inside text-xs sm:text-sm text-red-300 space-y-1">
                {results
                  .filter(r => r.hasError)
                  .map((r, index) => {
                    const expIndex = experiences.findIndex(e => e.id === r.id) + 1
                    return (
                      <li key={r.id}>
                        Experiência {expIndex}: {r.errorMessage}
                      </li>
                    )
                  })}
              </ul>
            </div>
          )}

          {/* Curso superior */}
          <div className="mb-4 sm:mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasDegree}
                onChange={(e) => setHasDegree(e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 flex-shrink-0"
              />
              <span className="ml-2 text-xs sm:text-sm font-medium">
                Possui curso superior? (+10 pontos)
              </span>
            </label>
          </div>

          {/* Seção de resultados */}
          {experiences.length > 0 && (
            <div className="mt-6 sm:mt-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">Resultados</h2>
              
              {/* Cards de resultado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {/* Card 1 - Períodos totais */}
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-1">
                    Períodos totais (todas as experiências)
                  </h3>
                  <p className="text-xl sm:text-2xl font-bold text-white">{totalPeriods}</p>
                </div>

                {/* Card 2 - Pontos por períodos */}
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-1">
                    Pontos por períodos
                  </h3>
                  <p className="text-xl sm:text-2xl font-bold text-white">{formatNumber(totalPointsFromPeriods)}</p>
                  <p className="text-xs text-gray-500 mt-1">Períodos × multiplicador</p>
                </div>

                {/* Card 3 - Bônus curso superior */}
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-1">
                    Bônus curso superior
                  </h3>
                  <p className="text-xl sm:text-2xl font-bold text-white">{bonusPoints}</p>
                </div>

                {/* Card 4 - Pontuação total */}
                <div className="bg-blue-600 rounded-lg p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-200 mb-1">
                    Pontuação total
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{formatNumber(totalPoints)}</p>
                </div>
              </div>

              {/* Lista detalhada por experiência */}
              {validResults.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">Detalhamento por experiência:</h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {validResults.map((result, index) => {
                      const expIndex = experiences.findIndex(e => e.id === result.id) + 1
                      return (
                        <li key={result.id} className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                          Experiência {expIndex}: {result.days} dia(s) ({result.periods} período(s) de 180 dias, {result.remaining} dia(s) remanescente(s)) → {formatNumber(result.points)} pontos
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

