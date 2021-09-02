import {
  Data,
  replayWithLatest,
  useGeneralDriver
} from '../libs/mobius-utils.js'

// 使用场景：独立分包
//  -> @refer: https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/independent.html
export const appEventsDriver = options => {
  const errorRD = replayWithLatest(1, Data.empty())
  const pageNotFoundRD = replayWithLatest(1, Data.empty())
  const unhandledRejectionRD = replayWithLatest(1, Data.empty())
  const themeChangeRD = replayWithLatest(1, Data.empty())
  const audioInterruptionBeginRD = replayWithLatest(1, Data.empty())
  const audioInterruptionEndRD = replayWithLatest(1, Data.empty())
  const appShowRD = replayWithLatest(1, Data.empty())
  const appHideRD = replayWithLatest(1, Data.empty())

  // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onError.html
  wx.onError(error => {
    errorRD.mutate(() => error)
  })
  // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onPageNotFound.html
  wx.onPageNotFound(res => {
    pageNotFoundRD.mutate(() => res)
  })
  // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html
  wx.onUnhandledRejection(res => {
    unhandledRejectionRD.mutate(() => res)
  })
  // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onThemeChange.html
  wx.onThemeChange(res => {
    themeChangeRD.mutate(() => res)
  })
  // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAudioInterruptionBegin.html
  wx.onAudioInterruptionBegin(() => {
    audioInterruptionBeginRD.mutate(() => ({}))
  })
  // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAudioInterruptionEnd.html
  wx.onAudioInterruptionEnd(() => {
    audioInterruptionEndRD.mutate(() => ({}))
  })
  // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAppShow.html
  wx.onAppShow(options => {
    appShowRD.mutate(() => options)
  })
  // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAppHide.html
  wx.onAppHide(() => {
    appHideRD.mutate(() => ({}))
  })

  return {
    inputs: {},
    outputs: {
      error: errorRD,
      pageNotFound: pageNotFoundRD,
      unhandledRejection: unhandledRejectionRD,
      themeChange: themeChangeRD,
      audioInterruptionBegin: audioInterruptionBeginRD,
      audioInterruptionEnd: audioInterruptionEndRD,
      appShow: appShowRD,
      appHide: appHideRD
    }
  }
}

export const useAppEventsDriver = useGeneralDriver(appEventsDriver)
