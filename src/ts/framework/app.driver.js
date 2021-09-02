import {
  Data,
  replayWithLatest,
  useGeneralDriver
} from '../libs/mobius-utils.js'
import { appRD as globalAppRD } from '../global.js'
import { equipLifetimes } from './equipLifetimes.js'

const RESERVED_APP_METHOD_NAMES = [
  'onLaunch', 'onShow', 'onHide', 'onError', 'onPageNotFound', 'onUnhandledRejection', 'onThemeChange', 'globalData'
]
const deepCopyViaJSON = obj => JSON.parse(JSON.stringify(obj))

export const appDriver = (options) => {
  const {
    defaultGlobalData = {},
    config: {
      isOverwriteReserved = false
    } = {},
    lifetimes = {},
    ...others
  } = options

  const launchRD = replayWithLatest(1, Data.empty())
  const showRD = replayWithLatest(1, Data.empty())
  const hideRD = replayWithLatest(1, Data.empty())
  const errorRD = replayWithLatest(1, Data.empty())
  const pageNotFoundRD = replayWithLatest(1, Data.empty())
  const unhandledRejectionRD = replayWithLatest(1, Data.empty())
  const themeChangeRD = replayWithLatest(1, Data.empty())

  // @refer: https://developers.weixin.qq.com/miniprogram/dev/reference/api/getApp.html
  const appRD = replayWithLatest(1, Data.empty())

  // 跟官方文档的指示保持一致，在 appInstance 中预置一个 globalData 字段用于保存全局数据
  const globalDataInRD = replayWithLatest(1, Data.of(defaultGlobalData))
  const globalDataChangeRD = replayWithLatest(1, Data.of({ prev: null, cur: null, change: null }))
  const globalDataOutRD = replayWithLatest(1, Data.empty())
  globalDataInRD.subscribeValue(data => {
    const app = getApp({ allowDefault: true })

    const prevData = deepCopyViaJSON(app.globalData)
    app.setGlobalData(data)
    const curData = deepCopyViaJSON(app.globalData)

    globalDataOutRD.mutate(() => curData)
    globalDataChangeRD.mutate(() => ({ prev: prevData, cur: curData, change: deepCopyViaJSON(data) }))
  })

  // 检测 others 中保留的方法名，重名的时候进行提示
  const namesOfOthers = Object.keys(others)
  const reservedNamesInOthers = namesOfOthers.filter(name => RESERVED_APP_METHOD_NAMES.includes(name))
  if (reservedNamesInOthers.length > 0 && !isOverwriteReserved) {
    console.warn(`[MobiusMINA] app - reserved names detected in others definition: ${JSON.stringify(reservedNamesInOthers)}.`)
  }

  // @refer: https://developers.weixin.qq.com/miniprogram/dev/reference/api/App.html
  const appOptions = {
    onLaunch (options) {
      globalAppRD.mutate(() => this)
      appRD.mutate(() => this)
      launchRD.mutate(() => options)
    },
    onShow (options) {
      showRD.mutate(() => options)
    },
    onHide () {
      hideRD.mutate(() => ({}))
    },
    onError (error) {
      errorRD.mutate(() => error)
    },
    onPageNotFound (res) {
      pageNotFoundRD.mutate(() => res)
    },
    onUnhandledRejection (res) {
      unhandledRejectionRD.mutate(() => res)
    },
    // @refer: https://developers.weixin.qq.com/miniprogram/dev/reference/api/App.html#onThemeChange-Object-object
    onThemeChange (res) {
      themeChangeRD.mutate(() => res)
    },
    // 这里的 globalData 实际上是没有用的，会被 App 默认实现中定义的同名字段覆盖掉
    // 之所以把这个“没用”的东西留下来是为了完整性考虑，当其它部分出问题的时候，仍然可以降级发挥作用
    globalData: defaultGlobalData,
    ...others
  }

  // ! 会修改 appOptions
  equipLifetimes(appOptions, lifetimes)

  App(appOptions)

  return {
    inputs: {
      globalData: globalDataInRD
    },
    outputs: {
      app: appRD,
      launch: launchRD,
      show: showRD,
      hide: hideRD,
      error: errorRD,
      pageNotFound: pageNotFoundRD,
      unhandledRejection: unhandledRejectionRD,
      themeChange: themeChangeRD,
      globalData: globalDataOutRD,
      globalDataChange: globalDataChangeRD
    }
  }
}

export const useAppDriver = useGeneralDriver(appDriver)
