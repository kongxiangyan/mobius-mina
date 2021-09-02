import {
  Data,
  replayWithLatest,
  useGeneralDriver
} from '../libs/mobius-utils.js'

export const pageShareDriver = options => {
  const {
    pageOptions,
    enableShareAppMessage = false, enableShareTimeline = false, enableAddToFavorites = false,
    autoEquip = false
  } = options

  if (!enableShareAppMessage && !enableShareTimeline && !enableAddToFavorites) {
    return { inputs: {}, outputs: {}, others: {} }
  }

  const shareAppMessageInfoInD = Data.of({})
  const shareTimelineInfoInD = Data.of({})
  const addToFavoritesInfoInD = Data.of({})

  const shareAppMessageRD = replayWithLatest(1, Data.empty())
  const shareTimelineRD = replayWithLatest(1, Data.empty())
  const addToFavoritesRD = replayWithLatest(1, Data.empty())

  const equipPageOptions = pageOptions => {
    // @refer: https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onShareAppMessage-Object-object
    if (enableShareAppMessage && !pageOptions.onShareAppMessage) {
      pageOptions.onShareAppMessage = function (res) {
        // TODO: 提供更多的分享信息
        shareAppMessageRD.mutate(() => res)
        const shareInfo = shareAppMessageInfoInD.value
        return { ...shareInfo }
      }
    }
    // @refer: https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onShareTimeline
    if (enableShareTimeline && !pageOptions.onShareTimeline) {
      pageOptions.onShareTimeline = function () {
        // TODO: 提供更多的分享信息
        shareTimelineRD.mutate(() => ({}))
        const shareInfo = shareTimelineInfoInD.value
        return { ...shareInfo }
      }
    }
    // @refer: https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onAddToFavorites-Object-object
    if (enableAddToFavorites && !pageOptions.onAddToFavorites) {
      pageOptions.onAddToFavorites = function (res) {
        // TODO: 提供更多的分享信息
        addToFavoritesRD.mutate(() => res)
        const addInfo = addToFavoritesInfoInD.value
        return { ...addInfo }
      }
    }
  }

  // ! side effects
  if (autoEquip) {
    equipPageOptions(pageOptions)
  }

  return {
    inputs: {
      shareAppMessageInfo: shareAppMessageInfoInD,
      shareTimelineInfo: shareTimelineInfoInD,
      addToFavorites: addToFavoritesInfoInD
    },
    outputs: {
      shareAppMessage: shareAppMessageRD,
      shareTimeline: shareTimelineRD,
      addToFavorites: addToFavoritesRD
    },
    others: {
      equipPageOptions
    }
  }
}

export const usePageShareDriver = useGeneralDriver(pageShareDriver)
