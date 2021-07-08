import {
  isObject,
  Data,
  replayWithLatest,
  useGeneralDriver
} from '../libs/mobius-utils.js'

export const exitStateDriver = options => {
  const {
    pageOptions,
    enableExitState = false,
    autoEquip = false
  } = options

  if (!enableExitState) {
    return { inputs: {}, outputs: {}, others: {} }
  }

  if (!pageOptions.onLoad) {
    throw (new Error('"onLoad" method is required to be defined before pageOptions passed to exitStateDriver.'))
  }

  const exitStateInD = Data.of({})
  const exitStateRD = replayWithLatest(1, Data.empty())

  const equipPageOptions = pageOptions => {
    // 拦截 onLoad 方法并追加 exitState 相关的处理逻辑
    const _onLoad = pageOptions.onLoad
    pageOptions.onLoad = function (...args) {
      _onLoad.call(this, ...args)
      // 尝试获得上一次退出前 onSaveExitState 保存的数据
      const prevExitState = this.exitState
      // 如果是根据 restartStrategy 配置进行的冷启动，就可以获取到
      if (prevExitState !== undefined) {
        exitStateRD.triggerValue(prevExitState)
      }
    }

    if (!pageOptions.onSaveExitState) {
    // @refer: https:// developers.weixin.qq.com/miniprogram/dev/framework/runtime/operating-mechanism.html
      const onSaveExitState = function () {
        const state = exitStateInD.value
        if (state && isObject(state) && state.expireTimeStamp) {
          return { ...state }
        } else {
          return { data: state, expireTimeStamp: Date.now() + 24 * 60 * 60 * 1000 }
        }
      }
      pageOptions.onSaveExitState = onSaveExitState
    }
  }

  // ! side effects
  if (autoEquip) {
    equipPageOptions(pageOptions)
  }

  return {
    inputs: {
      exitState: exitStateInD
    },
    outputs: {
      exitState: exitStateRD
    },
    others: {
      equipPageOptions
    }
  }
}

export const useExitStateDriver = useGeneralDriver(exitStateDriver)
