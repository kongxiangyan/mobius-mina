import {
  Data,
  replayWithLatest,
  binaryTweenPipeAtom
} from '../libs/mobius-utils.js'

export const appDriver = (options) => {
  const { defaultGlobalData = {} } = options

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
  const globalDataInD = Data.empty()
  const globalDataRD = replayWithLatest(1, Data.of(defaultGlobalData))
  binaryTweenPipeAtom(globalDataInD, globalDataRD)
  globalDataInD.subscribeValue(data => {
    getApp().globalData = data
  })

  // @refer: https://developers.weixin.qq.com/miniprogram/dev/reference/api/App.html
  const appOptions = {
    onLaunch (options) {
      appRD.triggerValue(this)
      launchRD.triggerValue(options)
    },
    onShow (options) {
      showRD.triggerValue(options)
    },
    onHide () {
      hideRD.triggerValue({})
    },
    onError (error) {
      errorRD.triggerValue(error)
    },
    onPageNotFound (res) {
      pageNotFoundRD.triggerValue(res)
    },
    onUnhandledRejection (res) {
      unhandledRejectionRD.triggerValue(res)
    },
    onThemeChange ({ theme }) {
      themeChangeRD.triggerValue({ theme, isDark: theme === 'dark', isLight: theme === 'light' })
    },
    globalData: defaultGlobalData
  }
  App(appOptions)

  return {
    inputs: {
      globalData: globalDataInD
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
      globalData: globalDataRD
    }
  }
}
