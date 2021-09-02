import {
  isString, isObject, isArray,
  Data,
  replayWithLatest,
  useGeneralDriver
} from '../libs/mobius-utils.js'

const currentPage = () => getCurrentPages().slice(-1)[0]

const formatLog = log => {
  if (isArray(log)) {
    if (log.length > 1) {
      log = { log }
    } else {
      log = log[0]
    }
  }

  if (isObject(log)) {
    return log
  } else {
    return { log }
  }
}
const validLogType = type => ['debug', 'info', 'warn', 'error'].includes(type) ? type : 'info'
const getStableLogger = logger => {
  logger = logger || console

  let logTag = 'MobiusMINA'

  const extraInfo = {}

  const filterMsg = new Set()
  const showFilterMsg = () => `[${[...filterMsg].join(' ')}]`
  const equipLog = log => ({ ...formatLog(log), _showFilterMsg: showFilterMsg(), ...extraInfo })

  return {
    debug (...args) {
      if (!logger || !logger.debug) return
      logger.debug(logTag, equipLog(args))
    },
    info (...args) {
      if (!logger || !logger.info) return
      logger.info(logTag, equipLog(args))
    },
    warn (...args) {
      if (!logger || !logger.warn) return
      logger.warn(logTag, equipLog(args))
    },
    error (...args) {
      if (!logger || !logger.error) return
      logger.error(logTag, equipLog(args))
    },
    getExtraInfo () {
      return extraInfo
    },
    getFilterMsg () {
      return [...filterMsg]
    },
    // 从基础库 2.7.3开始支持
    setFilterMsg: (() => {
      let prev = ''
      return function (msg) {
        if (!logger) return
        if (!msg) return
        if (typeof msg !== 'string') return

        filterMsg.delete(prev)
        filterMsg.add(msg)
        prev = msg

        if (logger.setFilterMsg) {
          logger.setFilterMsg(msg)
        }
      }
    })(),
    // 从基础库 2.8.1 开始支持
    addFilterMsg (...messages) {
      if (!logger) return
      if (messages.length === 0) return
      if (messages.length === 1 && isArray(messages[0])) {
        messages = messages[0]
      }

      messages.filter(isString).forEach(msg => {
        filterMsg.add(msg)
      })

      if (logger.addFilterMsg) {
        messages.filter(isString).forEach(msg => {
          logger.addFilterMsg(msg)
        })
      }
    },
    clearFilterMsg () {
      filterMsg.clear()
    },
    in (pageInstance) {
      if (!logger) return
      if (!pageInstance) return
      if (!isObject(pageInstance)) return
      const { name, route } = pageInstance
      extraInfo._name = name
      extraInfo._route = route

      if (logger.in) {
        logger.in(pageInstance)
      }
    },
    tag (tag) {
      if (!logger) return
      if (!tag) return
      if (typeof tag !== 'string') return
      logTag = tag

      if (logger.tag) {
        // 获得包装后的 RealtimeTagLogManager
        const newLogger = getStableLogger(logger.tag(tag))
        // 为 RealtimeTagLog 设置 LogTag
        newLogger.tag(tag)
        return newLogger
      }
    }
  }
}

export const loggerDriver = (options = {}) => {
  const {
    loggerLevel = 0
  } = options

  const logInRD = replayWithLatest(1, Data.empty())
  const realtimeLogInRD = replayWithLatest(1, Data.empty())
  const realtimeTagLogInRD = replayWithLatest(1, Data.empty())

  const logRD = replayWithLatest(1, Data.empty())
  const realtimeLogRD = replayWithLatest(1, Data.empty())
  const realtimeTagLogRD = replayWithLatest(1, Data.empty())

  // https://developers.weixin.qq.com/miniprogram/dev/api/base/debug/wx.getLogManager.html
  // 基础库 2.1.0 开始支持
  let logger = getStableLogger(wx.getLogManager({ level: loggerLevel }))
  // https://developers.weixin.qq.com/miniprogram/dev/api/base/debug/wx.getRealtimeLogManager.html
  // 基础库 2.7.1 开始支持
  const realtimeLoggers = new WeakMap()
  // 基础库 2.16.0 开始支持，只支持在插件中使用
  const realtimeTagLoggers = new WeakMap()

  logInRD.subscribeValue(value => {
    const formattedLog = formatLog(value)
    const {
      reset = false, page = currentPage(), type = 'info', tag = '', log, setFilterMsg, addFilterMsg, clearFilterMsg = false
    } = formattedLog
    if (reset) {
      logger = getStableLogger(wx.getLogManager({ level: loggerLevel }))
    }
    if (clearFilterMsg) {
      logger.clearFilterMsg()
    }
    logger.in(page)
    logger.tag(tag)
    logger.setFilterMsg(setFilterMsg)
    logger.addFilterMsg(addFilterMsg)
    logger[validLogType(type)](log)
    logRD.mutate(() => ({ page, type, tag, log, filterMsg: logger.getFilterMsg(), extraInfo: logger.getExtraInfo() }))
  })
  realtimeLogInRD.subscribeValue(value => {
    const formattedLog = formatLog(value)
    const {
      reset = false, page = currentPage(), type = 'info', tag = '', log, setFilterMsg, addFilterMsg, clearFilterMsg = false
    } = formattedLog

    let realtimeLogger = realtimeLoggers.get(page)

    if (page) {
      if (!realtimeLogger || reset || clearFilterMsg) {
        realtimeLogger = getStableLogger(wx.getRealtimeLogManager())
        realtimeLoggers.set(page, realtimeLogger)
      }
      realtimeLogger.in(page)
    } else {
      realtimeLogger = getStableLogger(wx.getRealtimeLogManager())
    }

    realtimeLogger.tag(tag)
    realtimeLogger.setFilterMsg(setFilterMsg)
    realtimeLogger.addFilterMsg(addFilterMsg)
    realtimeLogger[validLogType(type)](log)
    realtimeLogRD.mutate(() =>
      ({ page, type, tag, log, filterMsg: realtimeLogger.getFilterMsg(), extraInfo: realtimeLogger.getExtraInfo() })
    )
  })
  realtimeTagLogInRD.subscribeValue(value => {
    const formattedLog = formatLog(value)
    const {
      reset = false, page = currentPage(), type = 'info', tag, log, setFilterMsg, addFilterMsg, clearFilterMsg = false
    } = formattedLog
    const _tag = tag || 'MobiusMINA'

    let realtimeTagLogger = realtimeTagLoggers.get(_tag)

    if (!realtimeTagLogger || reset || clearFilterMsg) {
      realtimeTagLogger = getStableLogger(wx.getRealtimeLogManager()).tag(_tag)
      realtimeTagLoggers.set(_tag, realtimeTagLogger)
    }

    if (page) {
      realtimeTagLogger.in(page)
    }

    realtimeTagLogger.setFilterMsg(setFilterMsg)
    realtimeTagLogger.addFilterMsg(addFilterMsg)
    realtimeTagLogger[validLogType(type)](log)
    realtimeTagLogRD.mutate(() =>
      ({ page, type, tag, log, filterMsg: realtimeTagLogger.getFilterMsg(), extraInfo: realtimeTagLogger.getExtraInfo() })
    )
  })

  return {
    inputs: {
      log: logInRD,
      realtimeLog: realtimeLogInRD,
      realtimeTagLog: realtimeTagLogInRD
    },
    outputs: {
      log: logRD,
      realtimeLog: realtimeLogRD,
      realtimeTagLog: realtimeTagLogRD
    }
  }
}

export const useLoggerDriver = useGeneralDriver(loggerDriver)
