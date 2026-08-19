import { useState } from 'react'
import usePollsStore from '../store/pollsStore'
import './PollForm.css'

const PollForm = ({ onCreated }) => {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [allowsMultiple, setAllowsMultiple] = useState(false)
  const [endsAt, setEndsAt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { createPoll, error, clearError } = usePollsStore()

  const updateOption = (index, value) => {
    setOptions((prev) => {
      const copy = [...prev]
      copy[index] = value
      return copy
    })
  }

  const addOption = () => {
    if (options.length >= 10) return
    setOptions([...options, ''])
  }

  const removeOption = (index) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = options.map((o) => String(o).trim()).filter(Boolean)
    if (!question.trim() || trimmed.length < 2) {
      clearError()
      return
    }
    setIsLoading(true)
    clearError()
    const result = await createPoll(question.trim(), trimmed, { allowsMultiple, endsAt })
    setIsLoading(false)
    if (result.success) {
      setQuestion('')
      setOptions(['', ''])
      setAllowsMultiple(false)
      setEndsAt('')
      onCreated && onCreated(result.poll)
    }
  }

  return (
    <form className="poll-form" onSubmit={handleSubmit}>
      <h3 className="poll-form__title">Новый опрос</h3>

      <input
        className="poll-form__input"
        placeholder="Вопрос опроса"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={isLoading}
        required
      />

      <div className="poll-form__options">
        {options.map((opt, i) => (
          <div key={i} className="poll-form__option-row">
            <input
              className="poll-form__option-input"
              placeholder={`Вариант ${i + 1}`}
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              disabled={isLoading}
            />
            {options.length > 2 && (
              <button
                type="button"
                className="poll-form__remove"
                onClick={() => removeOption(i)}
                disabled={isLoading}
                aria-label={`Убрать вариант ${i + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="poll-form__settings">
        <label className="poll-form__checkbox-label">
          <input
            type="checkbox"
            checked={allowsMultiple}
            onChange={(e) => setAllowsMultiple(e.target.checked)}
            disabled={isLoading}
          />
          Множественный выбор
        </label>

        <div className="poll-form__datetime">
          <label>
            Завершить опрос:
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              disabled={isLoading}
              min={new Date().toISOString().slice(0, 16)}
            />
          </label>
        </div>
      </div>

      <div className="poll-form__actions">
        <button type="button" className="poll-form__btn poll-form__btn--add" onClick={addOption} disabled={isLoading || options.length >= 10}>
          + Добавить вариант
        </button>
        <button className="poll-form__btn poll-form__btn--submit" disabled={isLoading || !question.trim()}>
          {isLoading ? 'Публикация…' : 'Создать опрос'}
        </button>
      </div>

      {error && <div className="poll-form__error">{error}</div>}
    </form>
  )
}

export default PollForm

