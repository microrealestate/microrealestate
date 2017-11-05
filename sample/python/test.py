''' Displays hello world each second '''
import time
import logging

logger = logging.getLogger('test')
logger.setLevel(logging.DEBUG)
logFormatter = logging.Formatter("%(asctime)s [%(levelname)-5.5s]  %(message)s")
consoleHandler = logging.StreamHandler()
consoleHandler.setFormatter(logFormatter)
logger.addHandler(consoleHandler)

def main():
    ''' main function '''
    index = 0
    while True:
        message = 'hello world %s' % (index,)
        if index % 2:
            logger.error(message)
        else:
            logger.info(message)
        index = index + 1
        time.sleep(1)

if __name__ == '__main__':
    main()
