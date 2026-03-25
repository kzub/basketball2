import datetimeMixin from '@/mixins/datetime.js'

describe('datetime.js mixin', () => {
  const { methods } = datetimeMixin

  describe('mxDateWeekDay', () => {
    it('returns the correct day of the week in Russian', () => {
      // 2023-10-10 is a Tuesday
      expect(methods.mxDateWeekDay('2023-10-10')).toBe('Вторник')
      // 2023-10-15 is a Sunday
      expect(methods.mxDateWeekDay('2023-10-15')).toBe('Воскресенье')
    })
  })

  describe('mxDateDayAndMonth', () => {
    it('returns formatted day and month', () => {
      expect(methods.mxDateDayAndMonth('2023-01-05')).toBe('5 января')
      expect(methods.mxDateDayAndMonth('2023-12-31')).toBe('31 декабря')
    })
  })

  describe('mxMonth', () => {
    it('returns correct month name in nominative case', () => {
      expect(methods.mxMonth('2023-03-15')).toBe('март')
      expect(methods.mxMonth('2023-08-01')).toBe('август')
    })
  })

  describe('mxDateDiff', () => {
    it('calculates the difference between two dates in days', () => {
      expect(methods.mxDateDiff('2023-10-15', '2023-10-10')).toBe(5)
      expect(methods.mxDateDiff('2023-10-10', '2023-10-15')).toBe(-5)
      expect(methods.mxDateDiff('2023-10-10', '2023-10-10')).toBe(0)
    })
  })
})
