import {
  Data,
  replayWithLatest,
  useGeneralDriver
} from '../../libs/mobius-utils.js'

export const appEventsDriver = options => {
  const errorRD = replayWithLatest(1, Data.empty())
  const pageNotFoundRD = replayWithLatest(1, Data.empty())
  const unhandledRejectionRD = replayWithLatest(1, Data.empty())
  const themeChangeRD = replayWithLatest(1, Data.empty())
  const audioInterruptionBeginRD = replayWithLatest(1, Data.empty())
  const audioInterruptionEndRD = replayWithLatest(1, Data.empty())
  const appShowRD = replayWithLatest(1, Data.empty())
  const appHideRD = replayWithLatest(1, Data.empty())

  wx.onError(error => {
    errorRD.mutate(() => error)
  })
  wx.onPageNotFound(res => {
    pageNotFoundRD.mutate(() => res)
  })
  wx.onUnhandledRejection(res => {
    unhandledRejectionRD.mutate(() => res)
  })
  wx.onThemeChange(res => {
    themeChangeRD.mutate(() => res)
  })
  wx.onAudioInterruptionBegin(() => {
    audioInterruptionBeginRD.mutate(() => ({}))
  })
  wx.onAudioInterruptionEnd(() => {
    audioInterruptionEndRD.mutate(() => ({}))
  })
  wx.onAppShow(options => {
    appShowRD.mutate(() => options)
  })
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
