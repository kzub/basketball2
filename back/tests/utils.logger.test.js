const logger = require('../utils/logger');
const utils = require('../utils/misc');

jest.mock('../utils/misc', () => {
  const original = jest.requireActual('../utils/misc');
  return {
    ...original,
    getConfig: jest.fn(() => ({
      logger: { loglevel: 'info' }
    }))
  };
});

describe('Utils Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create logger successfully', () => {
    const log = logger.create('TEST');
    expect(log).toBeDefined();
    expect(log.info).toBeInstanceOf(Function);
    expect(log.error).toBeInstanceOf(Function);
  });

  it('should format console output without req', () => {
    const log = logger.create('TEST');
    // just test that it doesn't crash
    log.info('test message');
    log.info({ object: 'message' }); // test object message
  });

  it('should format console output with req', () => {
    const log = logger.create(undefined, { id: '123' });
    log.info('test request message');
  });
});
